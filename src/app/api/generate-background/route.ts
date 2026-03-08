import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, prompt, posterType, colorScheme, typography, backgroundImage, messages } = body;
    
    // 存储任务状态（简化版：使用内存，生产环境应该用 Redis）
    const apiKey = process.env.DOUBAO_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API密钥未配置' }, { status: 500 });
    }

    // 构建请求体
    const requestBody: Record<string, unknown> = {
      model: 'doubao-seedream-4-5-251128',
      prompt: prompt,
      size: backgroundImage ? '2048x2048' : '2K',
      response_format: 'url',
    };

    if (backgroundImage) {
      requestBody.image = backgroundImage;
    }

    console.log('Background job starting:', jobId);
    
    // 调用 API（这会运行较长时间，但 Background Function 允许）
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    console.log('Background job completed:', jobId, 'Status:', response.status);

    if (!response.ok) {
      return NextResponse.json({ 
        error: '生成失败', 
        details: data.message || 'API 调用失败',
        jobId 
      }, { status: 500 });
    }

    // 返回结果
    return NextResponse.json({
      success: true,
      jobId,
      data: data.data,
      url: data.data?.[0]?.url
    });
    
  } catch (error) {
    console.error('Background job error:', error);
    return NextResponse.json(
      { error: '服务器内部错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
