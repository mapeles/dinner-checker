#!/usr/bin/env tsx
/**
 * 기존 백업 DB에서 데이터를 마이그레이션하는 스크립트
 * 비밀번호가 필수였던 구 DB에서 비밀번호가 optional인 새 DB로 데이터 이전
 * 
 * 사용법:
 * npx tsx scripts/migrate-from-backup.ts <백업파일경로>
 * 
 * 예시:
 * npx tsx scripts/migrate-from-backup.ts ./backups/dev.db.backup_2025-11-02_12-00-00
 */

import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

interface OldStudent {
  id: string;
  nfcId: string;
  studentId: string;
  password: string;  // 구 DB에서는 필수
  createdAt: string;
  updatedAt: string;
}

interface OldApplicant {
  id: string;
  studentId: string;
  month: string;
  createdAt: string;
}

interface OldCheckIn {
  id: string;
  studentId: string;
  date: string;
  isApplicant: number;  // SQLite는 boolean을 0/1로 저장
  checkTime: string;
  photoPath: string | null;
}

interface OldAdmin {
  id: string;
  username: string;
  password: string;
  createdAt: string;
}

async function migrateFromBackup(backupPath: string) {
  console.log('📦 백업 DB 마이그레이션 시작...\n');

  // 백업 파일 존재 확인
  const absolutePath = resolve(backupPath);
  if (!existsSync(absolutePath)) {
    console.error(`❌ 백업 파일을 찾을 수 없습니다: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`📂 백업 파일: ${absolutePath}\n`);

  // 백업 DB 연결
  let oldDb: Database.Database;
  try {
    oldDb = new Database(absolutePath, { readonly: true });
    console.log('✅ 백업 DB 연결 성공\n');
  } catch (error) {
    console.error('❌ 백업 DB 연결 실패:', error);
    process.exit(1);
  }

  try {
    // 기존 데이터 개수 확인
    const oldStudents = oldDb.prepare('SELECT * FROM Student').all() as OldStudent[];
    const oldApplicants = oldDb.prepare('SELECT * FROM Applicant').all() as OldApplicant[];
    const oldCheckIns = oldDb.prepare('SELECT * FROM CheckIn').all() as OldCheckIn[];
    const oldAdmins = oldDb.prepare('SELECT * FROM Admin').all() as OldAdmin[];

    console.log('📊 백업 DB 데이터:');
    console.log(`   - 학생: ${oldStudents.length}명`);
    console.log(`   - 급식 신청: ${oldApplicants.length}건`);
    console.log(`   - 체크인 기록: ${oldCheckIns.length}건`);
    console.log(`   - 관리자: ${oldAdmins.length}명\n`);

    if (oldStudents.length === 0) {
      console.log('⚠️  백업 DB에 데이터가 없습니다.');
      oldDb.close();
      process.exit(0);
    }

    // 확인 메시지
    console.log('⚠️  현재 DB의 모든 데이터가 삭제되고 백업 데이터로 대체됩니다.');
    console.log('⚠️  계속하려면 Ctrl+C를 눌러 취소하거나, 10초 후 자동으로 진행됩니다...\n');

    // 10초 대기
    for (let i = 10; i > 0; i--) {
      process.stdout.write(`\r⏱️  ${i}초 남음...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n');

    // 현재 DB 초기화
    console.log('🗑️  현재 DB 데이터 삭제 중...');
    await prisma.checkIn.deleteMany();
    await prisma.applicant.deleteMany();
    await prisma.student.deleteMany();
    await prisma.admin.deleteMany();
    console.log('✅ 현재 DB 초기화 완료\n');

    // 학생 데이터 마이그레이션
    console.log('👥 학생 데이터 마이그레이션 중...');
    let studentCount = 0;
    for (const student of oldStudents) {
      await prisma.student.create({
        data: {
          id: student.id,
          nfcId: student.nfcId,
          studentId: student.studentId,
          password: student.password,  // 그대로 저장 (비어있으면 자동으로 null)
          createdAt: new Date(student.createdAt),
          updatedAt: new Date(student.updatedAt),
        },
      });
      studentCount++;
      if (studentCount % 10 === 0) {
        process.stdout.write(`\r   진행: ${studentCount}/${oldStudents.length}`);
      }
    }
    console.log(`\r✅ 학생 ${studentCount}명 마이그레이션 완료\n`);

    // 급식 신청 데이터 마이그레이션
    console.log('🍽️  급식 신청 데이터 마이그레이션 중...');
    let applicantCount = 0;
    for (const applicant of oldApplicants) {
      await prisma.applicant.create({
        data: {
          id: applicant.id,
          studentId: applicant.studentId,
          month: applicant.month,
          createdAt: new Date(applicant.createdAt),
        },
      });
      applicantCount++;
      if (applicantCount % 50 === 0) {
        process.stdout.write(`\r   진행: ${applicantCount}/${oldApplicants.length}`);
      }
    }
    console.log(`\r✅ 급식 신청 ${applicantCount}건 마이그레이션 완료\n`);

    // 체크인 기록 마이그레이션
    console.log('📝 체크인 기록 마이그레이션 중...');
    let checkInCount = 0;
    for (const checkIn of oldCheckIns) {
      await prisma.checkIn.create({
        data: {
          id: checkIn.id,
          studentId: checkIn.studentId,
          date: checkIn.date,
          isApplicant: checkIn.isApplicant === 1,  // SQLite 0/1 → boolean
          checkTime: new Date(checkIn.checkTime),
          photoPath: checkIn.photoPath,
        },
      });
      checkInCount++;
      if (checkInCount % 100 === 0) {
        process.stdout.write(`\r   진행: ${checkInCount}/${oldCheckIns.length}`);
      }
    }
    console.log(`\r✅ 체크인 ${checkInCount}건 마이그레이션 완료\n`);

    // 관리자 계정 마이그레이션 (선택사항)
    console.log('🔐 관리자 계정 마이그레이션 중...');
    for (const admin of oldAdmins) {
      await prisma.admin.create({
        data: {
          id: admin.id,
          username: admin.username,
          password: admin.password,
          createdAt: new Date(admin.createdAt),
        },
      });
    }
    console.log(`✅ 관리자 ${oldAdmins.length}명 마이그레이션 완료\n`);

    // 결과 확인
    const newStudentCount = await prisma.student.count();
    const newApplicantCount = await prisma.applicant.count();
    const newCheckInCount = await prisma.checkIn.count();
    const newAdminCount = await prisma.admin.count();

    console.log('📊 마이그레이션 결과:');
    console.log(`   - 학생: ${newStudentCount}명 (백업: ${oldStudents.length}명)`);
    console.log(`   - 급식 신청: ${newApplicantCount}건 (백업: ${oldApplicants.length}건)`);
    console.log(`   - 체크인 기록: ${newCheckInCount}건 (백업: ${oldCheckIns.length}건)`);
    console.log(`   - 관리자: ${newAdminCount}명 (백업: ${oldAdmins.length}명)\n`);

    if (
      newStudentCount === oldStudents.length &&
      newApplicantCount === oldApplicants.length &&
      newCheckInCount === oldCheckIns.length &&
      newAdminCount === oldAdmins.length
    ) {
      console.log('✅ 모든 데이터가 성공적으로 마이그레이션되었습니다! 🎉\n');
    } else {
      console.log('⚠️  일부 데이터가 누락되었을 수 있습니다. 확인이 필요합니다.\n');
    }

    // 비밀번호 필드 확인
    const allStudents = await prisma.student.findMany({
      select: { password: true }
    });
    const studentsWithPassword = allStudents.filter(s => s.password !== null && s.password !== undefined).length;
    const studentsWithoutPassword = allStudents.filter(s => s.password === null || s.password === undefined).length;

    console.log('🔒 비밀번호 상태:');
    console.log(`   - 비밀번호 있음: ${studentsWithPassword}명`);
    console.log(`   - 비밀번호 없음: ${studentsWithoutPassword}명\n`);

    console.log('💡 참고:');
    console.log('   - 비밀번호가 있는 학생도 이제는 비밀번호 없이 체크인 가능합니다.');
    console.log('   - 비밀번호는 DB에 보존되지만 시스템에서 사용되지 않습니다.\n');

  } catch (error) {
    console.error('\n❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  } finally {
    oldDb.close();
    await prisma.$disconnect();
  }
}

// 메인 실행
const backupPath = process.argv[2];

if (!backupPath) {
  console.error('❌ 사용법: npx tsx scripts/migrate-from-backup.ts <백업파일경로>');
  console.error('\n예시:');
  console.error('  npx tsx scripts/migrate-from-backup.ts ./backups/dev.db.backup_2025-11-02_12-00-00');
  console.error('  npx tsx scripts/migrate-from-backup.ts ./prisma/dev.db.backup');
  process.exit(1);
}

migrateFromBackup(backupPath)
  .then(() => {
    console.log('🎉 마이그레이션 완료!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 마이그레이션 실패:', error);
    process.exit(1);
  });
