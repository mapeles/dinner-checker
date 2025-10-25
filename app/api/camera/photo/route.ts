import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * GET /api/camera/photo?path=날짜/파일명
 * 저장된 사진을 조회합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoPath = searchParams.get('path');

    if (!photoPath) {
      return NextResponse.json(
        { error: '사진 경로가 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 경로 구성: public/camera/날짜/파일명
    const filepath = path.join(process.cwd(), 'public', 'camera', photoPath);

    // 파일 존재 확인
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: '사진을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 파일 읽기
    const imageBuffer = await readFile(filepath);

    // 이미지 응답 반환
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Photo fetch error:', error);
    return NextResponse.json(
      { error: '사진 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
