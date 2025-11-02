'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type TabType = 'applicants' | 'registered' | 'checkins' | 'backups' | 'settings';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('applicants');

  // 엑셀 업로드 관련
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false); // 기존 신청자 대체 여부

  // 신청자 목록 관련
  const [applicants, setApplicants] = useState<any[]>([]);
  const [applicantSearchQuery, setApplicantSearchQuery] = useState('');
  const [showAddApplicant, setShowAddApplicant] = useState(false);
  const [newApplicantId, setNewApplicantId] = useState('');

  // 등록된 학생 관련
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newNfcId, setNewNfcId] = useState('');

  // 체크인 기록 관련
  const [checkIns, setCheckIns] = useState<any[]>([]);
  const [checkInDate, setCheckInDate] = useState('');
  const [selectedCheckIn, setSelectedCheckIn] = useState<any>(null); // 선택된 체크인 (모달용)

  // 백업 관련
  const [backups, setBackups] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [backupError, setBackupError] = useState('');

  // 설정 관련
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    // 현재 날짜 설정
    const now = new Date();
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
      }
    } catch (err) {
      setLoginError('서버 연결 오류');
    } finally {
      setLoading(false);
    }
  };

  // 엑셀 파일 업로드 (월 구분 없이)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploadError('');
    setUploadResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('replaceExisting', replaceExisting.toString());

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

  // 신청자 목록 불러오기 (월 구분 없이)
  const loadApplicants = async () => {
    try {
      const response = await fetch('/api/admin/upload');
      const data = await response.json();
      if (response.ok) {
        setApplicants(data.applicants || []);
      }
    } catch (err) {
      console.error('Failed to load applicants:', err);
    }
  };

  // 등록된 학생 목록 불러오기
  const loadRegisteredStudents = async () => {
    try {
      const response = await fetch('/api/admin/students');
      const data = await response.json();
      if (response.ok) {
        setRegisteredStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to load registered students:', err);
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

  // 백업 목록 불러오기
  const loadBackups = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch('/api/admin/backups');
      const data = await response.json();
      if (response.ok) {
        setBackups(data.backups || []);
      } else {
        setBackupError(data.error || '백업 목록을 불러오지 못했습니다.');
      }
    } catch (err) {
      setBackupError('백업 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setBackupLoading(false);
    }
  };

  // 새 백업 생성
  const handleCreateBackup = async () => {
    setBackupLoading(true);
    setBackupError('');
    setBackupMessage('');
    
    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });

      const data = await response.json();
      if (response.ok) {
        setBackupMessage('새 백업이 생성되었습니다.');
        loadBackups();
      } else {
        setBackupError(data.error || '백업 생성에 실패했습니다.');
      }
    } catch (err) {
      setBackupError('백업 생성 중 오류가 발생했습니다.');
    } finally {
      setBackupLoading(false);
    }
  };

  // 백업 복원
  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`"${filename}" 백업으로 복원하시겠습니까?\n\n현재 데이터베이스는 자동으로 백업됩니다.`)) {
      return;
    }

    setBackupLoading(true);
    setBackupError('');
    setBackupMessage('');
    
    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', filename }),
      });

      const data = await response.json();
      if (response.ok) {
        setBackupMessage('백업이 성공적으로 복원되었습니다. 페이지를 새로고침합니다.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setBackupError(data.error || '백업 복원에 실패했습니다.');
      }
    } catch (err) {
      setBackupError('백업 복원 중 오류가 발생했습니다.');
    } finally {
      setBackupLoading(false);
    }
  };

  // 백업 삭제
  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`"${filename}" 백업을 삭제하시겠습니까?`)) {
      return;
    }

    setBackupLoading(true);
    setBackupError('');
    setBackupMessage('');
    
    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', filename }),
      });

      const data = await response.json();
      if (response.ok) {
        setBackupMessage('백업 파일이 삭제되었습니다.');
        loadBackups();
      } else {
        setBackupError(data.error || '백업 삭제에 실패했습니다.');
      }
    } catch (err) {
      setBackupError('백업 삭제 중 오류가 발생했습니다.');
    } finally {
      setBackupLoading(false);
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsMessage('');

    if (newAdminPassword !== confirmPassword) {
      setSettingsError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newAdminPassword.length < 4) {
      setSettingsError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changePassword',
          username,
          currentPassword,
          newPassword: newAdminPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSettingsMessage('비밀번호가 성공적으로 변경되었습니다.');
        setCurrentPassword('');
        setNewAdminPassword('');
        setConfirmPassword('');
      } else {
        setSettingsError(data.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (err) {
      setSettingsError('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  // 사용자명 변경
  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsMessage('');

    if (!newUsername) {
      setSettingsError('새 사용자명을 입력하세요.');
      return;
    }

    if (newUsername.length < 3) {
      setSettingsError('사용자명은 최소 3자 이상이어야 합니다.');
      return;
    }

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'changeUsername',
          username,
          currentPassword: currentUsername,
          newUsername,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSettingsMessage(`사용자명이 "${newUsername}"으로 변경되었습니다. 다시 로그인해주세요.`);
        setCurrentUsername('');
        setNewUsername('');
        setTimeout(() => {
          setIsLoggedIn(false);
          setUsername('');
        }, 2000);
      } else {
        setSettingsError(data.error || '사용자명 변경에 실패했습니다.');
      }
    } catch (err) {
      setSettingsError('사용자명 변경 중 오류가 발생했습니다.');
    }
  };

  // 신청자 추가
  const handleAddApplicant = async () => {
    if (!newApplicantId || newApplicantId.length !== 5) {
      alert('5자리 학번을 입력하세요');
      return;
    }

    try {
      const response = await fetch('/api/admin/applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: newApplicantId }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('신청자가 추가되었습니다');
        setShowAddApplicant(false);
        setNewApplicantId('');
        loadApplicants();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('오류가 발생했습니다');
    }
  };

  // 신청자 삭제
  const handleDeleteApplicant = async (studentId: string) => {
    if (!confirm('이 학생의 신청을 취소하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/applicants?studentId=${studentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok) {
        alert('신청이 취소되었습니다');
        loadApplicants();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('오류가 발생했습니다');
    }
  };

  // 학생 정보 변경 (NFC ID만)
  const handleUpdateStudent = async () => {
    if (!selectedStudent) return;

    if (!newNfcId) {
      alert('변경할 NFC ID를 입력하세요');
      return;
    }

    if (newNfcId.length !== 10) {
      alert('NFC ID는 10자리여야 합니다');
      return;
    }

    try {
      const response = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId: selectedStudent.studentId, 
          newNfcId: newNfcId
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('NFC ID가 변경되었습니다');
        setSelectedStudent(null);
        setNewNfcId('');
        loadRegisteredStudents();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('오류가 발생했습니다');
    }
  };

  // 데이터베이스 완전 초기화
  const handleResetDatabase = async () => {
    if (!confirm('⚠️ 경고: 모든 학생 데이터, 신청자, 체크인 기록이 삭제됩니다.\n관리자 계정만 유지됩니다.\n\n정말 초기화하시겠습니까?')) {
      return;
    }

    if (!confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/reset', {
        method: 'DELETE',
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ 데이터베이스가 초기화되었습니다.');
        // 모든 목록 새로고침
        setApplicants([]);
        setRegisteredStudents([]);
        setCheckIns([]);
        loadApplicants();
      } else {
        alert('❌ ' + (data.error || '초기화 실패'));
      }
    } catch (err) {
      alert('❌ 서버 연결 오류');
    } finally {
      setLoading(false);
    }
  };

  // 학생 검색 필터링
  const filteredStudents = registeredStudents.filter((student) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.studentId.includes(query) ||
      student.nfcId.includes(query) ||
      student.studentInfo.formatted.includes(query) ||
      `${student.studentInfo.grade}학년`.includes(query) ||
      `${student.studentInfo.class}반`.includes(query)
    );
  });

  // 신청자 검색 필터링
  const filteredApplicants = applicants.filter((applicant) => {
    if (!applicantSearchQuery) return true;
    const query = applicantSearchQuery.toLowerCase();
    return (
      applicant.studentId.includes(query) ||
      `${applicant.studentId[0]}학년`.includes(query) ||
      `${applicant.studentId.substring(1, 3)}반`.includes(query)
    );
  });

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'applicants') loadApplicants();
      if (activeTab === 'registered') loadRegisteredStudents();
      if (activeTab === 'checkins') loadCheckIns();
      if (activeTab === 'backups') loadBackups();
    }
  }, [activeTab, isLoggedIn, checkInDate]);

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">관리자 대시보드</h1>
              <p className="text-gray-600 mt-1">급식 신청자 및 학생 관리</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                ← 메인 페이지
              </Link>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-2xl shadow-xl p-2 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            <button
              onClick={() => setActiveTab('applicants')}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'applicants'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 신청자 관리
            </button>
            <button
              onClick={() => setActiveTab('registered')}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'registered'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 등록자 목록
            </button>
            <button
              onClick={() => setActiveTab('checkins')}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'checkins'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 입장 기록
            </button>
            <button
              onClick={() => setActiveTab('backups')}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'backups'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💾 백업 관리
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚙️ 계정 설정
            </button>
          </div>
        </div>

        {/* 신청자 관리 탭 (통합) */}
        {activeTab === 'applicants' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 엑셀 업로드 */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 신청자 명단 업로드</h2>
                <form onSubmit={handleUpload}>
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

                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={replaceExisting}
                        onChange={(e) => setReplaceExisting(e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-gray-700 font-semibold">기존 신청자 명단을 삭제하고 대체</span>
                    </label>
                    <p className="mt-1 ml-6 text-sm text-gray-500">
                      {replaceExisting 
                        ? '✓ 기존 신청자를 모두 삭제하고 새로운 명단으로 대체합니다' 
                        : '✓ 기존 신청자에 새로운 명단을 추가합니다 (중복 제외)'}
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

              {/* 개별 추가 */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">✏️ 개별 추가</h2>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">학번 (5자리)</label>
                  <input
                    type="text"
                    value={newApplicantId}
                    onChange={(e) => setNewApplicantId(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                    placeholder="예: 20701"
                    maxLength={5}
                  />
                </div>
                <button
                  onClick={handleAddApplicant}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all"
                >
                  신청자 추가
                </button>
                
                <div className="mt-6 bg-purple-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">총 신청자</p>
                  <p className="text-3xl font-bold text-purple-600">{applicants.length}명</p>
                </div>
              </div>
            </div>

            {/* 신청자 목록 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">👥 신청자 목록</h2>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={applicantSearchQuery}
                    onChange={(e) => setApplicantSearchQuery(e.target.value)}
                    placeholder="학번, 학년, 반 검색..."
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900"
                  />
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                {applicantSearchQuery
                  ? `검색 결과: ${filteredApplicants.length}명 / 전체 ${applicants.length}명`
                  : `전체 ${applicants.length}명`}
              </p>

              {filteredApplicants.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {applicantSearchQuery ? '검색 결과가 없습니다' : '등록된 신청자가 없습니다'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                  {filteredApplicants.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="border-2 border-gray-200 rounded-lg p-4 flex justify-between items-center hover:bg-purple-50"
                    >
                      <div>
                        <p className="font-mono font-bold text-lg text-purple-700">
                          {applicant.studentId}
                        </p>
                        <p className="text-sm text-gray-500">
                          {applicant.studentId[0]}학년 {applicant.studentId.substring(1, 3)}반 {applicant.studentId.substring(3, 5)}번
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteApplicant(applicant.studentId)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 text-sm"
                      >
                        취소
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 등록자 목록 탭 */}
        {activeTab === 'registered' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 등록된 학생 목록</h2>
              
              {/* 검색 바 */}
              <div className="mb-6">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="학번, NFC ID, 학년반으로 검색..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 placeholder:text-gray-500 text-gray-900"
                />
              </div>

              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? `검색 결과: ${filteredStudents.length}명 / 전체 ${registeredStudents.length}명`
                  : `현재 ${registeredStudents.length}명의 학생이 등록되어 있습니다`
                }
              </p>

              {filteredStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {searchQuery ? '검색 결과가 없습니다' : '등록된 학생이 없습니다'}
                </p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className="border-2 border-gray-200 rounded-lg p-4 hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-xl text-purple-700">
                            {student.studentInfo.formatted}
                          </p>
                          <div className="text-sm text-gray-500 mt-1 space-y-1">
                            <p>• NFC ID: <span className="font-mono">{student.nfcId}</span></p>
                            <p>• 학번: <span className="font-mono">{student.studentId}</span></p>
                            <p>• 등록일: {new Date(student.createdAt).toLocaleDateString('ko-KR')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-semibold mb-2">
                            {student.studentInfo.grade}학년 {student.studentInfo.class}반
                          </div>
                          <p className="text-xs text-gray-500">클릭하여 NFC ID 변경</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* NFC ID 변경 모달 */}
            {selectedStudent && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4">NFC ID 변경</h3>
                  <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-700">
                      {selectedStudent.studentInfo.formatted}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      학번: {selectedStudent.studentId}
                    </p>
                    <p className="text-sm text-gray-600">
                      현재 NFC ID: {selectedStudent.nfcId}
                    </p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-semibold mb-2">
                      새 NFC ID (10자리)
                    </label>
                    <input
                      type="text"
                      value={newNfcId}
                      onChange={(e) => setNewNfcId(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900 text-center text-lg font-mono"
                      placeholder="10자리 숫자 입력"
                      maxLength={10}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateStudent}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700"
                    >
                      변경
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudent(null);
                        setNewNfcId('');
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}
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

              <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">전체 기록</p>
                  <p className="text-2xl font-bold text-gray-700">{checkIns.length}건</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">신청자 입장</p>
                  <p className="text-2xl font-bold text-green-600">
                    {checkIns.filter(ci => ci.isApplicant && !ci.isDuplicate).length}명
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">미신청자 입장</p>
                  <p className="text-2xl font-bold text-red-600">
                    {checkIns.filter(ci => !ci.isApplicant).length}건
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">중복 입장</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {checkIns.filter(ci => ci.isDuplicate).length}건
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {checkIns.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">입장 기록이 없습니다</p>
                ) : (
                  checkIns.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      onClick={() => setSelectedCheckIn(checkIn)}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                        checkIn.isDuplicate
                          ? 'bg-orange-50 border-orange-200 hover:border-orange-400'
                          : checkIn.isApplicant
                          ? 'bg-green-50 border-green-200 hover:border-green-400'
                          : 'bg-red-50 border-red-200 hover:border-red-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-bold text-lg ${
                            checkIn.isDuplicate
                              ? 'text-orange-700'
                              : checkIn.isApplicant 
                              ? 'text-green-700' 
                              : 'text-red-700'
                          }`}>
                            {checkIn.studentInfo.formatted}
                            {checkIn.checkCount > 1 && (
                              <span className="ml-2 text-sm font-normal text-gray-500">
                                ({checkIn.checkCount}회차)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(checkIn.checkTime).toLocaleTimeString('ko-KR')}
                            {checkIn.photoPath && (
                              <span className="ml-2 text-xs text-blue-600">📷 사진 있음</span>
                            )}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-semibold ${
                          checkIn.isDuplicate
                            ? 'bg-orange-100 text-orange-700'
                            : checkIn.isApplicant
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {checkIn.isDuplicate 
                            ? '⚠️ 중복 입장' 
                            : checkIn.isApplicant 
                            ? '✓ 신청자' 
                            : '✗ 미신청자'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 신청자 태깅 현황 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📊 신청자 태깅 현황 ({applicants.length}명)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {applicants
                  .sort((a, b) => a.studentId.localeCompare(b.studentId))
                  .map((applicant) => {
                    const hasCheckedIn = checkIns.some(
                      ci => ci.studentId === applicant.studentId && ci.isApplicant && !ci.isDuplicate
                    );
                    const grade = applicant.studentId[0];
                    const classNum = applicant.studentId.substring(1, 3);
                    const number = applicant.studentId.substring(3, 5);
                    
                    return (
                      <div
                        key={applicant.studentId}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          hasCheckedIn
                            ? 'bg-green-50 border-green-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg ${
                              hasCheckedIn ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              {hasCheckedIn ? '✓' : '○'}
                            </span>
                            <div>
                              <p className={`font-bold text-sm ${
                                hasCheckedIn ? 'text-green-700' : 'text-gray-600'
                              }`}>
                                {grade}학년 {classNum}반
                              </p>
                              <p className={`text-xs ${
                                hasCheckedIn ? 'text-green-600' : 'text-gray-500'
                              }`}>
                                {number}번
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-600">입장 완료</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold">○</span>
                  <span className="text-gray-600">미입장</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 백업 관리 탭 */}
        {activeTab === 'backups' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">💾 데이터베이스 백업 관리</h2>
              <button
                onClick={handleCreateBackup}
                disabled={backupLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
              >
                {backupLoading ? '처리 중...' : '새 백업 생성'}
              </button>
            </div>

            {backupMessage && (
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold">{backupMessage}</p>
              </div>
            )}

            {backupError && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">{backupError}</p>
              </div>
            )}

            <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">⚠️ 백업 관리 안내</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 서버 시작 시 자동으로 백업이 생성됩니다</li>
                <li>• 백업 파일은 최대 30개까지 보관되며, 오래된 것부터 자동 삭제됩니다</li>
                <li>• 백업 복원 시 현재 데이터베이스는 자동으로 백업됩니다</li>
                <li>• 복원 후에는 페이지가 새로고침됩니다</li>
              </ul>
            </div>

            {backupLoading && backups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                백업 목록을 불러오는 중...
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                백업 파일이 없습니다
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map((backup) => (
                  <div
                    key={backup.filename}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{backup.filename}</p>
                        <div className="flex gap-4 mt-1 text-sm text-gray-600">
                          <span>📅 {new Date(backup.createdAt).toLocaleString('ko-KR')}</span>
                          <span>💾 {backup.sizeInMB} MB</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestoreBackup(backup.filename)}
                          disabled={backupLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 text-sm"
                        >
                          복원
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(backup.filename)}
                          disabled={backupLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-300 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 계정 설정 탭 */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ 관리자 계정 설정</h2>

            {settingsMessage && (
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold">{settingsMessage}</p>
              </div>
            )}

            {settingsError && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-700 font-semibold">{settingsError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 비밀번호 변경 */}
              <div className="p-6 border-2 border-gray-200 rounded-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🔒 비밀번호 변경</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      현재 비밀번호
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      새 비밀번호
                    </label>
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                      minLength={4}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      새 비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                      minLength={4}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                  >
                    비밀번호 변경
                  </button>
                </form>
              </div>

              {/* 사용자명 변경 */}
              <div className="p-6 border-2 border-gray-200 rounded-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">👤 사용자명 변경</h3>
                <form onSubmit={handleChangeUsername} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      현재 사용자명
                    </label>
                    <input
                      type="text"
                      value={username}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      disabled
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={currentUsername}
                      onChange={(e) => setCurrentUsername(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      새 사용자명
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                      minLength={3}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                  >
                    사용자명 변경
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    ⚠️ 사용자명 변경 후 자동으로 로그아웃됩니다
                  </p>
                </form>
              </div>
            </div>

            {/* 현재 계정 정보 */}
            <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-2">📋 현재 계정 정보</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <p><strong>사용자명:</strong> {username}</p>
                <p><strong>역할:</strong> 관리자</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 체크인 상세 모달 */}
      {selectedCheckIn && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedCheckIn(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-gray-800">📋 입장 기록 상세</h3>
              <button
                onClick={() => setSelectedCheckIn(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* 학생 정보 */}
            <div className={`p-4 rounded-lg mb-4 ${
              selectedCheckIn.isDuplicate
                ? 'bg-orange-50 border-2 border-orange-200'
                : selectedCheckIn.isApplicant
                ? 'bg-green-50 border-2 border-green-200'
                : 'bg-red-50 border-2 border-red-200'
            }`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">학생</p>
                  <p className="text-xl font-bold text-gray-800">
                    {selectedCheckIn.studentInfo.formatted}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">학번</p>
                  <p className="text-xl font-bold text-gray-800">
                    {selectedCheckIn.studentId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">입장 시간</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(selectedCheckIn.checkTime).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">상태</p>
                  <p className={`text-lg font-bold ${
                    selectedCheckIn.isDuplicate
                      ? 'text-orange-700'
                      : selectedCheckIn.isApplicant
                      ? 'text-green-700'
                      : 'text-red-700'
                  }`}>
                    {selectedCheckIn.isDuplicate 
                      ? '⚠️ 중복 입장' 
                      : selectedCheckIn.isApplicant 
                      ? '✓ 신청자' 
                      : '✗ 미신청자'}
                  </p>
                </div>
                {selectedCheckIn.checkCount > 1 && (
                  <div>
                    <p className="text-sm text-gray-600">입장 횟수</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedCheckIn.checkCount}회차
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 사진 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">📷 촬영 사진</p>
              {selectedCheckIn.photoPath ? (
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={`/api/camera/photo?path=${encodeURIComponent(selectedCheckIn.photoPath)}`}
                    alt="체크인 사진"
                    className="w-full h-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%236b7280" font-size="16"%3E사진을 불러올 수 없습니다%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
                  <p className="text-4xl mb-2">📷</p>
                  <p>촬영된 사진이 없습니다</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedCheckIn(null)}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
