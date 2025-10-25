/**
 * Next.js Instrumentation
 * 서버가 시작될 때 자동으로 실행됩니다.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const fs = await import('fs');
    const path = await import('path');
    const { execSync } = await import('child_process');
    
    // DB 파일 경로
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    
    // DB가 없으면 생성
    if (!fs.existsSync(dbPath)) {
      console.log('⚠️  데이터베이스가 없습니다. 새로 생성합니다...');
      
      try {
        // Prisma 스키마 적용
        console.log('📦 Prisma 클라이언트 생성 중...');
        execSync('npx prisma generate', { stdio: 'inherit' });
        
        console.log('🗄️  데이터베이스 생성 중...');
        execSync('npx prisma db push', { stdio: 'inherit' });
        
        console.log('✅ 데이터베이스가 성공적으로 생성되었습니다.');
        
        // 기본 관리자 계정 생성
        console.log('👤 기본 관리자 계정 생성 중...');
        const { PrismaClient } = await import('@prisma/client');
        const bcrypt = await import('bcryptjs');
        
        const prisma = new PrismaClient();
        
        const defaultUsername = process.env.ADMIN_USERNAME || 'shindo';
        const defaultPassword = process.env.ADMIN_PASSWORD || 'shindo1234';
        
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        await prisma.admin.create({
          data: {
            username: defaultUsername,
            password: hashedPassword,
          },
        });
        
        await prisma.$disconnect();
        
        console.log(`✅ 관리자 계정 생성 완료 (아이디: ${defaultUsername})`);
      } catch (error) {
        console.error('❌ 데이터베이스 생성 중 오류:', error);
        throw error;
      }
    } else {
      console.log('✅ 데이터베이스 파일 확인됨');
    }
    
    // 서버 사이드에서만 실행 - DB 백업
    const backupDatabase = (await import('./scripts/backup-db.js')).default;
    
    console.log('🚀 서버 시작 - DB 백업 실행 중...');
    await backupDatabase();
  }
}
