import type { Context, Config } from "@netlify/functions";
import { getStore } from '@netlify/blobs';
import { 
  getPosterTypeSkill,
  getStyleSkill,
  getGeneralSuffix,
  getFestivalSkill
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

    // Build prompt: 海报类型 Skill + 风格 Skill + 通用后缀 + 用户输入 + 节日 Skill
    const promptParts: string[] = [];
    
    // 1. 海报类型 Skill
    const posterTypeSkill = getPosterTypeSkill(posterType);
    if (posterTypeSkill) {
      promptParts.push(posterTypeSkill);
    } else {
      promptParts.push('通用创意海报，画面美观协调，元素贴合主题，构图合理');
    }
    
    // 2. 风格 Skill
    const styleSkill = getStyleSkill(style);
    if (styleSkill) {
      promptParts.push(styleSkill);
    }
    
    // 3. 通用后缀
    promptParts.push(getGeneralSuffix());
    
    // 4. 用户输入的要求内容提取
    promptParts.push(`用户需求：${prompt}`);
    
    // 5. 节日 Skill（从用户输入中识别）
    const festivalSkill = getFestivalSkill(prompt);
    if (festivalSkill) {
      promptParts.push(festivalSkill);
    }

    const hasImage = !!backgroundImage || !!selectedImage;
    const size = hasImage ? '2048x2048' : '2K';

    let enhancedPrompt = promptParts.join('，');
    
    // 处理对话上下文
    let contextSummary = '';
    if (messages && messages.length > 1) {
      const recentMessages = messages.slice(-10);
      contextSummary = recentMessages
        .map((m: ChatMessage) => m.role === 'user' ? `用户：${m.content}` : `助手：${m.content}`)
        .join(' | ');
    }
    
    if (contextSummary) {
      enhancedPrompt = `【对话上下文】${contextSummary}【当前需求】${enhancedPrompt}`;
    }

    if (backgroundImage) {
      enhancedPrompt = `参考用户上传的背景图风格和构图，${enhancedPrompt}`;
    }

    // 提取用户明确要求的文字内容
    const textMatch = prompt.match(/[""「」『』【】]([^""「」『』【】]+)[""「」『』【】]/);
    if (textMatch) {
      enhancedPrompt += `。用户明确要求的文字内容："${textMatch[1]}"，仅显示此文字，不添加其他任何文字`;
    }

    // 严格规则
    enhancedPrompt += '。【严格规则】1.文字内容：海报中只能出现用户明确要求展示的文字内容，禁止添加任何用户未提及的文字；2.禁止出现：平台名称（抖音、小红书、微信等）、设计说明（海报设计、爆款、新品等）、随机数字、日期时间地点（除非用户提供）、水印签名、装饰性字母、无关符号；3.文字质量：所有文字必须清晰可读，字体大小适中（标题字号大、正文字号适中），边缘锐利无模糊，印刷级清晰度，无锯齿无毛边，字体端正不倾斜不变形；4.文字排版：文字对齐整齐，间距合理，层级分明，标题醒目，正文清晰，整体协调美观；5.纯净画面：画面干净整洁，无多余装饰文字，无乱码，无模糊字符，无不可识别的符号';

    console.log('[Background] 原始提示词:', prompt);
    console.log('[Background] 增强后提示词:', enhancedPrompt.substring(0, 200) + '...');

    // Build request body AFTER all prompt enhancements
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
    console.log(`[Background] Job ${jobId}: Prompt length: ${enhancedPrompt.length}`);
    
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

