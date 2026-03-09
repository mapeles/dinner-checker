import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';

/**
 * POST /api/admin/migrate
 * CSV/Excel 파일로 구 학번 → 신 학번 일괄 마이그레이션
 *
 * 파일 형식:
 *   - 첫 행에 'input', 'output' 헤더가 있으면 해당 열을 사용
 *   - 없으면 1열(0번)=기존 학번, 2열(1번)=새 학번, 첫 행도 데이터로 처리
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일을 선택해주세요.' }, { status: 400 });
    }

    // 파일 파싱
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

    // 첫 행에서 'input' / 'output' 헤더 탐색
    let inputCol = 0;
    let outputCol = 1;
    let dataStartRow = range.s.r; // 기본값: 헤더 없음 → 첫 행부터 데이터

    const firstRowCells: { col: number; value: string }[] = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cell = sheet[cellAddr];
      if (cell && cell.v != null) {
        firstRowCells.push({ col, value: String(cell.v).trim().toLowerCase() });
      }
    }

    const inputHeader = firstRowCells.find((c) => c.value === 'input');
    const outputHeader = firstRowCells.find((c) => c.value === 'output');

    if (inputHeader && outputHeader) {
      inputCol = inputHeader.col;
      outputCol = outputHeader.col;
      dataStartRow = range.s.r + 1; // 헤더 행 건너뜀
    }

    // 각 행에서 (oldId, newId) 쌍 수집
    const pairs: { oldId: string; newId: string }[] = [];
    for (let row = dataStartRow; row <= range.e.r; row++) {
      const inputCellAddr = XLSX.utils.encode_cell({ r: row, c: inputCol });
      const outputCellAddr = XLSX.utils.encode_cell({ r: row, c: outputCol });

      const inputCell = sheet[inputCellAddr];
      const outputCell = sheet[outputCellAddr];

      if (!inputCell || !outputCell) continue;

      const oldId = String(inputCell.v).trim();
      const newId = String(outputCell.v).trim();

      // 둘 다 5자리 숫자인지 검증
      if (!/^\d{5}$/.test(oldId) || !/^\d{5}$/.test(newId)) continue;

      pairs.push({ oldId, newId });
    }

    if (pairs.length === 0) {
      return NextResponse.json(
        { error: '마이그레이션할 학번 쌍을 찾을 수 없습니다. 파일 형식을 확인해주세요.' },
        { status: 400 }
      );
    }

    // 중복된 oldId 쌍이 있으면 마지막 것만 사용 (Map으로 처리)
    const pairMap = new Map<string, string>();
    for (const { oldId, newId } of pairs) {
      pairMap.set(oldId, newId);
    }

    let migrated = 0;
    let skipped = 0;
    const conflicts: { oldId: string; newId: string; reason: string }[] = [];

    for (const [oldId, newId] of pairMap) {
      // oldId → DB에 존재하는지 확인
      const existingStudent = await prisma.student.findUnique({
        where: { studentId: oldId },
      });

      if (!existingStudent) {
        // DB에 없는 학생 → 스킵
        skipped++;
        continue;
      }

      // 같은 학번이면 스킵
      if (oldId === newId) {
        skipped++;
        continue;
      }

      // newId가 이미 다른 학생에 존재하는지 확인
      const conflictStudent = await prisma.student.findUnique({
        where: { studentId: newId },
      });

      if (conflictStudent) {
        conflicts.push({ oldId, newId, reason: `새 학번 ${newId}이(가) 이미 다른 학생에게 등록되어 있습니다.` });
        continue;
      }

      // 트랜잭션으로 일괄 업데이트
      // SQLite는 FK 제약이 기본 비활성화이므로 순서: CheckIn → Applicant → Student
      await prisma.$transaction([
        // 체크인 기록의 studentId 업데이트 (FK 참조)
        prisma.checkIn.updateMany({
          where: { studentId: oldId },
          data: { studentId: newId },
        }),
        // 신청자 목록의 studentId 업데이트 (FK 없음)
        prisma.applicant.updateMany({
          where: { studentId: oldId },
          data: { studentId: newId },
        }),
        // 학생 테이블의 studentId 업데이트
        prisma.student.update({
          where: { studentId: oldId },
          data: { studentId: newId },
        }),
      ]);

      migrated++;
    }

    return NextResponse.json({
      migrated,
      skipped,
      conflicts,
      total: pairMap.size,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: '마이그레이션 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
