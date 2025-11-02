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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 입력 필드 참조
  const studentIdRef = useRef<HTMLInputElement>(null);

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
    // NFC 카드만 태깅한 경우 (카드는 있지만 학번은 없음) -> 학번으로 포커스
    if (urlNfcId && !urlStudentId) {
      studentIdRef.current?.focus();
    }
    // 둘 다 없는 경우 (직접 등록 페이지 접근) -> 학번으로 포커스
    else if (!urlNfcId && !urlStudentId) {
      studentIdRef.current?.focus();
    }
  }, [urlStudentId, urlNfcId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // NFC 카드 등록인 경우 확인 모달 표시
    if (nfcId && !nfcId.startsWith('TEMP')) {
      setShowConfirmModal(true);
      return;
    }
    
    // 임시 등록이거나 모달 확인 후 실제 등록 진행
    await performRegistration();
  };
  
  const performRegistration = async () => {
    setError('');
    setLoading(true);
    setShowConfirmModal(false);

    // 검증
    if (nfcId && !nfcId.startsWith('TEMP') && nfcId.length !== 10) {
      setError('NFC ID는 10자리여야 합니다.');
      setLoading(false);
      return;
    }

    if (studentId.length !== 5) {
      setError('학번은 5자리여야 합니다.');
      setLoading(false);
      return;
    }

    // NFC ID가 없으면 임시 NFC ID 생성
    const finalNfcId = nfcId || `TEMP${studentId}`;

    try {
      const response = await fetch('/api/nfc/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcId: finalNfcId, studentId }),
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
                  💡 카드 없이도 등록 가능합니다 (학번만 입력)
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
      
      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">❓</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                등록 확인
              </h2>
              <p className="text-gray-600 mb-4">
                다음 정보로 등록하시겠습니까?
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-600 mb-1">NFC 카드 번호:</p>
                <p className="text-lg font-mono font-bold text-blue-600 mb-3">{nfcId}</p>
                <p className="text-sm text-gray-600 mb-1">학번:</p>
                <p className="text-lg font-mono font-bold text-blue-600">{studentId}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-all"
              >
                취소
              </button>
              <button
                onClick={performRegistration}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '등록 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
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
