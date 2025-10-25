'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface CheckHistory {
  id: string;
  studentId: string;
  studentInfo: {
    grade: number;
    class: number;
    number: number;
    formatted: string;
  };
  isApplicant: boolean;
  isDuplicate?: boolean;
  timestamp: Date;
  checkTime: string;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [tempStudentId, setTempStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [history, setHistory] = useState<CheckHistory[]>([]);
  const [bgColor, setBgColor] = useState('from-blue-50 to-indigo-100'); // 배경색 상태

  const inputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // 오늘 날짜 가져오기
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // DB에서 오늘의 체크인 기록 가져오기
  const loadTodayCheckIns = async () => {
    try {
      const todayDate = getTodayDate();
      const response = await fetch(`/api/admin/checkins?date=${todayDate}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.checkIns) {
          // DB 데이터를 history 형식으로 변환 (최신순으로 역순 정렬)
          const formattedHistory: CheckHistory[] = data.checkIns.map((item: any) => ({
            id: item.id,
            studentId: item.studentId,
            studentInfo: item.studentInfo,
            isApplicant: item.isApplicant,
            isDuplicate: item.isDuplicate,
            timestamp: new Date(item.checkTime),
            checkTime: item.checkTime,
          })).reverse();
          setHistory(formattedHistory);
        }
      }
    } catch (err) {
      console.error('Failed to load check-in history:', err);
    }
  };

  // 컴포넌트 마운트 시 오늘의 체크인 기록 로드
  useEffect(() => {
    loadTodayCheckIns();
    
    // 30초마다 자동 새로고침
    const interval = setInterval(loadTodayCheckIns, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 효과음 재생 함수
  const playSound = (type: 'success' | 'error' | 'warning') => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
      // 신청자 - 딩동 (높은음 → 낮은음)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'error') {
      // 미신청자 - 삑삑 (낮은 짧은 반복음)
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'warning') {
      // 중복 - 경고음 (중간 음으로 길게)
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  // 항상 입력 필드에 포커스
  useEffect(() => {
    if (!showPasswordInput) {
      inputRef.current?.focus();
    } else {
      passwordRef.current?.focus();
    }
  }, [result, showPasswordInput]);

  // 페이지 클릭 시 포커스 유지
  useEffect(() => {
    const handleFocus = () => {
      if (!showPasswordInput) {
        inputRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
    };

    // 포커스가 벗어났을 때 다시 포커스
    const handleBlur = () => {
      setTimeout(handleFocus, 0);
    };

    // 전역 클릭 이벤트 - 어디를 클릭해도 입력창으로 포커스
    const handleClick = () => {
      handleFocus();
    };

    window.addEventListener('click', handleClick);
    
    // 주기적으로 포커스 확인 (더 강력한 포커스 유지)
    const interval = setInterval(handleFocus, 100);

    return () => {
      window.removeEventListener('click', handleClick);
      clearInterval(interval);
    };
  }, [showPasswordInput]);

  // 입력 처리
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const trimmedInput = input.trim();
      
      // 10자리 = NFC 카드
      if (trimmedInput.length === 10 && /^\d{10}$/.test(trimmedInput)) {
        await checkNfc(trimmedInput);
        setInput('');
      }
      // 5자리 = 학번 (등록 여부 확인 후 비밀번호 입력 또는 등록 페이지로 이동)
      else if (trimmedInput.length === 5 && /^\d{5}$/.test(trimmedInput)) {
        await checkStudentExists(trimmedInput);
        setInput('');
      }
      // 그 외
      else {
        setError('10자리 NFC 번호 또는 5자리 학번을 입력하세요.');
        setInput('');
      }
    }
  };

  // 학생 등록 여부 확인
  const checkStudentExists = async (studentId: string) => {
    try {
      const response = await fetch('/api/nfc/check-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (data.exists) {
        // 등록된 학생 - 비밀번호 입력 화면으로
        setTempStudentId(studentId);
        setShowPasswordInput(true);
      } else {
        // 미등록 학생 - 등록 페이지로 이동 (NFC ID 없이)
        window.location.href = `/register?studentId=${studentId}`;
      }
    } catch (err) {
      setError('확인 중 오류가 발생했습니다.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // 비밀번호 입력 처리
  const handlePasswordKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (password.length === 4 && /^\d{4}$/.test(password)) {
        await checkManual(tempStudentId, password);
        setPassword('');
        setShowPasswordInput(false);
        setTempStudentId('');
      } else {
        setError('4자리 비밀번호를 입력하세요.');
        setPassword('');
      }
    } else if (e.key === 'Escape') {
      // ESC로 취소
      setShowPasswordInput(false);
      setPassword('');
      setTempStudentId('');
      setError('');
    }
  };

  // NFC 확인
  const checkNfc = async (nfcId: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/nfc/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcId }),
      });

      const data = await response.json();

      if (data.needsRegistration) {
        // 등록되지 않은 카드 -> 등록 페이지로 이동
        window.location.href = `/register?nfcId=${nfcId}`;
        return;
      }

      if (!response.ok) {
        setError(data.error || '확인 중 오류가 발생했습니다.');
        setBgColor('from-red-100 to-red-200');
        playSound('error');
        setTimeout(() => {
          setError('');
          setBgColor('from-blue-50 to-indigo-100');
        }, 3000);
      } else {
        setResult(data);
        
        // 배경색과 소리 설정
        if (data.isApplicant) {
          if (data.alreadyCheckedIn) {
            // 신청자 중복 체크인
            setBgColor('from-orange-100 to-orange-200');
            playSound('warning');
          } else {
            // 신청자 첫 체크인
            setBgColor('from-green-100 to-green-200');
            playSound('success');
          }
        } else {
          // 미신청자 (중복이든 아니든 빨간색)
          setBgColor('from-red-100 to-red-200');
          playSound('error');
        }
        
        // DB에서 히스토리 다시 로드
        await loadTodayCheckIns();
        
        // 배경색만 3초 후 초기화 (결과는 유지)
        setTimeout(() => {
          setBgColor('from-blue-50 to-indigo-100');
        }, 3000);
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.');
      setBgColor('from-red-100 to-red-200');
      playSound('error');
      setTimeout(() => {
        setError('');
        setBgColor('from-blue-50 to-indigo-100');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // 수동 입력 확인
  const checkManual = async (studentId: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/nfc/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '확인 중 오류가 발생했습니다.');
        setResult({ error: data.error || '확인 중 오류가 발생했습니다.' }); // 오른쪽 결과창에도 오류 표시
        setBgColor('from-red-100 to-red-200');
        playSound('error');
        setTimeout(() => {
          setError('');
          setResult(null); // 오류 결과도 초기화
          setBgColor('from-blue-50 to-indigo-100');
        }, 3000);
      } else {
        setResult(data);
        
        // 배경색과 소리 설정
        if (data.isApplicant) {
          if (data.alreadyCheckedIn) {
            // 신청자 중복 체크인
            setBgColor('from-orange-100 to-orange-200');
            playSound('warning');
          } else {
            // 신청자 첫 체크인
            setBgColor('from-green-100 to-green-200');
            playSound('success');
          }
        } else {
          // 미신청자 (중복이든 아니든 빨간색)
          setBgColor('from-red-100 to-red-200');
          playSound('error');
        }
        
        // DB에서 히스토리 다시 로드
        await loadTodayCheckIns();
        
        // 배경색만 3초 후 초기화 (결과는 유지)
        setTimeout(() => {
          setBgColor('from-blue-50 to-indigo-100');
        }, 3000);
      }
    } catch (err) {
      setError('서버 연결 오류가 발생했습니다.');
      setResult({ error: '서버 연결 오류가 발생했습니다.' }); // 오른쪽 결과창에도 오류 표시
      setBgColor('from-red-100 to-red-200');
      playSound('error');
      setTimeout(() => {
        setError('');
        setResult(null); // 오류 결과도 초기화
        setBgColor('from-blue-50 to-indigo-100');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-linear-to-br ${bgColor} transition-colors duration-500 p-4`}>
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center m-6">
          <h1 className="text-5xl font-bold text-gray-800 mb-10">
            급식 신청 체크인 시스템
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 왼쪽: 입력 영역 */}
          <div>
            {/* 메인 입력 카드 */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              {!showPasswordInput ? (
                // 통합 입력 모드
                <div className="text-center">
                  <div className="mb-6">
                    <div className="text-6xl mb-4">💳</div>
                    <h2 className="text-4xl font-bold text-gray-800 mb-2">
                      학번 입력
                    </h2>
                    <p className="text-gray-500 text-2xl">
                      학번을 입력하고 Enter를 누르세요
                    </p>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={input}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setInput(value);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-center text-8xl font-mono tracking-widest focus:outline-none focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                    placeholder="00000"
                    maxLength={10}
                    autoFocus
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    {input.length > 0 && (
                      input.length === 10 
                        ? '✓ NFC 카드 번호' 
                        : input.length === 5 
                        ? '✓ 학번 (Enter 후 비밀번호 입력)' 
                        : `${input.length}자리`
                    )}
                  </p>
                </div>
              ) : (
                // 비밀번호 입력 모드
                <div className="text-center">
                  <div className="mb-6">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-4xl font-bold text-gray-800 mb-2">
                      학번: {tempStudentId}
                    </h2>
                    <p className="text-gray-500 text-2xl">
                      비밀번호 4자리를 입력하세요
                    </p>
                  </div>
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
                    onKeyDown={handlePasswordKeyDown}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-center text-8xl font-mono tracking-widest focus:outline-none focus:border-blue-500 placeholder:text-gray-500 text-gray-900"
                    placeholder="••••"
                    maxLength={4}
                    autoFocus
                    disabled={loading}
                  />
                  <p className="mt-2 text-sm text-gray-400">
                    {password.length}/4 자리
                  </p>
                  <button
                    onClick={() => {
                      setShowPasswordInput(false);
                      setPassword('');
                      setTempStudentId('');
                      setError('');
                    }}
                    className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                  >
                    취소 (ESC)
                  </button>
                </div>
              )}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-600 font-semibold text-center">{error}</p>
              </div>
            )}

            {/* 하단 링크 */}
            <div className="flex justify-center gap-4 text-sm">
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                학번 등록하기
              </Link>
              <span className="text-gray-400">|</span>
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                관리자 페이지
              </Link>
            </div>
          </div>

          {/* 오른쪽: 결과 및 히스토리 */}
          <div className="space-y-6">
            {/* 현재 결과 표시 */}
            <div className="bg-white rounded-2xl shadow-xl p-15 min-h-[250px] flex items-center justify-center">
              {result ? (
                result.error ? (
                  // 오류 표시
                  <div className="text-center w-full text-red-600">
                    <div className="text-8xl mb-4 animate-bounce">
                      ✗
                    </div>
                    <h2 className="text-3xl font-bold mb-2">
                      오류
                    </h2>
                    <p className="text-xl font-semibold">
                      {result.error}
                    </p>
                  </div>
                ) : (
                  // 정상 결과 표시
                  <div
                    className={`text-center w-full ${
                      result.isApplicant
                        ? result.alreadyCheckedIn
                          ? 'text-orange-600'
                          : 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    <div className="text-8xl mb-4 animate-bounce">
                      {result.isApplicant
                        ? result.alreadyCheckedIn
                          ? '⚠️'
                          : '✓'
                        : '✗'}
                    </div>
                    <h2 className="text-6xl font-bold mb-2">
                      {result.studentInfo.formatted}
                    </h2>
                    {result.isApplicant && result.alreadyCheckedIn ? (
                      <>
                        <p className="text-4xl font-semibold mb-2">
                          이미 입장했습니다
                        </p>
                        <p className="text-lg opacity-70">
                          입장 시각: {new Date(result.checkInTime).toLocaleTimeString('ko-KR')}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-semibold">
                          {result.isApplicant ? '급식 신청자' : '급식 미신청자'}
                        </p>
                      </>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-lg">카드를 태깅하세요</p>
                </div>
              )}
            </div>

            {/* 히스토리 */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                <span>📋 확인 내역</span>
                <span className="text-sm font-normal text-gray-500">
                  최근 {history.length}건
                </span>
              </h3>
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    아직 확인 내역이 없습니다
                  </p>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border-2 ${
                        item.isDuplicate
                          ? 'bg-orange-50 border-orange-200'
                          : item.isApplicant
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`text-2xl ${
                            item.isDuplicate
                              ? 'text-orange-600'
                              : item.isApplicant 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {item.isDuplicate ? '⚠️' : item.isApplicant ? '✓' : '✗'}
                          </div>
                          <div>
                            <p className={`font-bold ${
                              item.isDuplicate
                                ? 'text-orange-700'
                                : item.isApplicant 
                                ? 'text-green-700' 
                                : 'text-red-700'
                            }`}>
                              {item.studentInfo.formatted}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.timestamp).toLocaleTimeString('ko-KR')}
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.isDuplicate
                            ? 'bg-orange-100 text-orange-700'
                            : item.isApplicant
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.isDuplicate ? '중복' : item.isApplicant ? '신청' : '미신청'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

