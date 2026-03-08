import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';
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
    // Try various sources to get the correct host
    const host = request.headers.get('host') || 
                 request.headers.get('x-forwarded-host') ||
                 process.env.DEPLOY_URL || 
                 process.env.URL;
    
    if (!host) {
      throw new Error('无法确定服务器地址');
    }
    
    // Remove protocol if present in host
    const cleanHost = host.replace(/^https?:\/\//, '');
    const protocol = cleanHost.includes('localhost') ? 'http' : 'https';
    const functionUrl = `${protocol}://${cleanHost}/.netlify/functions/generate-background`;

    console.log('Invoking background function:', functionUrl);

    // Invoke background function - must await to catch errors
    try {
      const bgResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backgroundPayload),
      });
      console.log('Background function invoked, status:', bgResponse.status);
    } catch (error) {
      console.error('Failed to invoke background function:', error);
      // Update job status to reflect the failure
      const store = getStore('job-queue');
      await store.setJSON(jobId, {
        status: 'failed',
        error: '后台任务启动失败',
        createdAt: Date.now(),
      });
      throw new Error('启动后台任务失败');
    }

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
