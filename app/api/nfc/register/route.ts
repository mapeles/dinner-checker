import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  isValidNfcId,
  isValidStudentId,
  isValidPassword,
  hashPassword,
  verifyPassword,
} from '@/lib/utils';

/**
 * POST /api/nfc/register
 * NFC 카드 최초 등록
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nfcId, studentId, password } = body;

    // 입력 검증
    const isTempNfc = nfcId.startsWith('TEMP');
    
    if (!isTempNfc && !isValidNfcId(nfcId)) {
      return NextResponse.json(
        { error: 'NFC ID는 10자리 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    if (!isValidStudentId(studentId)) {
      return NextResponse.json(
        { error: '학번은 5자리 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: '비밀번호는 4자리 숫자여야 합니다.' },
        { status: 400 }
      );
    }

    // 학번으로 기존 학생 확인
    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    });

    // 실제 NFC ID로 등록하는 경우 (카드가 있는 경우)
    if (!isTempNfc) {
      // NFC ID 중복 확인
      const existingNfc = await prisma.student.findUnique({
        where: { nfcId },
      });

      if (existingNfc) {
        return NextResponse.json(
          { error: '이미 등록된 NFC 카드입니다.' },
          { status: 409 }
        );
      }

      // 학번이 이미 존재하는 경우 (병합)
      if (existingStudent) {
        // 비밀번호 확인
        const isPasswordValid = await verifyPassword(password, existingStudent.password);
        
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: '이미 등록된 학생입니다. 비밀번호 일치 여부를 확인해주세요.' },
            { status: 401 }
          );
        }

        // 비밀번호가 일치하면 NFC ID 업데이트 (병합)
        await prisma.student.update({
          where: { studentId },
          data: { nfcId },
        });

        return NextResponse.json({
          success: true,
          message: '카드가 연결되었습니다.',
          merged: true,
        });
      }
    }

    // 학번이 이미 존재하는 경우 (임시 등록 중복)
    if (existingStudent) {
      return NextResponse.json(
        { error: '이미 등록된 학번입니다.' },
        { status: 409 }
      );
    }

    // 새로운 학생 등록
    const hashedPassword = await hashPassword(password);

    const student = await prisma.student.create({
      data: {
        nfcId,
        studentId,
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: '등록이 완료되었습니다.',
      student: {
        id: student.id,
        nfcId: student.nfcId,
        studentId: student.studentId,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
