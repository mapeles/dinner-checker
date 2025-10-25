import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/utils';

/**
 * POST /api/nfc/change-password
 * NFC 카드로 비밀번호 변경
 */
export async function POST(request: NextRequest) {
  try {
    const { nfcId, newPassword } = await request.json();

    // 입력 검증
    if (!nfcId || nfcId.length !== 10) {
      return NextResponse.json(
        { error: 'NFC ID는 10자리여야 합니다.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length !== 4) {
      return NextResponse.json(
        { error: '비밀번호는 4자리여야 합니다.' },
        { status: 400 }
      );
    }

    // NFC ID로 학생 찾기
    const student = await prisma.student.findUnique({
      where: { nfcId },
    });

    if (!student) {
      return NextResponse.json(
        { error: '등록되지 않은 카드입니다.' },
        { status: 404 }
      );
    }

    // 새 비밀번호 해싱
    const hashedPassword = await hashPassword(newPassword);

    // 비밀번호 업데이트
    await prisma.student.update({
      where: { nfcId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.',
      studentId: student.studentId,
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
