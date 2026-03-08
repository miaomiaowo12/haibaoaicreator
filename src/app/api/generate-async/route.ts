import { NextRequest, NextResponse } from 'next/server';
import { 
  getPosterTypeSkill,
  getColorSchemeSkill,
  getTypographySkill,
  getSystemSkill,
  getFestivalSkill
} from '@/lib/promptEnhancer';
import { recommendColorScheme } from '@/lib/designTemplates';
import { createJob, updateJob } from '@/lib/jobQueue';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Edge Runtime for streaming support
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, posterType, colorScheme, typography, messages, backgroundImage, mode, selectedImage } = body;

    // 创建任务
    const jobId = createJob();
    console.log('创建异步任务:', jobId);

    // 立即返回 jobId
    const response = NextResponse.json({
      success: true,
      jobId,
      message: '任务已提交，请轮询查询状态'
    });

    // 在后台执行生成任务（不阻塞响应）
    generateImageAsync(jobId, {
      prompt,
      posterType,
      colorScheme,
      typography,
      messages,
      backgroundImage,
      mode,
      selectedImage,
    });

    return response;
    
  } catch (error) {
    console.error('提交异步任务失败:', error);
    return NextResponse.json(
      { error: '提交任务失败' },
      { status: 500 }
    );
  }
}

// 后台执行生成任务
async function generateImageAsync(
  jobId: string,
  params: {
    prompt: string;
    posterType?: string;
    colorScheme?: string;
    typography?: string;
    messages?: ChatMessage[];
    backgroundImage?: string;
    mode?: string;
    selectedImage?: string;
  }
) {
  try {
    updateJob(jobId, 'processing');
    
    const apiKey = process.env.DOUBAO_API_KEY;
    if (!apiKey) {
      updateJob(jobId, 'failed', null, 'API密钥未配置');
      return;
    }

    const { 
      prompt, 
      posterType, 
      colorScheme, 
      typography, 
      messages, 
      backgroundImage, 
      mode, 
      selectedImage 
    } = params;

    // 构建提示词（复用现有逻辑）
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

    const isThumbnailMode = mode === 'thumbnails' && !backgroundImage && !selectedImage;
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

    // 构建请求体
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

    // 调用 API（在后台执行，不超时）
    console.log('异步任务开始生成:', jobId);
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('异步任务完成:', jobId, 'Status:', response.status);

    if (!response.ok) {
      updateJob(jobId, 'failed', null, data.message || '图片生成失败');
      return;
    }

    updateJob(jobId, 'completed', {
      url: data.data?.[0]?.url,
      model: data.model,
      size: data.data?.[0]?.size,
    });
    
  } catch (error) {
    console.error('异步生成失败:', error);
    updateJob(jobId, 'failed', null, error instanceof Error ? error.message : '未知错误');
  }
}
