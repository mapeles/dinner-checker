import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * DELETE /api/admin/checkins/cancel
 * 특정 체크인 기록 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkInId } = body;

    if (!checkInId) {
      return NextResponse.json(
        { error: '체크인 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 체크인 기록 삭제
    await prisma.checkIn.delete({
      where: { id: checkInId },
    });

    return NextResponse.json({
      success: true,
      message: '체크인이 취소되었습니다.',
    });
  } catch (error) {
    console.error('Cancel check-in error:', error);
    return NextResponse.json(
      { error: '체크인 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
