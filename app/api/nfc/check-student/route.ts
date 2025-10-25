import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isValidStudentId, parseStudentId } from '@/lib/utils';

/**
 * POST /api/nfc/check-student
 * 학생 등록 여부 확인 (학번 또는 NFC ID)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, nfcId } = body;

    // NFC ID로 조회
    if (nfcId) {
      if (nfcId.length !== 10) {
        return NextResponse.json(
          { error: 'NFC ID는 10자리여야 합니다.' },
          { status: 400 }
        );
      }

      const student = await prisma.student.findUnique({
        where: { nfcId },
      });

      if (!student) {
        return NextResponse.json({
          exists: false,
          nfcId,
        });
      }

      const studentInfo = parseStudentId(student.studentId);

      return NextResponse.json({
        exists: true,
        nfcId,
        student: {
          studentId: student.studentId,
          studentInfo,
          nfcId: student.nfcId,
        },
      });
    }

    // 학번으로 조회
    if (studentId) {
      if (!isValidStudentId(studentId)) {
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
    }

    return NextResponse.json(
      { error: '학번 또는 NFC ID가 필요합니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Check student error:', error);
    return NextResponse.json(
      { error: '확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
