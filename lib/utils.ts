import bcrypt from 'bcryptjs';

/**
 * 학번 파싱 (예: "20701" -> { grade: 2, class: 7, number: 1 })
 */
export function parseStudentId(studentId: string): {
  grade: number;
  class: number;
  number: number;
  formatted: string;
} {
  if (studentId.length !== 5) {
    throw new Error('학번은 5자리여야 합니다.');
  }

  const grade = parseInt(studentId[0]);
  const classNum = parseInt(studentId.substring(1, 3));
  const number = parseInt(studentId.substring(3, 5));

  if (isNaN(grade) || isNaN(classNum) || isNaN(number)) {
    throw new Error('유효하지 않은 학번 형식입니다.');
  }

  return {
    grade,
    class: classNum,
    number,
    formatted: `${grade}학년 ${classNum}반 ${number}번`,
  };
}

/**
 * 학번 유효성 검증
 */
export function isValidStudentId(studentId: string): boolean {
  if (!/^\d{5}$/.test(studentId)) {
    return false;
  }

  try {
    parseStudentId(studentId);
    return true;
  } catch {
    return false;
  }
}

/**
 * NFC ID 유효성 검증 (10자리 숫자)
 */
export function isValidNfcId(nfcId: string): boolean {
  return /^\d{10}$/.test(nfcId);
}

/**
 * 4자리 비밀번호 유효성 검증
 */
export function isValidPassword(password: string): boolean {
  return /^\d{4}$/.test(password);
}

/**
 * 비밀번호 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * 비밀번호 확인
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * 현재 월 가져오기 (YYYY-MM 형식)
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 월 형식 검증 (YYYY-MM)
 */
export function isValidMonth(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}
