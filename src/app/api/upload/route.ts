import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 300秒超时

export async function POST(request: NextRequest) {
  try {
    console.log('=== TOS Upload API 开始 ===');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('错误：未找到文件');
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      );
    }

    console.log('文件信息:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const accessKeyId = process.env.TOS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.TOS_ACCESS_KEY_SECRET;
    const bucketName = process.env.TOS_BUCKET_NAME;
    const region = process.env.TOS_REGION || 'cn-beijing';

    console.log('环境变量检查:', {
      hasAccessKeyId: !!accessKeyId,
      hasAccessKeySecret: !!accessKeySecret,
      bucketName,
      region
    });

    if (!accessKeyId || !accessKeySecret || !bucketName) {
      console.log('错误：TOS 配置缺失');
      return NextResponse.json(
        { error: 'TOS 配置缺失，请检查环境变量' },
        { status: 500 }
      );
    }

    // 动态导入 TOS SDK
    const TosClient = (await import('@volcengine/tos-sdk')).default;
    
    const endpoint = `tos-${region}.volces.com`;
    console.log('TOS 配置:', { region, endpoint, bucket: bucketName });

    const client = new TosClient({
      accessKeyId,
      accessKeySecret,
      region,
      endpoint,
    });

    const fileName = `uploads/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('准备上传:', {
      fileName,
      bufferSize: buffer.length
    });

    const result = await client.putObject({
      bucket: bucketName,
      key: fileName,
      body: buffer,
      contentType: file.type,
    });

    console.log('TOS 上传成功:', result);

    const url = `https://${bucketName}.tos-${region}.volces.com/${fileName}`;
    console.log('生成的 URL:', url);

    return NextResponse.json({ 
      success: true,
      url,
      fileName 
    });
    
  } catch (error) {
    console.error('=== TOS 上传失败 ===');
    console.error('错误类型:', error?.constructor?.name);
    console.error('错误信息:', error instanceof Error ? error.message : String(error));
    console.error('错误堆栈:', error instanceof Error ? error.stack : '');
    
    return NextResponse.json(
      { 
        error: '上传失败', 
        details: error instanceof Error ? error.message : '未知错误',
        type: error?.constructor?.name
      },
      { status: 500 }
    );
  }
}
