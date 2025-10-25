import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isValidStudentId } from '@/lib/utils';

/**
 * POST /api/nfc/check-student
 * 학생 등록 여부 확인
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId || !isValidStudentId(studentId)) {
      return NextResponse.json(
        { error: '학번은 5자리 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { studentId },
    });

    return NextResponse.json({
      exists: !!student,
      studentId,
    });
  } catch (error) {
    console.error('Check student error:', error);
    return NextResponse.json(
      { error: '확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
