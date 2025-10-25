'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ChangePasswordForm() {
  const searchParams = useSearchParams();
  const urlNfcId = searchParams.get('nfcId') || '';

  const [nfcId, setNfcId] = useState(urlNfcId);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waitingForCard, setWaitingForCard] = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // URL에서 NFC ID가 있으면 자동으로 학생 정보 조회
  useEffect(() => {
    if (urlNfcId) {
      setNfcId(urlNfcId);
      checkNfcId(urlNfcId);
    }
  }, [urlNfcId]);

  // 카드 태깅 대기 중일 때 포커스 유지
  useEffect(() => {
    if (waitingForCard) {
      inputRef.current?.focus();
      
      const interval = setInterval(() => {
        inputRef.current?.focus();
      }, 100);

      return () => clearInterval(interval);
    } else {
      passwordRef.current?.focus();
    }
  }, [waitingForCard]);

  // NFC 입력 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedInput = nfcId.trim();
      
      if (trimmedInput.length === 10 && /^\d{10}$/.test(trimmedInput)) {
        checkNfcId(trimmedInput);
      } else {
        setError('10자리 NFC 번호를 입력하세요.');
      }
    }
  };

  // NFC ID로 학생 정보 확인
  const checkNfcId = async (nfcIdToCheck: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/nfc/check-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcId: nfcIdToCheck }),
      });

      const data = await response.json();

      if (!response.ok || !data.exists) {
        setError('등록되지 않은 카드입니다. 먼저 학번을 등록해주세요.');
        setNfcId('');
        return;
      }

      // 학생 정보 설정
      setStudentInfo(data.student);
      setWaitingForCard(false);
      setError('');
    } catch (err) {
      setError('확인 중 오류가 발생했습니다.');
      setNfcId('');
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 변경 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 검증
    if (newPassword.length !== 4) {
      setError('비밀번호는 4자리여야 합니다.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/nfc/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nfcId,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '비밀번호 변경 중 오류가 발생했습니다.');
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
            비밀번호 변경 완료!
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
            비밀번호 변경
          </h1>
          <p className="text-gray-600">
            {waitingForCard ? 'NFC 카드를 태깅하세요' : '새 비밀번호를 설정하세요'}
          </p>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {waitingForCard ? (
            // 카드 태깅 대기 화면
            <div className="text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">💳</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  카드 태깅 필요
                </h2>
                <p className="text-gray-600">
                  비밀번호 변경을 위해<br />
                  NFC 카드를 태깅해주세요
                </p>
              </div>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={nfcId}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setNfcId(value);
                }}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-blue-500 placeholder:text-gray-400 text-gray-900"
                placeholder="카드를 태깅하세요"
                maxLength={10}
                autoFocus
                disabled={loading}
              />
              <p className="mt-2 text-sm text-gray-400">
                {nfcId.length > 0 && `${nfcId.length}/10 자리`}
              </p>
            </div>
          ) : (
            // 비밀번호 변경 폼
            <form onSubmit={handleSubmit}>
              {/* 학생 정보 표시 */}
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">등록된 학생</p>
                <p className="text-2xl font-bold text-blue-800">
                  {studentInfo?.studentId}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {studentInfo?.studentInfo?.grade}학년 {studentInfo?.studentInfo?.class}반 {studentInfo?.studentInfo?.number}번
                </p>
              </div>

              {/* 새 비밀번호 */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  새 비밀번호 (4자리) <span className="text-red-500">*</span>
                </label>
                <input
                  ref={passwordRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={newPassword}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setNewPassword(value);
                  }}
                  className="w-full px-4 py-3 border-2 border-blue-300 bg-white rounded-lg text-xl font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-gray-500 text-gray-900"
                  placeholder="••••"
                  maxLength={4}
                  required
                  autoFocus
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

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm font-semibold">{error}</p>
            </div>
          )}
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

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">로딩 중...</div>}>
      <ChangePasswordForm />
    </Suspense>
  );
}
