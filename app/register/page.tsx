'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterForm() {
  const searchParams = useSearchParams();
  const urlNfcId = searchParams.get('nfcId') || '';
  const urlStudentId = searchParams.get('studentId') || '';

  const [nfcId, setNfcId] = useState(urlNfcId);
  const [studentId, setStudentId] = useState(urlStudentId);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // 입력 필드 참조
  const studentIdRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // URL에서 전달된 값 자동 입력
  useEffect(() => {
    if (urlNfcId) {
      setNfcId(urlNfcId);
    }
    if (urlStudentId) {
      setStudentId(urlStudentId);
    }
  }, [urlNfcId, urlStudentId]);

  // 자동 포커싱
  useEffect(() => {
    // 학번이 자동 입력된 경우 (메인페이지에서 학번 입력 후 넘어옴) -> 비밀번호로 포커스
    if (urlStudentId) {
      passwordRef.current?.focus();
    } 
    // NFC 카드만 태깅한 경우 (카드는 있지만 학번은 없음) -> 학번으로 포커스
    else if (urlNfcId) {
      studentIdRef.current?.focus();
    }
    // 둘 다 없는 경우 (직접 등록 페이지 접근) -> 학번으로 포커스
    else {
      studentIdRef.current?.focus();
    }
  }, [urlStudentId, urlNfcId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 검증
    if (nfcId && nfcId.length !== 10) {
      setError('NFC ID는 10자리여야 합니다.');
      setLoading(false);
      return;
    }

    if (studentId.length !== 5) {
      setError('학번은 5자리여야 합니다.');
      setLoading(false);
      return;
    }

    if (password.length !== 4) {
      setError('비밀번호는 4자리여야 합니다.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    // NFC ID가 없으면 임시 NFC ID 생성
    const finalNfcId = nfcId || `TEMP${studentId}`;

    try {
      const response = await fetch('/api/nfc/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcId: finalNfcId, studentId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '등록 중 오류가 발생했습니다.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            등록 완료!
          </h2>
          <p className="text-gray-600">메인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            카드 등록
          </h1>
          <p className="text-gray-600">
            NFC 카드와 학번을 연결하세요
          </p>
        </div>

        {/* 등록 폼 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <form onSubmit={handleSubmit}>
            {/* NFC ID */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                NFC 카드 번호 (10자리) {!urlNfcId && <span className="text-gray-400 text-sm">- 자동입력</span>}
              </label>
              <input
                type="text"
                value={nfcId}
                onChange={(e) => setNfcId(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-lg text-xl font-mono focus:outline-none placeholder:text-gray-400 ${
                  urlNfcId || nfcId
                    ? 'bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                placeholder="카드를 태깅하면 자동으로 입력됩니다"
                maxLength={10}
                readOnly
                disabled
              />
              {urlNfcId ? (
                <p className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                  <span>✓</span> 태깅한 카드 번호가 자동으로 입력되었습니다
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-400">
                  💡 카드 없이도 등록 가능합니다 (학번과 비밀번호만 입력)
                </p>
              )}
            </div>
            <hr className="my-6" />
            {/* 학번 */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                학번 <span className="text-red-500">*</span>
              </label>
              <input
                ref={studentIdRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={studentId}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setStudentId(value);
                }}
                className={`w-full px-4 py-3 border-2 rounded-lg text-xl font-mono focus:outline-none placeholder:text-gray-500 ${
                  urlStudentId
                    ? 'bg-gray-50 border-gray-300 text-gray-900 cursor-not-allowed'
                    : 'border-blue-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
                maxLength={5}
                placeholder='00000'
                required
                readOnly={!!urlStudentId}
              />
              {urlStudentId ? (
                <p className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                  <span>✓</span> 입력하신 학번이 자동으로 입력되었습니다
                </p>
              ) : ( null
              )}
            </div>

            {/* 비밀번호 */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                비밀번호 (4자리) <span className="text-red-500">*</span>
              </label>
              <input
                ref={passwordRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={password}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setPassword(value);
                }}
                className="w-full px-4 py-3 border-2 border-blue-300 bg-white rounded-lg text-xl font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-500 text-gray-900"
                placeholder="••••"
                maxLength={4}
                required
              />
            </div>

            {/* 비밀번호 확인 */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={confirmPassword}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setConfirmPassword(value);
                }}
                className="w-full px-4 py-3 border-2 border-blue-300 bg-white rounded-lg text-xl font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-500 text-gray-900"
                placeholder="••••"
                maxLength={4}
                required
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm font-semibold">{error}</p>
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </form>
        </div>

        {/* 하단 링크 */}
        <div className="text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← 메인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">로딩 중...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
