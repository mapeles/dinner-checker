import { prisma } from '../lib/db';
import { hashPassword } from '../lib/utils';

async function main() {
  console.log('🔧 데이터베이스 초기 설정 중...');

  // 관리자 계정이 있는지 확인
  const existingAdmin = await prisma.admin.findFirst();

  if (!existingAdmin) {
    // 기본 관리자 계정 생성
    const adminPassword = process.env.ADMIN_PASSWORD || 'shindo1234';
    const adminUsername = process.env.ADMIN_USERNAME || 'shindo';

    const hashedPassword = await hashPassword(adminPassword);

    await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword,
      },
    });

    console.log('✅ 기본 관리자 계정 생성 완료!');
    console.log(`   사용자명: ${adminUsername}`);
    console.log(`   비밀번호: ${adminPassword}`);
  } else {
    console.log('✅ 관리자 계정이 이미 존재합니다.');
  }

  console.log('🎉 초기 설정 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 초기 설정 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
