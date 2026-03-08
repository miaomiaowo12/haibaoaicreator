import { NextRequest, NextResponse } from 'next/server';
import { 
  getPosterTypeSkill,
  getStyleSkill,
  getGeneralSuffix,
  getFestivalSkill,
  getSystemSkill
} from '@/lib/promptEnhancer';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Edge Runtime 支持流式响应和更长超时
export const runtime = 'edge';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, posterType, style, messages, backgroundImage, mode, selectedImage } = body;

    const apiKey = process.env.DOUBAO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500 }
      );
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
      if (backgroundImage.startsWith('http')) {
        enhancedPrompt = `【参考图片】请参照用户上传的背景图风格和构图进行创作。${enhancedPrompt}`;
      }
    }

    console.log('原始提示词:', prompt);
    console.log('完整增强提示词:', enhancedPrompt.substring(0, 300) + '...');
    console.log('模式:', mode || 'single');
    console.log('是否有背景图:', !!backgroundImage);

    // Build request
    const isThumbnailMode = mode === 'thumbnails' && !backgroundImage && !selectedImage;
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
      ];
      
      const results = await Promise.all(
        styleVariations.map(async (styleVariation, index) => {
          const variationPrompt = `${enhancedPrompt}【变体风格】${styleVariation}。`;
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
