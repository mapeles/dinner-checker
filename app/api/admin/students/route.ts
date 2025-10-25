import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, parseStudentId } from '@/lib/utils';

/**
 * GET /api/admin/students
 * 모든 학생 목록 조회
 */
export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: { studentId: 'asc' },
    });

    const studentsWithInfo = students.map((student: any) => {
      const parsed = parseStudentId(student.studentId);
      return {
        id: student.id,
        nfcId: student.nfcId,
        studentId: student.studentId,
        studentInfo: parsed,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      students: studentsWithInfo,
      count: studentsWithInfo.length,
    });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { error: '학생 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/students
 * 학생 수동 추가
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nfcId, studentId, password } = body;

    // 중복 확인
    const existingNfc = await prisma.student.findUnique({
      where: { nfcId },
    });

    if (existingNfc) {
      return NextResponse.json(
        { error: '이미 등록된 NFC 카드입니다.' },
        { status: 409 }
      );
    }

    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: '이미 등록된 학번입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해싱 및 저장
    const hashedPassword = await hashPassword(password);

    const student = await prisma.student.create({
      data: {
        nfcId,
        studentId,
        password: hashedPassword,
      },
    });

    const parsed = parseStudentId(student.studentId);

    return NextResponse.json({
      success: true,
      message: '학생이 추가되었습니다.',
      student: {
        id: student.id,
        nfcId: student.nfcId,
        studentId: student.studentId,
        studentInfo: parsed,
      },
    });
  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json(
      { error: '학생 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/students
 * 학생 정보 수정 (비밀번호 또는 NFC ID 변경)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, newPassword, newNfcId } = body;

    const student = await prisma.student.findUnique({
      where: { studentId },
    });

    if (!student) {
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // 비밀번호 변경
    if (newPassword) {
      const hashedPassword = await hashPassword(newPassword);
      updateData.password = hashedPassword;
    }

    // NFC ID 변경
    if (newNfcId) {
      // 중복 확인
      const existingNfc = await prisma.student.findUnique({
        where: { nfcId: newNfcId },
      });

      if (existingNfc && existingNfc.studentId !== studentId) {
        return NextResponse.json(
          { error: '이미 사용 중인 NFC ID입니다.' },
          { status: 409 }
        );
      }

      updateData.nfcId = newNfcId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '변경할 정보가 없습니다.' },
        { status: 400 }
      );
    }

    await prisma.student.update({
      where: { studentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: '비밀번호가 변경되었습니다.',
    });
  } catch (error) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { error: '학생 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/students
 * 학생 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: '학번이 필요합니다.' },
        { status: 400 }
      );
    }

    // 학생의 체크인 기록도 함께 삭제
    await prisma.checkIn.deleteMany({
      where: { studentId },
    });

    await prisma.student.delete({
      where: { studentId },
    });

    return NextResponse.json({
      success: true,
      message: '학생이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { error: '학생 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
