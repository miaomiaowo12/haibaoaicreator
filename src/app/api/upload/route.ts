import { NextRequest, NextResponse } from 'next/server';
import TosClient from '@volcengine/tos-sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      );
    }

    const accessKeyId = process.env.TOS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.TOS_ACCESS_KEY_SECRET;
    const bucketName = process.env.TOS_BUCKET_NAME;
    const region = process.env.TOS_REGION || 'cn-beijing';

    console.log('TOS 配置:', {
      accessKeyId: accessKeyId ? `${accessKeyId.substring(0, 10)}...` : 'missing',
      accessKeySecret: accessKeySecret ? 'exists' : 'missing',
      bucketName,
      region,
    });

    if (!accessKeyId || !accessKeySecret || !bucketName) {
      return NextResponse.json(
        { error: 'TOS 配置缺失' },
        { status: 500 }
      );
    }

    const endpoint = `tos-${region}.volces.com`;
    console.log('TOS endpoint:', endpoint);

    const client = new TosClient({
      accessKeyId,
      accessKeySecret,
      region,
      endpoint,
    });

    const fileName = `uploads/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('准备上传文件:', {
      fileName,
      fileSize: buffer.length,
      contentType: file.type,
    });

    const result = await client.putObject({
      bucket: bucketName,
      key: fileName,
      body: buffer,
      contentType: file.type,
    });

    console.log('TOS 上传成功:', result);

    const url = `https://${bucketName}.tos-${region}.volces.com/${fileName}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('上传图片到 TOS 失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('错误详情:', errorMessage);
    console.error('错误堆栈:', errorStack);
    
    return NextResponse.json(
      { error: '上传失败', details: errorMessage },
      { status: 500 }
    );
  }
}
