'use client';

import Link from 'next/link';

export default function ChangePasswordPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            비밀번호 변경
          </h1>
        </div>

        {/* 안내 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center">
            <div className="text-6xl mb-4">ℹ️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              비밀번호가 제거되었습니다
            </h2>
            <p className="text-gray-600 mb-4">
              이제 학번만 입력하면 급식 체크를 할 수 있습니다.
            </p>
            <p className="text-gray-600 mb-6">
              비밀번호 기능은 더 이상 사용되지 않습니다.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <h3 className="font-bold text-blue-800 mb-2">변경 사항:</h3>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                <li>학번만 입력하면 바로 급식 체크</li>
                <li>미등록 학번도 자동으로 등록됨</li>
                <li>NFC 카드는 학번과 함께 등록 가능</li>
              </ul>
            </div>
          </div>
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
