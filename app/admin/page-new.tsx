'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type TabType = 'applicants' | 'students' | 'checkins';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('applicants');

  // 엑셀 업로드 관련
  const [file, setFile] = useState<File | null>(null);
  const [uploadMonth, setUploadMonth] = useState('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState('');

  // 신청자 목록 관련
  const [applicants, setApplicants] = useState<any[]>([]);
  const [viewMonth, setViewMonth] = useState('');

  // 학생 관리 관련
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ nfcId: '', studentId: '', password: '' });

  // 체크인 기록 관련
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [checkInDate, setCheckInDate] = useState('');

  useEffect(() => {
    // 현재 월/날짜 설정
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setUploadMonth(currentMonth);
    setViewMonth(currentMonth);
    setCheckInDate(currentDate);
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
        loadStudents();
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
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
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

  // 학생 목록 불러오기
  const loadStudents = async () => {
    try {
      const response = await fetch('/api/admin/students');
      const data = await response.json();
      if (response.ok) {
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  // 체크인 기록 불러오기
  const loadCheckIns = async () => {
    try {
      const response = await fetch(`/api/admin/checkins?date=${checkInDate}`);
      const data = await response.json();
      if (response.ok) {
        setCheckIns(data.checkIns || []);
      }
    } catch (err) {
      console.error('Failed to load check-ins:', err);
    }
  };

  // 학생 비밀번호 변경
  const handleChangePassword = async () => {
    if (!selectedStudent || !newPassword || newPassword.length !== 4) {
      alert('4자리 비밀번호를 입력하세요');
      return;
    }

    try {
      const response = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent.studentId, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('비밀번호가 변경되었습니다');
        setSelectedStudent(null);
        setNewPassword('');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('오류가 발생했습니다');
    }
  };

  // 학생 추가
  const handleAddStudent = async () => {
    if (!newStudent.nfcId || !newStudent.studentId || !newStudent.password) {
      alert('모든 필드를 입력하세요');
      return;
    }

    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });

      const data = await response.json();
      if (response.ok) {
        alert('학생이 추가되었습니다');
        setShowAddStudent(false);
        setNewStudent({ nfcId: '', studentId: '', password: '' });
        loadStudents();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('오류가 발생했습니다');
    }
  };

  // 학생 삭제
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/students?studentId=${studentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok) {
        alert('학생이 삭제되었습니다');
        loadStudents();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('오류가 발생했습니다');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'applicants') loadApplicants();
      if (activeTab === 'students') loadStudents();
      if (activeTab === 'checkins') loadCheckIns();
    }
  }, [viewMonth, activeTab, isLoggedIn, checkInDate]);

  // 로그인 화면
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">관리자 로그인</h1>
            <p className="text-gray-600">관리자 계정으로 로그인하세요</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">사용자명</label>
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
                <label className="block text-gray-700 font-semibold mb-2">비밀번호</label>
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
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">관리자 대시보드</h1>
              <p className="text-gray-600 mt-1">급식 신청자 및 학생 관리</p>
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

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-2xl shadow-xl p-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('applicants')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'applicants'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 신청자 관리
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'students'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 등록자 관리
            </button>
            <button
              onClick={() => setActiveTab('checkins')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'checkins'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 입장 기록
            </button>
          </div>
        </div>

        {/* 신청자 관리 탭 */}
        {activeTab === 'applicants' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 엑셀 업로드 */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 신청자 명단 업로드</h2>
                <form onSubmit={handleUpload}>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">대상 월</label>
                    <input
                      type="month"
                      value={uploadMonth}
                      onChange={(e) => setUploadMonth(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">엑셀 파일</label>
                    <input
                      id="file-input"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                      required
                    />
                    <p className="mt-2 text-sm text-gray-500">학번이 포함된 엑셀 파일을 업로드하세요</p>
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
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 통계</h2>
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">총 신청자</p>
                    <p className="text-3xl font-bold text-purple-600">{applicants.length}명</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">대상 월</p>
                    <p className="text-2xl font-bold text-blue-600">{viewMonth}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 신청자 목록 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">👥 신청자 목록</h2>
                <input
                  type="month"
                  value={viewMonth}
                  onChange={(e) => setViewMonth(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                />
              </div>

              {applicants.length === 0 ? (
                <p className="text-center text-gray-500 py-8">등록된 신청자가 없습니다</p>
              ) : (
                <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {applicants.map((applicant) => (
                    <div key={applicant.id} className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="font-mono font-bold text-purple-700">{applicant.studentId}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 등록자 관리 탭 */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* 학생 추가 버튼 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">👥 등록자 목록 ({students.length}명)</h2>
                <button
                  onClick={() => setShowAddStudent(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                >
                  + 학생 추가
                </button>
              </div>
            </div>

            {/* 학생 추가 모달 */}
            {showAddStudent && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4">학생 추가</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">NFC ID (10자리)</label>
                      <input
                        type="text"
                        value={newStudent.nfcId}
                        onChange={(e) => setNewStudent({...newStudent, nfcId: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">학번 (5자리)</label>
                      <input
                        type="text"
                        value={newStudent.studentId}
                        onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">비밀번호 (4자리)</label>
                      <input
                        type="password"
                        value={newStudent.password}
                        onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                        maxLength={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddStudent}
                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700"
                      >
                        추가
                      </button>
                      <button
                        onClick={() => {
                          setShowAddStudent(false);
                          setNewStudent({ nfcId: '', studentId: '', password: '' });
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 비밀번호 변경 모달 */}
            {selectedStudent && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4">비밀번호 변경</h3>
                  <p className="text-gray-600 mb-4">
                    학번: {selectedStudent.studentInfo.formatted}
                  </p>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">새 비밀번호 (4자리)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                      maxLength={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleChangePassword}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700"
                    >
                      변경
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudent(null);
                        setNewPassword('');
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 학생 목록 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {students.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">등록된 학생이 없습니다</p>
                ) : (
                  students.map((student) => (
                    <div key={student.id} className="border-2 border-gray-200 rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{student.studentInfo.formatted}</p>
                        <p className="text-sm text-gray-500">NFC: {student.nfcId} | 학번: {student.studentId}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                        >
                          비밀번호 변경
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.studentId)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 입장 기록 탭 */}
        {activeTab === 'checkins' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">📋 입장 기록</h2>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                />
              </div>

              <div className="mb-4">
                <p className="text-gray-600">
                  총 {checkIns.length}명이 입장했습니다
                </p>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {checkIns.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">입장 기록이 없습니다</p>
                ) : (
                  checkIns.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className={`border-2 rounded-lg p-4 ${
                        checkIn.isApplicant
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-bold text-lg ${
                            checkIn.isApplicant ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {checkIn.studentInfo.formatted}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(checkIn.checkTime).toLocaleTimeString('ko-KR')}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-semibold ${
                          checkIn.isApplicant
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {checkIn.isApplicant ? '✓ 신청자' : '✗ 미신청자'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
