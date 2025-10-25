import fs from 'fs';
import path from 'path';

/**
 * DB 백업 스크립트
 * 서버 시작 시 자동으로 실행되어 데이터베이스를 백업합니다.
 */
async function backupDatabase() {
  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const backupDir = path.join(process.cwd(), 'backups');
    
    // DB 파일이 존재하는지 확인
    if (!fs.existsSync(dbPath)) {
      console.log('⚠️  DB 파일이 없습니다. 백업을 건너뜁니다.');
      return;
    }

    // 백업 디렉토리가 없으면 생성
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('✅ 백업 디렉토리 생성됨');
    }

    // 타임스탬프 생성 (YYYY-MM-DD_HH-mm-ss 형식)
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .replace(/\..+/, '');
    
    const backupFileName = `dev.db.backup_${timestamp}`;
    const backupPath = path.join(backupDir, backupFileName);

    // DB 파일 복사
    fs.copyFileSync(dbPath, backupPath);
    
    console.log(`✅ DB 백업 완료: ${backupFileName}`);
    console.log(`📁 백업 위치: ${backupPath}`);

    // 오래된 백업 파일 정리 (30개 이상이면 오래된 것 삭제)
    cleanOldBackups(backupDir);
    
  } catch (error) {
    console.error('❌ DB 백업 중 오류 발생:', error);
    // 백업 실패해도 서버는 계속 실행되도록 에러를 throw하지 않음
  }
}

/**
 * 오래된 백업 파일 정리
 * 백업 파일이 30개를 초과하면 가장 오래된 파일부터 삭제
 */
function cleanOldBackups(backupDir: string) {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('dev.db.backup_'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // 최신순 정렬

    const maxBackups = 30;
    
    if (files.length > maxBackups) {
      const filesToDelete = files.slice(maxBackups);
      
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️  오래된 백업 삭제: ${file.name}`);
      });
      
      console.log(`✅ ${filesToDelete.length}개의 오래된 백업 파일 정리 완료`);
    }
    
    console.log(`📊 현재 백업 파일 개수: ${Math.min(files.length, maxBackups)}개`);
  } catch (error) {
    console.error('⚠️  백업 파일 정리 중 오류:', error);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  console.log('🔄 데이터베이스 백업 시작...');
  backupDatabase().then(() => {
    console.log('✅ 백업 프로세스 완료');
  });
}

export default backupDatabase;
