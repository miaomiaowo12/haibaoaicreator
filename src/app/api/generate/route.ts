import { NextRequest, NextResponse } from 'next/server';
import { 
  enhancePrompt, 
  extractStyleFromInput, 
  extractPlatformFromInput,
  getPosterTypeSkill,
  getColorSchemeSkill,
  getTypographySkill
} from '@/lib/promptEnhancer';
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

    const promptParts: string[] = [];

    const posterTypeSkill = getPosterTypeSkill(posterType);
    if (posterTypeSkill) {
      promptParts.push(posterTypeSkill);
    }

    const colorSchemeSkill = getColorSchemeSkill(finalColorScheme);
    if (colorSchemeSkill) {
      promptParts.push(colorSchemeSkill);
    }

    const typographySkill = getTypographySkill(typography);
    if (typographySkill) {
      promptParts.push(typographySkill);
    }

    let enhancedPrompt = enhancePrompt(
      prompt,
      posterType,
      detectedStyle,
      detectedPlatform
    );

    if (promptParts.length > 0) {
      enhancedPrompt = promptParts.join('，') + '，' + enhancedPrompt;
    }

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

    if (!posterType && !finalColorScheme && !typography) {
      enhancedPrompt += '，生成一张高清精美、视觉协调、质感高级的通用创意海报，构图合理美观，色彩和谐舒适，元素适配主题，排版整齐清晰，细节丰富精致，氛围感充足，画质清晰细腻，视觉效果生动形象';
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
      let imageUrl = backgroundImage;
      
      if (backgroundImage.startsWith('data:image/')) {
        const matches = backgroundImage.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const format = matches[1].toLowerCase();
          const base64Data = matches[2];
          imageUrl = `data:image/${format};base64,${base64Data}`;
          console.log('背景图格式:', format, 'Base64长度:', base64Data.length);
        }
      }
      
      requestBody.image = imageUrl;
    }

    console.log('请求参数:', JSON.stringify({
      model: requestBody.model,
      prompt: requestBody.prompt?.toString().substring(0, 100),
      hasImage: !!requestBody.image,
      imageSize: requestBody.image ? (requestBody.image as string).length : 0
    }));

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
