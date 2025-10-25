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
    } else if (action === 'changePassword') {
      // 비밀번호 변경
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: '현재 비밀번호와 새 비밀번호가 필요합니다.' },
          { status: 400 }
        );
      }

      const admin = await prisma.admin.findUnique({
        where: { username },
      });

      if (!admin) {
        return NextResponse.json(
          { error: '관리자 계정이 존재하지 않습니다.' },
          { status: 404 }
        );
      }

      // 현재 비밀번호 확인
      const isPasswordValid = await verifyPassword(currentPassword, admin.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '현재 비밀번호가 일치하지 않습니다.' },
          { status: 401 }
        );
      }

      // 새 비밀번호로 업데이트
      const hashedNewPassword = await hashPassword(newPassword);
      await prisma.admin.update({
        where: { id: admin.id },
        data: { password: hashedNewPassword },
      });

      return NextResponse.json({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.',
      });
    } else if (action === 'changeUsername') {
      // 사용자명 변경
      const { currentPassword, newUsername } = body;

      if (!currentPassword || !newUsername) {
        return NextResponse.json(
          { error: '현재 비밀번호와 새 사용자명이 필요합니다.' },
          { status: 400 }
        );
      }

      const admin = await prisma.admin.findUnique({
        where: { username },
      });

      if (!admin) {
        return NextResponse.json(
          { error: '관리자 계정이 존재하지 않습니다.' },
          { status: 404 }
        );
      }

      // 현재 비밀번호 확인
      const isPasswordValid = await verifyPassword(currentPassword, admin.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '비밀번호가 일치하지 않습니다.' },
          { status: 401 }
        );
      }

      // 새 사용자명이 이미 존재하는지 확인
      const existingAdmin = await prisma.admin.findUnique({
        where: { username: newUsername },
      });

      if (existingAdmin && existingAdmin.id !== admin.id) {
        return NextResponse.json(
          { error: '이미 사용 중인 사용자명입니다.' },
          { status: 409 }
        );
      }

      // 사용자명 업데이트
      await prisma.admin.update({
        where: { id: admin.id },
        data: { username: newUsername },
      });

      return NextResponse.json({
        success: true,
        message: '사용자명이 성공적으로 변경되었습니다.',
        newUsername,
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
