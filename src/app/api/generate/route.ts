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

    promptParts.push('高清画质，文字清晰可读，字体端正清晰，无模糊无乱码');

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

    const textMatch = prompt.match(/[""「」『』【】]([^""「」『』【】]+)[""「」『』【】]/);
    if (textMatch) {
      enhancedPrompt += `。用户明确要求的文字内容："${textMatch[1]}"，仅显示此文字，不添加其他任何文字`;
    }

    enhancedPrompt += `。【严格规则】
1. 文字内容：海报中只能出现用户明确要求展示的文字内容，禁止添加任何用户未提及的文字
2. 禁止出现：平台名称（抖音、小红书、微信等）、设计说明（海报设计、爆款、新品等）、随机数字、日期时间地点（除非用户提供）、水印签名、装饰性字母、无关符号
3. 文字质量：所有文字必须清晰可读，字体大小适中（标题字号大、正文字号适中），边缘锐利无模糊，印刷级清晰度，无锯齿无毛边，字体端正不倾斜不变形
4. 文字排版：文字对齐整齐，间距合理，层级分明，标题醒目，正文清晰，整体协调美观
5. 纯净画面：画面干净整洁，无多余装饰文字，无乱码，无模糊字符，无不可识别的符号`;

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
          
          // 如果图片太大（超过400KB base64 ≈ 544000字符），则不发送图片
          if (base64Data.length > 544000) {
            console.log('背景图太大，不发送图片，Base64长度:', base64Data.length);
            requestBody.image = undefined;
            enhancedPrompt = `用户上传了一张背景图作为参考（图片过大无法处理），${enhancedPrompt}`;
          } else {
            requestBody.image = imageUrl;
          }
        }
      } else {
        requestBody.image = imageUrl;
      }
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
