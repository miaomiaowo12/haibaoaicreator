import type { Context, Config } from "@netlify/functions";
import { getStore } from '@netlify/blobs';
import { 
  getPosterTypeSkill,
  getStyleSkill,
  getGeneralSuffix,
  getFestivalSkill,
  getSystemSkill
} from '../../src/lib/promptEnhancer';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Background Function - can run up to 15 minutes
export default async (req: Request, context: Context) => {
  console.log('[Background] Function invoked', new Date().toISOString());
  
  try {
    const body = await req.json();
    const { jobId, prompt, posterType, style, messages, backgroundImage, mode, selectedImage } = body;

    console.log(`[Background] Starting job ${jobId}`, { prompt: prompt?.substring(0, 50) });

    // Validate jobId
    if (!jobId) {
      console.error('[Background] Missing jobId');
      return new Response(JSON.stringify({ error: 'Missing jobId' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const store = getStore('job-queue');
    
    // Update status to processing
    await store.setJSON(jobId, {
      status: 'processing',
      createdAt: Date.now(),
    });
    console.log(`[Background] Job ${jobId}: Status updated to processing`);

    const apiKey = process.env.DOUBAO_API_KEY;
    if (!apiKey) {
      console.error('[Background] API key not configured');
      await store.setJSON(jobId, {
        status: 'failed',
        error: 'API密钥未配置',
        createdAt: Date.now(),
      });
      return new Response(null, { status: 202 });
    }

    // ============================================================
    // 指令生成公式：整合所有 7 个 Skills 要点
    // ============================================================
    
    // 1. System Skill - 设定AI角色和专业定位
    let enhancedPrompt = `${getSystemSkill()}。`;
    
    // 2. Poster Type Skill - 海报类型定位
    const posterTypeSkill = getPosterTypeSkill(posterType);
    if (posterTypeSkill) {
      enhancedPrompt += `【海报类型】${posterTypeSkill}。`;
    } else {
      enhancedPrompt += `【海报类型】通用创意海报，画面美观协调，元素贴合主题，构图合理。`;
    }
    
    // 3. Style Skill - 视觉风格定义
    const styleSkill = getStyleSkill(style);
    if (styleSkill) {
      enhancedPrompt += `【视觉风格】${styleSkill}。`;
    }
    
    // 4. Festival Skill - 节日主题识别（从用户需求中提取）
    const festivalSkill = getFestivalSkill(prompt);
    if (festivalSkill) {
      enhancedPrompt += `【节日主题】${festivalSkill}。`;
    }
    
    // 5. 用户核心需求提取
    enhancedPrompt += `【用户需求】${prompt}。`;
    
    // 提取用户明确要求的文字内容（引号内的内容）
    const textMatch = prompt.match(/[""「」『』【】]([^""「」『』【】]+)[""「」『』【】]/);
    if (textMatch) {
      enhancedPrompt += `【指定文字】海报中必须显示的文字："${textMatch[1]}"，严禁添加其他任何文字。`;
    }
    
    // 6. General Suffix - 通用质量要求
    enhancedPrompt += `【质量要求】${getGeneralSuffix()}。`;
    
    // 7. 严格规则 - 强制约束条件
    enhancedPrompt += `【严格约束】`;
    enhancedPrompt += `1.文字纯净：仅显示用户明确要求的内容，禁止出现任何用户未提及的文字、数字、日期、地址、人名、电话、邮箱；`;
    enhancedPrompt += `2.禁止元素：不得出现平台名称（抖音、小红书、微信等）、设计说明类文字（海报设计、爆款、新品等）、水印签名、装饰性字母、无关符号；`;
    enhancedPrompt += `3.文字标准：所有文字必须清晰可读，字体大小适中，标题醒目正文清晰，边缘锐利无模糊，印刷级清晰度，无锯齿无毛边，字体端正不倾斜不变形；`;
    enhancedPrompt += `4.排版规范：文字对齐整齐，间距合理，层级分明，整体协调美观；`;
    enhancedPrompt += `5.画面纯净：画面干净整洁，无多余装饰文字，无乱码，无模糊字符，无不可识别的符号。`;

    // 处理对话上下文（如果有）
    let contextSummary = '';
    if (messages && messages.length > 1) {
      const recentMessages = messages.slice(-10);
      contextSummary = recentMessages
        .map((m: ChatMessage) => m.role === 'user' ? `用户：${m.content}` : `助手：${m.content}`)
        .join(' | ');
    }
    
    if (contextSummary) {
      enhancedPrompt = `【对话历史】${contextSummary}【当前任务】${enhancedPrompt}`;
    }

    // 参考背景图（如果有）
    if (backgroundImage) {
      enhancedPrompt = `【参考图片】请参照用户上传的背景图风格和构图进行创作。${enhancedPrompt}`;
    }

    console.log('[Background] 原始提示词:', prompt);
    console.log('[Background] 完整增强提示词:', enhancedPrompt.substring(0, 300) + '...');
    console.log(`[Background] Job ${jobId}: Prompt length: ${enhancedPrompt.length}`);

    // Build request body
    const hasImage = !!backgroundImage || !!selectedImage;
    const size = hasImage ? '2048x2048' : '2K';
    
    const requestBody: Record<string, unknown> = {
      model: 'doubao-seedream-4-5-251128',
      prompt: enhancedPrompt,
      size: size,
      response_format: 'url',
    };

    if (selectedImage) {
      requestBody.image = selectedImage;
    } else if (backgroundImage) {
      requestBody.image = backgroundImage;
    }

    console.log(`[Background] Job ${jobId}: Calling Doubao API...`);
    
    // Call Doubao API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      console.log(`[Background] Job ${jobId}: API response status ${response.status}`);

      if (!response.ok) {
        const errorMsg = data.message || data.error?.message || '图片生成失败';
        console.error(`[Background] Job ${jobId}: API error:`, errorMsg);
        await store.setJSON(jobId, {
          status: 'failed',
          error: errorMsg,
          createdAt: Date.now(),
        });
        return new Response(null, { status: 202 });
      }

      // Store successful result
      const result = {
        url: data.data?.[0]?.url,
        model: data.model,
        size: data.data?.[0]?.size,
      };
      
      await store.setJSON(jobId, {
        status: 'completed',
        result,
        createdAt: Date.now(),
      });

      console.log(`[Background] Job ${jobId}: Completed successfully`, { url: result.url?.substring(0, 50) });
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error(`[Background] Job ${jobId}: API call timed out`);
        await store.setJSON(jobId, {
          status: 'failed',
          error: 'API调用超时（60秒）',
          createdAt: Date.now(),
        });
      } else {
        throw fetchError;
      }
    }
    
  } catch (error) {
    console.error('[Background] Unexpected error:', error);
    // Try to update job status if we have a jobId
    try {
      const body = await req.clone().json();
      if (body.jobId) {
        const store = getStore('job-queue');
        await store.setJSON(body.jobId, {
          status: 'failed',
          error: error instanceof Error ? error.message : '未知错误',
          createdAt: Date.now(),
        });
      }
    } catch {
      // Ignore errors here
    }
  }

  // Background functions return 202 immediately
  return new Response(null, { status: 202 });
};

export const config: Config = {
  // No custom path needed - will be available at /.netlify/functions/generate-background
};
