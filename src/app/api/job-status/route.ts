import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/jobQueue';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: '缺少 jobId' },
        { status: 400 }
      );
    }

    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: '任务不存在或已过期' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jobId,
      status: job.status,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
    });
    
  } catch (error) {
    console.error('查询任务状态失败:', error);
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    );
  }
}
