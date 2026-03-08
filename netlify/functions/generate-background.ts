import type { Context, Config } from "@netlify/functions";
import { getStore } from '@netlify/blobs';
import { 
  getPosterTypeSkill,
  getColorSchemeSkill,
  getTypographySkill,
  getSystemSkill,
  getFestivalSkill
} from '../../src/lib/promptEnhancer';
import { recommendColorScheme } from '../../src/lib/designTemplates';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Background Function - can run up to 15 minutes
export default async (req: Request, context: Context) => {
  console.log('[Background] Function invoked', new Date().toISOString());
  
  try {
    const body = await req.json();
    const { jobId, prompt, posterType, colorScheme, typography, messages, backgroundImage, mode, selectedImage } = body;

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

    // Build prompt using the same logic as the original
    const finalColorScheme = colorScheme || (posterType ? recommendColorScheme(posterType) : null);

    let contextSummary = '';
    if (messages && messages.length > 1) {
      const recentMessages = messages.slice(-10);
      contextSummary = recentMessages
        .map((m: ChatMessage) => m.role === 'user' ? `用户：${m.content}` : `助手：${m.content}`)
        .join(' | ');
    }

    const promptParts: string[] = [];
    promptParts.push(`用户需求：${prompt}`);

    const festivalSkill = getFestivalSkill(prompt);
    if (festivalSkill) promptParts.push(festivalSkill);

    const posterTypeSkill = getPosterTypeSkill(posterType);
    if (posterTypeSkill) promptParts.push(posterTypeSkill);

    const colorSchemeSkill = getColorSchemeSkill(finalColorScheme);
    if (colorSchemeSkill) promptParts.push(colorSchemeSkill);

    const typographySkill = getTypographySkill(typography);
    if (typographySkill) promptParts.push(typographySkill);

    const hasImage = !!backgroundImage || !!selectedImage;
    const size = hasImage ? '2048x2048' : '2K';
    
    promptParts.push(`高清 2048×2048 分辨率，商业级质感，文字清晰可辨，光影精致，主体突出，背景简洁`);

    let enhancedPrompt = promptParts.join('；');
    const systemSkill = getSystemSkill();
    enhancedPrompt = `${systemSkill}。${enhancedPrompt}`;

    if (contextSummary) {
      enhancedPrompt = `【对话上下文】${contextSummary}【当前需求】${enhancedPrompt}`;
    }

    if (backgroundImage) {
      enhancedPrompt = `参考用户上传的背景图风格和构图，${enhancedPrompt}`;
    }

    // Build request body
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
