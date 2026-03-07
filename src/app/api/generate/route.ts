import { NextRequest, NextResponse } from 'next/server';
import { enhancePrompt, extractStyleFromInput, extractPlatformFromInput } from '@/lib/promptEnhancer';
import { 
  getColorSchemePrompt, 
  getTypographyPrompt,
  recommendColorScheme
} from '@/lib/designTemplates';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, posterType, colorScheme, typography, messages, backgroundImage } = body;

    const apiKey = process.env.DOUBAO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500 }
      );
    }

    const detectedStyle = extractStyleFromInput(prompt);
    const detectedPlatform = extractPlatformFromInput(prompt);
    const finalColorScheme = colorScheme || (posterType ? recommendColorScheme(posterType) : null);

    let contextSummary = '';
    if (messages && messages.length > 1) {
      const recentMessages = messages.slice(-6);
      contextSummary = recentMessages
        .filter((m: ChatMessage) => m.role === 'user')
        .map((m: ChatMessage) => m.content)
        .join('；');
    }

    let enhancedPrompt = enhancePrompt(
      prompt,
      posterType,
      detectedStyle,
      detectedPlatform
    );

    if (contextSummary) {
      enhancedPrompt = `用户之前的描述：${contextSummary}。当前需求：${enhancedPrompt}`;
    }

    if (backgroundImage) {
      enhancedPrompt = `参考用户上传的背景图风格和构图，${enhancedPrompt}`;
    }

    const colorPrompt = getColorSchemePrompt(finalColorScheme);
    if (colorPrompt) {
      enhancedPrompt += `，${colorPrompt}`;
    }

    const typographyPrompt = getTypographyPrompt(typography);
    if (typographyPrompt) {
      enhancedPrompt += `，${typographyPrompt}`;
    }

    enhancedPrompt += `。【重要规则】
1. 海报中只能出现用户明确要求展示的文字内容
2. 禁止出现：平台名称（抖音、小红书等）、设计说明（海报设计、爆款等）、任何数字（除非用户提供）、时间日期地点（除非用户提供）、水印签名
3. 文字要求：字体大小适中，不要过小，确保清晰可读，边缘锐利，无模糊无锯齿，印刷级清晰度，所有文字必须清晰明确`;

    console.log('原始提示词:', prompt);
    console.log('增强后提示词:', enhancedPrompt);
    console.log('是否有背景图:', !!backgroundImage);

    const requestBody: Record<string, unknown> = {
      model: 'doubao-seedream-4-0-250828',
      prompt: enhancedPrompt,
      size: '1024x1024',
      response_format: 'url',
    };

    if (backgroundImage) {
      requestBody.image = backgroundImage;
    }

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API错误响应:', data);
      return NextResponse.json(
        { error: data.message || data.error?.message || '图片生成失败' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('生成图片错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
