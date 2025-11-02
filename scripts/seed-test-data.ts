// 마이그레이션 테스트를 위한 샘플 데이터
// 운영 환경에 있을 것 같은 실제 데이터 시뮬레이션

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/utils';

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 테스트 데이터 생성 중...');

  // 기존 학생 데이터 (NFC + 학번 + 비밀번호)
  const hashedPassword = await hashPassword('1234');
  
  const existingStudents = [
    { nfcId: '1234567890', studentId: '20701', password: hashedPassword },
    { nfcId: '2345678901', studentId: '20702', password: hashedPassword },
    { nfcId: '3456789012', studentId: '31024', password: hashedPassword },
  ];

  for (const student of existingStudents) {
    await prisma.student.upsert({
      where: { studentId: student.studentId },
      update: {},
      create: student,
    });
  }

  console.log('✅ 기존 학생 3명 생성 (NFC + 학번 + 비밀번호)');

  // 관리자 계정
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });

  console.log('✅ 관리자 계정 생성');

  // 급식 신청자 데이터
  const currentMonth = '2025-11';
  for (const student of existingStudents) {
    await prisma.applicant.upsert({
      where: {
        studentId_month: {
          studentId: student.studentId,
          month: currentMonth,
        },
      },
      update: {},
      create: {
        studentId: student.studentId,
        month: currentMonth,
      },
    });
  }

  console.log('✅ 급식 신청 데이터 생성');

  // 체크인 기록
  const today = new Date().toISOString().split('T')[0];
  await prisma.checkIn.create({
    data: {
      studentId: '20701',
      date: today,
      isApplicant: true,
    },
  });

  console.log('✅ 체크인 기록 생성');
  console.log('');
  console.log('📊 생성된 데이터:');
  console.log(`   - 학생: ${existingStudents.length}명`);
  console.log(`   - 급식 신청: ${existingStudents.length}명`);
  console.log(`   - 체크인 기록: 1건`);
  console.log(`   - 관리자: 1명`);
}

seedTestData()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
