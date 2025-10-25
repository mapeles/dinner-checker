import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';
import { isValidStudentId, isValidMonth, getCurrentMonth } from '@/lib/utils';

/**
 * POST /api/admin/upload
 * 엑셀 파일로 급식 신청자 명단 업로드
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const replaceExisting = formData.get('replaceExisting') === 'true';
    const month = getCurrentMonth(); // 항상 현재 월 사용

    if (!file) {
      return NextResponse.json(
        { error: '파일을 선택해주세요.' },
        { status: 400 }
      );
    }

    // 엑셀 파일 읽기
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // 첫 번째 시트 읽기
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // 모든 셀에서 5자리 숫자 추출
    const studentIds: string[] = [];
    const errors: string[] = [];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

    // 모든 셀을 순회하며 5자리 숫자 찾기
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        
        if (!cell || !cell.v) continue;
        
        // 셀 값을 문자열로 변환
        const cellValue = String(cell.v).trim();
        
        // 5자리 숫자인지 확인
        if (/^\d{5}$/.test(cellValue)) {
          if (isValidStudentId(cellValue)) {
            studentIds.push(cellValue);
          } else {
            errors.push(`${cellAddress}: 유효하지 않은 학번입니다. (${cellValue})`);
          }
        }
      }
    }

    if (studentIds.length === 0) {
      return NextResponse.json(
        { error: '유효한 학번이 없습니다. 5자리 숫자를 입력해주세요.', errors },
        { status: 400 }
      );
    }

    // 기존 신청자 삭제 (옵션에 따라)
    if (replaceExisting) {
      await prisma.applicant.deleteMany({
        where: { month },
      });
    }

    // 새로운 신청자 추가 (중복 제거)
    const uniqueStudentIds = [...new Set(studentIds)];
    const applicants = uniqueStudentIds.map((studentId) => ({
      studentId,
      month,
    }));

    // SQLite는 skipDuplicates를 지원하지 않으므로 개별 생성
    let createdCount = 0;
    for (const applicant of applicants) {
      try {
        await prisma.applicant.create({
          data: applicant,
        });
        createdCount++;
      } catch (error: any) {
        // 중복 오류는 무시
        if (error.code !== 'P2002') {
          throw error;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '신청자 명단이 업데이트되었습니다.',
      month,
      count: createdCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/upload
 * 현재 월 신청자 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const month = getCurrentMonth(); // 항상 현재 월 사용

    const applicants = await prisma.applicant.findMany({
      where: { month },
      orderBy: { studentId: 'asc' },
    });

    return NextResponse.json({
      success: true,
      month,
      count: applicants.length,
      applicants: applicants.map((applicant: any) => ({
        id: applicant.id,
        studentId: applicant.studentId,
        createdAt: applicant.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get applicants error:', error);
    return NextResponse.json(
      { error: '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
