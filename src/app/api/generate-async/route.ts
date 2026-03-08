import { NextRequest, NextResponse } from 'next/server';
import { createJob } from '@/lib/jobQueue';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, posterType, colorScheme, typography, messages, backgroundImage, mode, selectedImage } = body;

    // Create job in Blobs
    const jobId = await createJob();
    console.log('Created async job:', jobId);

    // Prepare payload for background function
    const backgroundPayload = {
      jobId,
      prompt,
      posterType,
      colorScheme,
      typography,
      messages,
      backgroundImage,
      mode,
      selectedImage,
    };

    // Get the base URL for the background function
    const baseUrl = process.env.DEPLOY_URL || process.env.URL || request.headers.get('host') || '';
    const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
    const functionUrl = `${protocol}://${baseUrl}/.netlify/functions/generate-background`;

    console.log('Invoking background function:', functionUrl);

    // Invoke background function (fire and forget - it will run independently)
    // We don't await this - it runs in the background
    fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backgroundPayload),
    }).catch(error => {
      console.error('Failed to invoke background function:', error);
    });

    // Immediately return jobId to client
    return NextResponse.json({
      success: true,
      jobId,
      message: '任务已提交，请轮询查询状态'
    });
    
  } catch (error) {
    console.error('提交异步任务失败:', error);
    return NextResponse.json(
      { error: '提交任务失败' },
      { status: 500 }
    );
  }
}
