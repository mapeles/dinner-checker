import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/utils';

/**
 * POST /api/admin/auth
 * 관리자 로그인
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, action } = body;

    if (action === 'login') {
      // 로그인
      const admin = await prisma.admin.findUnique({
        where: { username },
      });

      if (!admin) {
        return NextResponse.json(
          { error: '관리자 계정이 존재하지 않습니다.' },
          { status: 404 }
        );
      }

      const isPasswordValid = await verifyPassword(password, admin.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '비밀번호가 일치하지 않습니다.' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '로그인 성공',
        admin: {
          id: admin.id,
          username: admin.username,
        },
      });
    } else if (action === 'init') {
      // 최초 관리자 계정 생성 (이미 존재하면 실패)
      const existingAdmin = await prisma.admin.findFirst();
      if (existingAdmin) {
        return NextResponse.json(
          { error: '이미 관리자 계정이 존재합니다.' },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(password);
      const admin = await prisma.admin.create({
        data: {
          username,
          password: hashedPassword,
        },
      });

      return NextResponse.json({
        success: true,
        message: '관리자 계정이 생성되었습니다.',
        admin: {
          id: admin.id,
          username: admin.username,
        },
      });
    } else {
      return NextResponse.json(
        { error: '유효하지 않은 액션입니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: '인증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
