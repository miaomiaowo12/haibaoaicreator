import { NextRequest, NextResponse } from 'next/server';
import { 
  getPosterTypeSkill,
  getColorSchemeSkill,
  getTypographySkill,
  getSystemSkill,
  getFestivalSkill
} from '@/lib/promptEnhancer';
import { recommendColorScheme } from '@/lib/designTemplates';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, posterType, colorScheme, typography, messages, backgroundImage, mode, selectedImage } = body;

    const apiKey = process.env.DOUBAO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500 }
      );
    }

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
    if (festivalSkill) {
      promptParts.push(festivalSkill);
    }

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

    const isThumbnailMode = mode === 'thumbnails' && !backgroundImage && !selectedImage;
    const hasImage = !!backgroundImage || !!selectedImage;
    const size = hasImage ? '2048x2048' : '2K';
    const resolutionText = '2048×2048';
    
    promptParts.push(`高清 ${resolutionText} 分辨率，商业级质感，文字清晰可辨，光影精致，主体突出，背景简洁`);

    let enhancedPrompt = promptParts.join('；');

    const systemSkill = getSystemSkill();
    enhancedPrompt = `${systemSkill}。${enhancedPrompt}`;

    if (contextSummary) {
      enhancedPrompt = `【对话上下文】${contextSummary}【当前需求】${enhancedPrompt}`;
    }

    if (backgroundImage) {
      if (backgroundImage.startsWith('http')) {
        enhancedPrompt = `参考用户上传的背景图风格和构图，${enhancedPrompt}`;
      }
    }

    if (!posterType && !finalColorScheme && !typography) {
      enhancedPrompt += '；生成一张高清精美、视觉协调、质感高级的通用创意海报，构图合理美观，色彩和谐舒适，元素适配主题，排版整齐清晰，细节丰富精致，氛围感充足，画质清晰细腻，视觉效果生动形象';
    }

    const textMatch = prompt.match(/[""「」『』【】]([^""「」『』【】]+)[""「」『』【】]/);
    if (textMatch) {
      enhancedPrompt += `。用户明确要求的文字内容："${textMatch[1]}"，仅显示此文字，不添加其他任何文字`;
    }

    enhancedPrompt += '。【严格规则】1.文字内容：海报中只能出现用户明确要求展示的文字内容，禁止添加任何用户未提及的文字；2.禁止出现：平台名称（抖音、小红书、微信等）、设计说明（海报设计、爆款、新品等）、随机数字、日期时间地点（除非用户提供）、水印签名、装饰性字母、无关符号；3.文字质量：所有文字必须清晰可读，字体大小适中（标题字号大、正文字号适中），边缘锐利无模糊，印刷级清晰度，无锯齿无毛边，字体端正不倾斜不变形；4.文字排版：文字对齐整齐，间距合理，层级分明，标题醒目，正文清晰，整体协调美观；5.纯净画面：画面干净整洁，无多余装饰文字，无乱码，无模糊字符，无不可识别的符号';

    console.log('原始提示词:', prompt);
    console.log('增强后提示词:', enhancedPrompt);
    console.log('模式:', mode || 'single');
    console.log('是否有背景图:', !!backgroundImage);

    const requestBody: Record<string, unknown> = {
      model: 'doubao-seedream-4-5-251128',
      prompt: enhancedPrompt,
      size: size,
      response_format: 'url',
    };

    if (selectedImage) {
      requestBody.image = selectedImage;
    } else if (backgroundImage) {
      if (backgroundImage.startsWith('http')) {
        requestBody.image = backgroundImage;
        console.log('使用 TOS 图片 URL:', backgroundImage);
      } else if (backgroundImage.startsWith('data:image/')) {
        const matches = backgroundImage.match(/^data:image\/(\w+);base64,(.+)$/);
        if (matches) {
          const base64Data = matches[2];
          console.log('使用 base64 图片，长度:', base64Data.length);
          
          if (base64Data.length > 544000) {
            console.log('图片太大，不发送');
            return NextResponse.json(
              { error: '图片过大，请上传小于 400KB 的图片' },
              { status: 400 }
            );
          }
          requestBody.image = backgroundImage;
        }
      }
    }

    console.log('请求参数:', JSON.stringify({
      model: requestBody.model,
      prompt: requestBody.prompt?.toString().substring(0, 100),
      hasImage: !!requestBody.image,
      imageSize: requestBody.image ? (requestBody.image as string).length : 0,
      size: requestBody.size,
      isThumbnailMode
    }));

    if (isThumbnailMode) {
      const styleVariations = [
        '风格1：现代简约，色彩明快，构图简洁',
        '风格2：复古优雅，色调柔和，层次丰富',
        '风格3：创意活泼，色彩鲜艳，动感十足',
        '风格4：高端大气，质感高级，光影精致'
      ];
      
      const results = await Promise.all(
        styleVariations.map(async (style, index) => {
          const variationPrompt = `${enhancedPrompt}。${style}`;
          const variationBody = {
            ...requestBody,
            prompt: variationPrompt,
          };
          
          const res = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(variationBody),
          });
          
          const responseText = await res.text();
          let data;
          
          try {
            data = JSON.parse(responseText);
          } catch {
            console.error(`图片${index + 1}返回非 JSON:`, responseText.substring(0, 200));
            return null;
          }
          
          if (!res.ok) {
            console.error(`图片${index + 1}生成失败:`, data);
            return null;
          }
          return data.data?.[0]?.url || data.url;
        })
      );
      
      const validResults = results.filter(Boolean);
      
      if (validResults.length === 0) {
        return NextResponse.json(
          { error: '所有图片生成失败' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        created: Date.now(),
        data: validResults.map(url => ({ url }))
      });
    }

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('API 响应状态:', response.status, response.statusText);
    console.log('API 响应长度:', responseText.length);
    console.log('API 响应前 1000 字符:', responseText.substring(0, 1000));
    
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('API 返回非 JSON 响应');
      console.error('完整响应:', responseText);
      return NextResponse.json(
        { error: `API 返回错误 (${response.status}): 请检查图片 URL 是否可公开访问` },
        { status: 500 }
      );
    }

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
