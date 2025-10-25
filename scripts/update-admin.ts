import { prisma } from '../lib/db';
import { hashPassword } from '../lib/utils';

async function main() {
  console.log('🔧 관리자 계정 업데이트 중...');

  // 기존 관리자 삭제
  await prisma.admin.deleteMany({});
  console.log('✅ 기존 관리자 계정 삭제 완료');

  // 새 관리자 계정 생성
  const adminUsername = 'shindo';
  const adminPassword = 'shindo1234';
  const hashedPassword = await hashPassword(adminPassword);

  await prisma.admin.create({
    data: {
      username: adminUsername,
      password: hashedPassword,
    },
  });

  console.log('✅ 새 관리자 계정 생성 완료!');
  console.log(`   사용자명: ${adminUsername}`);
  console.log(`   비밀번호: ${adminPassword}`);
  console.log('🎉 관리자 계정 업데이트 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 업데이트 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
