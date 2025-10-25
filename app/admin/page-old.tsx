'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // 엑셀 업로드 관련
  const [file, setFile] = useState<File | null>(null);
  const [uploadMonth, setUploadMonth] = useState('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState('');

  // 신청자 목록 관련
  const [applicants, setApplicants] = useState<any[]>([]);
  const [viewMonth, setViewMonth] = useState('');

  useEffect(() => {
    // 현재 월 설정
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setUploadMonth(currentMonth);
    setViewMonth(currentMonth);
  }, []);

  // 로그인
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, action: 'login' }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || '로그인 실패');
      } else {
        setIsLoggedIn(true);
        setLoginError('');
        loadApplicants();
      }
    } catch (err) {
      setLoginError('서버 연결 오류');
    } finally {
      setLoading(false);
    }
  };

  // 엑셀 파일 업로드
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploadError('');
    setUploadResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('month', uploadMonth);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setUploadError(data.error || '업로드 실패');
      } else {
        setUploadResult(data);
        setFile(null);
        // 파일 input 초기화
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // 목록 새로고침
        loadApplicants();
      }
    } catch (err) {
      setUploadError('서버 연결 오류');
    } finally {
      setLoading(false);
    }
  };

  // 신청자 목록 불러오기
  const loadApplicants = async () => {
    try {
      const response = await fetch(`/api/admin/upload?month=${viewMonth}`);
      const data = await response.json();

      if (response.ok) {
        setApplicants(data.applicants || []);
      }
    } catch (err) {
      console.error('Failed to load applicants:', err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadApplicants();
    }
  }, [viewMonth, isLoggedIn]);

  // 로그인 화면
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              관리자 로그인
            </h1>
            <p className="text-gray-600">
              관리자 계정으로 로그인하세요
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  사용자명
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="관리자 아이디"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 placeholder:text-gray-500 text-gray-900"
                  placeholder="비밀번호"
                  required
                />
              </div>

              {loginError && (
                <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-semibold">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-purple-700 disabled:bg-gray-300 transition-all"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-purple-600 hover:text-purple-800 font-semibold">
              ← 메인 페이지로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 관리자 대시보드
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">관리자 대시보드</h1>
              <p className="text-gray-600 mt-1">급식 신청자 관리</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
              >
                메인 페이지
              </Link>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 엑셀 업로드 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📊 신청자 명단 업로드
            </h2>
            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  대상 월
                </label>
                <input
                  type="month"
                  value={uploadMonth}
                  onChange={(e) => setUploadMonth(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 placeholder:text-gray-500 text-gray-900"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  엑셀 파일
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  학번이 포함된 엑셀 파일을 업로드하세요
                </p>
              </div>

              {uploadError && (
                <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-semibold">{uploadError}</p>
                </div>
              )}

              {uploadResult && (
                <div className="mb-4 bg-green-50 border-2 border-green-200 rounded-lg p-3">
                  <p className="text-green-600 text-sm font-semibold">
                    ✓ {uploadResult.count}명의 신청자가 등록되었습니다
                  </p>
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-orange-600 text-xs font-semibold">
                        일부 오류:
                      </p>
                      <ul className="text-xs text-gray-600 mt-1 max-h-20 overflow-y-auto">
                        {uploadResult.errors.slice(0, 5).map((err: string, idx: number) => (
                          <li key={idx}>• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-300 transition-all"
              >
                {loading ? '업로드 중...' : '업로드'}
              </button>
            </form>
          </div>

          {/* 통계 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              📈 통계
            </h2>
            <div className="space-y-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">총 신청자</p>
                <p className="text-3xl font-bold text-purple-600">
                  {applicants.length}명
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">대상 월</p>
                <p className="text-2xl font-bold text-blue-600">
                  {viewMonth}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 신청자 목록 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              👥 신청자 목록
            </h2>
            <input
              type="month"
              value={viewMonth}
              onChange={(e) => setViewMonth(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500"
            />
          </div>

          {applicants.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              등록된 신청자가 없습니다
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {applicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="bg-purple-50 rounded-lg p-3 text-center"
                  >
                    <p className="font-mono font-bold text-purple-700">
                      {applicant.studentId}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
