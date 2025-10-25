import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * DELETE /api/admin/reset
 * 데이터베이스 완전 초기화 (관리자 제외)
 */
export async function DELETE(request: NextRequest) {
  try {
    // 모든 데이터 삭제 (관리자 제외)
    await prisma.checkIn.deleteMany({});
    await prisma.applicant.deleteMany({});
    await prisma.student.deleteMany({});

    return NextResponse.json({
      success: true,
      message: '데이터베이스가 초기화되었습니다.',
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: '초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
