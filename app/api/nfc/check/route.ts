import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  isValidNfcId,
  isValidStudentId,
  isValidPassword,
  verifyPassword,
  getCurrentMonth,
  parseStudentId,
} from '@/lib/utils';

/**
 * POST /api/nfc/check
 * NFC 태깅 또는 수동 입력으로 급식 신청 여부 확인
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nfcId, studentId, photoPath } = body;

    let student = null;

    // NFC 태깅으로 확인
    if (nfcId) {
      if (!isValidNfcId(nfcId)) {
        return NextResponse.json(
          { error: 'NFC ID는 10자리 숫자여야 합니다.' },
          { status: 400 }
        );
      }

      student = await prisma.student.findUnique({
        where: { nfcId },
      });

      if (!student) {
        return NextResponse.json(
          {
            error: '등록되지 않은 카드입니다.',
            needsRegistration: true,
            nfcId,
          },
          { status: 404 }
        );
      }
    }
    // 수동 입력으로 확인 (학번만)
    else if (studentId) {
      if (!isValidStudentId(studentId)) {
        return NextResponse.json(
          { error: '학번은 5자리 숫자여야 합니다.' },
          { status: 400 }
        );
      }

      student = await prisma.student.findUnique({
        where: { studentId },
      });

      if (!student) {
        // 등록되지 않은 학번 - 자동으로 학생 생성 (비밀번호 없이)
        const tempNfcId = `TEMP${studentId}`;
        student = await prisma.student.create({
          data: {
            nfcId: tempNfcId,
            studentId,
            password: undefined,
          },
        });
      }
    } else {
      return NextResponse.json(
        { error: 'NFC ID 또는 학번을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 현재 월 급식 신청 여부 확인
    const currentMonth = getCurrentMonth();
    const applicant = await prisma.applicant.findUnique({
      where: {
        studentId_month: {
          studentId: student.studentId,
          month: currentMonth,
        },
      },
    });

    const isApplicant = !!applicant;
    const parsedId = parseStudentId(student.studentId);

    // 오늘 날짜
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 오늘 이미 체크인했는지 확인 (신청자로 체크인한 적이 있는지)
    const existingCheckIns = await prisma.checkIn.findMany({
      where: {
        studentId: student.studentId,
        date: dateString,
      },
      orderBy: {
        checkTime: 'asc',
      },
    });

    // 신청자로 체크인한 기록이 있는지 확인
    const applicantCheckIn = existingCheckIns.find((ci: any) => ci.isApplicant);
    const firstCheckIn = existingCheckIns[0];
    const isReEntry = !!applicantCheckIn; // 신청자로 이미 체크인한 경우만 재입장으로 간주

    // 모든 체크인 시도를 기록 (재입장 포함)
    await prisma.checkIn.create({
      data: {
        studentId: student.studentId,
        date: dateString,
        isApplicant,
        photoPath: photoPath || null, // 사진 경로 저장
      },
    });

    return NextResponse.json({
      success: true,
      studentId: student.studentId,
      studentInfo: parsedId,
      isApplicant,
      month: currentMonth,
      alreadyCheckedIn: isReEntry && isApplicant, // 신청자이면서 이미 신청자로 체크인한 경우만
      checkInTime: applicantCheckIn?.checkTime || firstCheckIn?.checkTime || null,
      reEntryCount: existingCheckIns.length,
      message: isApplicant
        ? `${parsedId.formatted} - 급식 신청자입니다 ✓`
        : `${parsedId.formatted} - 급식 미신청자입니다 ✗`,
    });
  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { error: '확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
