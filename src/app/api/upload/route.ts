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

    if (!accessKeyId || !accessKeySecret || !bucketName) {
      return NextResponse.json(
        { error: 'TOS 配置缺失' },
        { status: 500 }
      );
    }

    const client = new TosClient({
      accessKeyId,
      accessKeySecret,
      region,
      endpoint: `tos-${region}.volces.com`,
    });

    const fileName = `uploads/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await client.putObject({
      bucket: bucketName,
      key: fileName,
      body: buffer,
      contentType: file.type,
    });

    console.log('TOS 上传结果:', result);

    const url = `https://${bucketName}.tos-${region}.volces.com/${fileName}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('上传图片到 TOS 失败:', error);
    return NextResponse.json(
      { error: '上传失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
