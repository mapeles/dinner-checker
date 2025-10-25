import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isValidStudentId } from '@/lib/utils';

// 신청자 추가 (월 구분 없음)
export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json();

    // 유효성 검사
    if (!studentId || !isValidStudentId(studentId)) {
      return NextResponse.json(
        { error: '유효하지 않은 학번입니다.' },
        { status: 400 }
      );
    }

    // 현재 월 가져오기
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 이미 등록된 신청자인지 확인
    const existing = await prisma.applicant.findUnique({
      where: {
        studentId_month: {
          studentId,
          month,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: '이미 등록된 신청자입니다.' },
        { status: 400 }
      );
    }

    // 신청자 추가
    const applicant = await prisma.applicant.create({
      data: {
        studentId,
        month,
      },
    });

    return NextResponse.json({
      success: true,
      applicant,
    });
  } catch (error) {
    console.error('Failed to add applicant:', error);
    return NextResponse.json(
      { error: '신청자 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 신청자 삭제 (현재 월)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: '학번을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 현재 월 가져오기
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 신청자 삭제
    const deleted = await prisma.applicant.deleteMany({
      where: {
        studentId,
        month,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: '해당 신청자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '신청자가 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Failed to delete applicant:', error);
    return NextResponse.json(
      { error: '신청자 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
