# 급식 신청 여부 판독기 (Dinner Checker)

Next.js 풀스택 기반 NFC 카드 태깅 시스템으로 학교 급식 신청 여부를 확인하는 애플리케이션입니다.

## 🎯 주요 기능

### 1. NFC 카드 태깅
- NFC 리더기로 카드를 태깅하면 자동으로 학번 확인
- 10자리 NFC 고유번호 + Enter 입력 방식
- 실시간 급식 신청 여부 확인 (O/X 표시)

### 2. 수동 입력
- 카드를 깜빡한 학생을 위한 비밀번호 로그인
- 학번(5자리) + 비밀번호(4자리) 입력

### 3. 카드 등록
- 최초 태깅 시 학번과 비밀번호 등록
- NFC ID와 학번 연결

### 4. 관리자 페이지
- 엑셀 파일로 월별 급식 신청자 명단 업로드
- 신청자 통계 및 목록 조회
- 월별 관리 기능

## 🏫 학번 체계

우리 학교는 5자리 학번을 사용합니다:
- **학년(1자리) + 반(2자리) + 번호(2자리)**
- 예시:
  - `20701` → 2학년 7반 1번
  - `31024` → 3학년 10반 24번

## 🚀 시작하기

### 필수 요구사항
- Node.js 18 이상
- NFC 리더기 (키보드 입력 방식)

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 데이터베이스 초기화
npx prisma generate
npx prisma db push

# 관리자 계정 생성
npx tsx scripts/init-db.ts

# 개발 서버 실행
npm run dev
```

서버 실행 후 [http://localhost:3000](http://localhost:3000) 접속

### 기본 관리자 계정
- **사용자명**: `admin`
- **비밀번호**: `admin1234`

## 📁 프로젝트 구조

```
dinner-checker/
├── app/
│   ├── page.tsx              # 메인 태깅 페이지
│   ├── register/
│   │   └── page.tsx          # 카드 등록 페이지
│   ├── admin/
│   │   └── page.tsx          # 관리자 페이지
│   └── api/
│       ├── nfc/
│       │   ├── register/     # NFC 등록 API
│       │   └── check/        # NFC 확인 API
│       └── admin/
│           ├── auth/         # 관리자 인증 API
│           └── upload/       # 엑셀 업로드 API
├── lib/
│   ├── db.ts                 # Prisma 클라이언트
│   └── utils.ts              # 유틸리티 함수
├── prisma/
│   └── schema.prisma         # 데이터베이스 스키마
└── scripts/
    └── init-db.ts            # 초기 설정 스크립트
```

## 💾 데이터베이스 스키마

### Student (학생 정보)
- `nfcId`: NFC 카드 고유번호 (10자리)
- `studentId`: 학번 (5자리)
- `password`: 비밀번호 (4자리, 해시화)

### Applicant (급식 신청자)
- `studentId`: 학번
- `month`: 대상 월 (YYYY-MM 형식)

### Admin (관리자)
- `username`: 관리자 사용자명
- `password`: 관리자 비밀번호 (해시화)

## 📊 엑셀 파일 형식

급식 신청자 명단 엑셀 파일은 다음 형식을 따라야 합니다:

| 학번  |
|-------|
| 20701 |
| 20702 |
| 31024 |
| ...   |

- 첫 번째 컬럼에 학번이 있어야 함
- 컬럼명은 '학번', 'studentId', 'student_id' 중 하나
- 또는 첫 번째 컬럼을 자동으로 인식

## 🔧 사용 방법

### 1. 학생 카드 등록
1. 메인 페이지에서 카드 태깅
2. 미등록 카드는 자동으로 등록 페이지로 이동
3. 학번과 4자리 비밀번호 입력
4. 등록 완료

### 2. 급식 신청 확인
1. 메인 페이지에서 카드 태깅
2. 자동으로 신청 여부 확인
3. 녹색(O) 또는 빨간색(X) 표시
4. 3초 후 자동 초기화

### 3. 관리자 작업
1. `/admin` 페이지 접속
2. 관리자 계정으로 로그인
3. 엑셀 파일 업로드
4. 대상 월 선택 후 업로드
5. 신청자 목록 확인

## 🛠️ 기술 스택

- **Frontend**: Next.js 16, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (Prisma ORM)
- **Authentication**: bcryptjs (비밀번호 해싱)
- **File Processing**: xlsx (엑셀 파일 처리)

## 🔐 보안

- 모든 비밀번호는 bcrypt로 해싱되어 저장
- 학생 비밀번호: 4자리 숫자
- 관리자 비밀번호: 8자리 이상 권장
- SQLite 데이터베이스는 로컬에 저장

## 📝 환경 변수

`.env` 파일:

```env
DATABASE_URL="file:./dev.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin1234"
```

## 🎨 화면 구성

### 메인 페이지 (/)
- NFC 태깅 모드 / 수동 입력 모드 전환
- 실시간 신청 여부 확인
- 대형 O/X 표시

### 등록 페이지 (/register)
- NFC ID 자동 입력
- 학번 입력 (5자리)
- 비밀번호 설정 (4자리)

### 관리자 페이지 (/admin)
- 엑셀 업로드
- 신청자 통계
- 월별 신청자 목록

## 🐛 문제 해결

### NFC 리더기가 작동하지 않는 경우
- 리더기가 키보드 입력 모드인지 확인
- 10자리 숫자 + Enter가 입력되는지 확인

### 엑셀 업로드 실패
- 파일 형식이 .xlsx 또는 .xls인지 확인
- 학번 컬럼이 올바른지 확인
- 학번이 5자리 숫자인지 확인

## 📄 라이선스

MIT License

## 👥 제작

학교 급식 신청 관리 시스템

