import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { parseStudentId } from '@/lib/utils';

/**
 * GET /api/admin/checkins
 * 특정 날짜의 체크인 기록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: '날짜가 필요합니다.' },
        { status: 400 }
      );
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { date },
      orderBy: { checkTime: 'asc' },
    });

    // 각 학생의 체크인 횟수 계산
    const studentCheckInCounts = new Map<string, number>();
    
    const checkInsWithInfo = checkIns.map((checkIn: any) => {
      const parsed = parseStudentId(checkIn.studentId);
      const currentCount = studentCheckInCounts.get(checkIn.studentId) || 0;
      studentCheckInCounts.set(checkIn.studentId, currentCount + 1);
      
      // 해당 학생의 이전 신청자 체크인 찾기
      const previousApplicantCheckIns = checkIns.filter((ci: any) => 
        ci.studentId === checkIn.studentId && 
        ci.isApplicant && 
        new Date(ci.checkTime) < new Date(checkIn.checkTime)
      );
      
      const isDuplicate = checkIn.isApplicant && previousApplicantCheckIns.length > 0;
      
      return {
        id: checkIn.id,
        studentId: checkIn.studentId,
        studentInfo: parsed,
        isApplicant: checkIn.isApplicant,
        isDuplicate, // 신청자의 중복 태깅 여부
        checkTime: checkIn.checkTime,
        checkCount: currentCount + 1, // 해당 학생의 몇 번째 체크인인지
      };
    });

    return NextResponse.json({
      success: true,
      date,
      checkIns: checkInsWithInfo,
      count: checkInsWithInfo.length,
    });
  } catch (error) {
    console.error('Get check-ins error:', error);
    return NextResponse.json(
      { error: '체크인 기록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
