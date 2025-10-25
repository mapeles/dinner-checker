import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * POST /api/camera/capture
 * 웹캠에서 촬영한 사진을 저장합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const date = formData.get('date') as string;
    const studentId = formData.get('studentId') as string;

    if (!imageFile) {
      return NextResponse.json(
        { error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!date || !studentId) {
      return NextResponse.json(
        { error: '날짜와 학번이 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미지를 Buffer로 변환
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 저장 경로 설정: public/camera/날짜/
    const dateFolder = path.join(process.cwd(), 'public', 'camera', date);
    
    // 폴더가 없으면 생성
    if (!existsSync(dateFolder)) {
      await mkdir(dateFolder, { recursive: true });
    }

    // 파일명: 학번_타임스탬프.jpg
    const timestamp = Date.now();
    const filename = `${studentId}_${timestamp}.jpg`;
    const filepath = path.join(dateFolder, filename);

    // 파일 저장
    await writeFile(filepath, buffer);

    // 저장된 경로 반환 (public 기준 상대 경로)
    const photoPath = `${date}/${filename}`;

    return NextResponse.json({
      success: true,
      photoPath,
      message: '사진이 저장되었습니다.',
    });
  } catch (error) {
    console.error('Camera capture error:', error);
    return NextResponse.json(
      { error: '사진 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
