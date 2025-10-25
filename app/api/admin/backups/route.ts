import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/admin/backups
 * 백업 파일 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const backupDir = path.join(process.cwd(), 'backups');
    
    // 백업 디렉토리가 없으면 빈 배열 반환
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({
        success: true,
        backups: [],
      });
    }

    // 백업 파일 목록 가져오기
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('dev.db.backup_'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      backups: files,
      count: files.length,
    });
  } catch (error) {
    console.error('Get backups error:', error);
    return NextResponse.json(
      { error: '백업 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/backups
 * 백업 복원 또는 새 백업 생성
 */
export async function POST(request: NextRequest) {
  try {
    const { action, filename } = await request.json();

    if (action === 'restore') {
      // 백업 복원
      if (!filename) {
        return NextResponse.json(
          { error: '백업 파일명이 필요합니다.' },
          { status: 400 }
        );
      }

      const backupPath = path.join(process.cwd(), 'backups', filename);
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

      // 백업 파일 존재 확인
      if (!fs.existsSync(backupPath)) {
        return NextResponse.json(
          { error: '백업 파일을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // 현재 DB를 임시 백업
      const tempBackupName = `dev.db.backup_before_restore_${Date.now()}`;
      const tempBackupPath = path.join(process.cwd(), 'backups', tempBackupName);
      fs.copyFileSync(dbPath, tempBackupPath);

      try {
        // 백업 파일로 DB 복원
        fs.copyFileSync(backupPath, dbPath);

        return NextResponse.json({
          success: true,
          message: '백업이 성공적으로 복원되었습니다.',
          restoredFrom: filename,
          tempBackup: tempBackupName,
        });
      } catch (error) {
        // 복원 실패 시 임시 백업으로 롤백
        fs.copyFileSync(tempBackupPath, dbPath);
        throw error;
      }
    } else if (action === 'create') {
      // 새 백업 생성
      const backupDatabase = (await import('@/scripts/backup-db.js')).default;
      await backupDatabase();

      return NextResponse.json({
        success: true,
        message: '새 백업이 생성되었습니다.',
      });
    } else if (action === 'delete') {
      // 백업 삭제
      if (!filename) {
        return NextResponse.json(
          { error: '백업 파일명이 필요합니다.' },
          { status: 400 }
        );
      }

      const backupPath = path.join(process.cwd(), 'backups', filename);

      if (!fs.existsSync(backupPath)) {
        return NextResponse.json(
          { error: '백업 파일을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      fs.unlinkSync(backupPath);

      return NextResponse.json({
        success: true,
        message: '백업 파일이 삭제되었습니다.',
      });
    } else {
      return NextResponse.json(
        { error: '잘못된 액션입니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Backup operation error:', error);
    return NextResponse.json(
      { error: '백업 작업 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
