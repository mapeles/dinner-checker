/**
 * Next.js Instrumentation
 * 서버가 시작될 때 자동으로 실행됩니다.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 서버 사이드에서만 실행
    const backupDatabase = (await import('./scripts/backup-db.js')).default;
    
    console.log('🚀 서버 시작 - DB 백업 실행 중...');
    await backupDatabase();
  }
}
