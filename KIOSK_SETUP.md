# 급식 체크 시스템 - 키오스크 모드 설치 가이드

## 📋 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [프로젝트 설치](#프로젝트-설치)
3. [프로덕션 빌드](#프로덕션-빌드)
4. [자동 실행 스크립트 생성](#자동-실행-스크립트-생성)
5. [바로가기 만들기](#바로가기-만들기)
6. [윈도우 시작 시 자동 실행](#윈도우-시작-시-자동-실행)
7. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 필수 설치 프로그램
- **Node.js** (v18 이상): [nodejs.org](https://nodejs.org) 다운로드
- **Google Chrome**: [google.com/chrome](https://www.google.com/chrome) 다운로드
- **Git** (선택사항): [git-scm.com](https://git-scm.com) 다운로드

### 권장 사양
- Windows 10/11
- RAM 4GB 이상
- 디스크 공간 500MB 이상

---

## 프로젝트 설치

### 1. 프로젝트 다운로드

#### 방법 A: Git 사용
```bash
# 터미널(명령 프롬프트) 열기
cd C:\
git clone [프로젝트 URL] dinner-checker
cd dinner-checker
```

#### 방법 B: 파일 복사
1. 프로젝트 폴더를 `C:\dinner-checker`에 복사
2. 명령 프롬프트 열기 (`Win + R` → `cmd`)
3. 프로젝트 폴더로 이동:
   ```bash
   cd C:\dinner-checker
   ```

### 2. 패키지 설치
```bash
npm install
```

### 3. 데이터베이스 초기화
```bash
# Prisma 클라이언트 생성
npx prisma generate

# 데이터베이스 스키마 적용
npx prisma db push

# 관리자 계정 생성
npx tsx scripts/update-admin.ts
```

**기본 관리자 계정:**
- 아이디: `shindo`
- 비밀번호: `shindo1234`

---

## 프로덕션 빌드

### 1. Next.js 프로덕션 빌드
```bash
npm run build
```

이 과정은 5-10분 정도 소요됩니다.

### 2. 빌드 확인
빌드가 완료되면 다음과 같은 메시지가 나타납니다:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

---

## 자동 실행 스크립트 생성

### 1. 시작 스크립트 만들기

`C:\dinner-checker\start-kiosk.bat` 파일을 생성하고 다음 내용을 입력하세요:

```batch
@echo off
chcp 65001 >nul
title 급식 체크 시스템

echo.
echo ╔═══════════════════════════════════════╗
echo ║     급식 체크 시스템 시작 중...      ║
echo ╚═══════════════════════════════════════╝
echo.

REM 프로젝트 디렉토리로 이동
cd /d C:\dinner-checker

REM 기존 Node.js 프로세스 종료
echo [1/4] 기존 프로세스 정리 중...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Next.js 프로덕션 서버 시작
echo [2/4] 서버 시작 중...
start /B npm run start

REM 서버가 완전히 시작될 때까지 대기
echo [3/4] 서버 준비 중... (15초 대기)
timeout /t 15 /nobreak

REM 크롬 키오스크 모드로 열기
echo [4/4] 브라우저 열기...
start chrome --kiosk ^
  --disable-pinch ^
  --overscroll-history-navigation=0 ^
  --disable-features=TranslateUI ^
  --noerrdialogs ^
  --disable-infobars ^
  --disable-session-crashed-bubble ^
  --disable-restore-session-state ^
  --app=http://localhost:3000

echo.
echo ╔═══════════════════════════════════════╗
echo ║   급식 체크 시스템 실행 완료! ✓      ║
echo ╚═══════════════════════════════════════╝
echo.
echo 📌 사용 안내:
echo    • ESC 키: 전체화면 종료
echo    • Alt + F4: 브라우저 종료
echo    • Ctrl + C: 서버 종료 (이 창에서)
echo.
echo ⚠️  이 창을 닫으면 서버가 종료됩니다!
echo.

REM 서버 로그를 실시간으로 표시 (선택사항)
REM npm run start
```

### 2. 종료 스크립트 만들기 (선택사항)

`C:\dinner-checker\stop-kiosk.bat` 파일을 생성:

```batch
@echo off
chcp 65001 >nul
title 급식 체크 시스템 종료

echo.
echo ╔═══════════════════════════════════════╗
echo ║     급식 체크 시스템 종료 중...      ║
echo ╚═══════════════════════════════════════╝
echo.

REM Node.js 프로세스 종료
echo [1/2] 서버 종료 중...
taskkill /F /IM node.exe

REM 크롬 브라우저 종료
echo [2/2] 브라우저 종료 중...
taskkill /F /IM chrome.exe

echo.
echo ╔═══════════════════════════════════════╗
echo ║      시스템 종료 완료! ✓             ║
echo ╚═══════════════════════════════════════╝
echo.

timeout /t 3
```

---

## 바로가기 만들기

### 1. 바탕화면 바로가기 생성

1. **바탕화면에서 우클릭** → `새로 만들기` → `바로 가기`

2. **항목 위치 입력:**
   ```
   C:\dinner-checker\start-kiosk.bat
   ```

3. **바로 가기 이름 입력:**
   ```
   급식 체크 시스템
   ```

4. **완료** 클릭

### 2. 바로가기 아이콘 및 속성 변경 (선택사항)

1. 생성된 바로가기를 **우클릭** → `속성`

2. **바로 가기 탭**:
   - **실행**: `최소화` 선택 (서버 로그 창 숨김)
   - **고급** → `관리자 권한으로 실행` 체크 (선택사항)

3. **아이콘 변경** (선택사항):
   - `아이콘 변경` 버튼 클릭
   - 원하는 아이콘 선택 또는 사용자 지정 아이콘 사용

4. **적용** → **확인**

---

## 윈도우 시작 시 자동 실행

### 방법 A: 시작 프로그램 폴더 (간단)

1. **시작 프로그램 폴더 열기:**
   - `Win + R` → `shell:startup` 입력 → `확인`

2. 위에서 만든 **바로가기 복사**하여 이 폴더에 붙여넣기

3. 완료! 다음 부팅부터 자동 실행됩니다.

### 방법 B: 작업 스케줄러 (고급)

1. **작업 스케줄러 열기:**
   - `Win + R` → `taskschd.msc` 입력 → `확인`

2. **기본 작업 만들기** 클릭

3. **작업 생성 마법사:**
   - **이름**: `급식 체크 시스템 자동 실행`
   - **설명**: `윈도우 시작 시 급식 체크 시스템을 자동으로 실행합니다`
   - **다음**

4. **트리거:**
   - `로그온할 때` 선택
   - **다음**

5. **작업:**
   - `프로그램 시작` 선택
   - **다음**

6. **프로그램/스크립트:**
   - **찾아보기** 클릭
   - `C:\dinner-checker\start-kiosk.bat` 선택
   - **다음**

7. **완료** 클릭

8. **추가 설정 (권장):**
   - 생성된 작업을 더블클릭
   - **조건** 탭:
     - ☑ `컴퓨터의 전원을 AC 전원에 연결한 경우에만 작업 시작` 체크 해제
   - **설정** 탭:
     - ☑ `작업이 실패하면 다시 시작 간격: 1분` 체크
   - **확인**

---

## 문제 해결

### 1. 서버가 시작되지 않음

**증상:** 브라우저가 열리지만 "연결할 수 없습니다" 오류

**해결방법:**
```bash
# 포트 3000 사용 중인 프로세스 확인
netstat -ano | findstr :3000

# 해당 프로세스 종료 (PID는 위 명령어 결과의 마지막 숫자)
taskkill /F /PID [프로세스ID]

# 서버 재시작
cd C:\dinner-checker
npm run start
```

### 2. 빌드 오류

**증상:** `npm run build` 실패

**해결방법:**
```bash
# node_modules 삭제 후 재설치
rmdir /s /q node_modules
rmdir /s /q .next
npm install
npm run build
```

### 3. 데이터베이스 오류

**증상:** "Can't reach database server" 오류

**해결방법:**
```bash
# 데이터베이스 재생성
del prisma\dev.db
npx prisma db push
npx tsx scripts\update-admin.ts
```

### 4. 크롬 키오스크 모드 종료하기

- **ESC 키**: 전체화면 해제
- **F11 키**: 전체화면 토글
- **Alt + F4**: 브라우저 완전 종료
- **Ctrl + Shift + Q**: 크롬 강제 종료

### 5. 포트 변경 (3000번 포트 충돌 시)

`package.json` 파일 수정:
```json
{
  "scripts": {
    "start": "next start -p 3001"
  }
}
```

그리고 `start-kiosk.bat`의 URL도 변경:
```batch
--app=http://localhost:3001
```

### 6. 서버 로그 확인

실시간 로그 보기:
```bash
cd C:\dinner-checker
npm run start
```

로그 파일로 저장:
```batch
npm run start > server.log 2>&1
```

---

## 고급 설정

### 1. 자동 재시작 스크립트

서버 다운 시 자동 재시작하는 `watchdog.bat`:

```batch
@echo off
:loop
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo 서버가 중지되었습니다. 재시작 중...
    cd C:\dinner-checker
    start /B npm run start
)
timeout /t 30
goto loop
```

### 2. 백그라운드 서비스로 실행 (NSSM 사용)

1. **NSSM 다운로드**: [nssm.cc](https://nssm.cc/download)

2. **서비스 설치:**
   ```bash
   nssm install DinnerChecker "C:\Program Files\nodejs\npm.cmd" "run" "start"
   nssm set DinnerChecker AppDirectory C:\dinner-checker
   nssm start DinnerChecker
   ```

3. **서비스 제거:**
   ```bash
   nssm stop DinnerChecker
   nssm remove DinnerChecker confirm
   ```

### 3. 원격 접속 허용

같은 네트워크의 다른 기기에서 접속하려면:

1. **방화벽 허용:**
   - Windows Defender 방화벽 → 인바운드 규칙 추가
   - 포트 3000 TCP 허용

2. **IP 주소 확인:**
   ```bash
   ipconfig
   ```

3. **다른 기기에서 접속:**
   ```
   http://[서버컴퓨터IP]:3000
   ```

---

## 운영 체크리스트

### 일일 체크
- [ ] 시스템이 정상적으로 실행되는가?
- [ ] 체크인 기록이 정상적으로 저장되는가?
- [ ] 신청자 명단이 최신인가?

### 주간 체크
- [ ] 데이터베이스 백업
- [ ] 로그 파일 확인 및 정리
- [ ] Windows 업데이트 확인

### 월간 체크
- [ ] 신청자 명단 갱신
- [ ] 이전 달 데이터 아카이브
- [ ] 시스템 성능 확인

---

## 데이터 백업

### 자동 백업 스크립트 (선택사항)

`backup.bat` 생성:

```batch
@echo off
set BACKUP_DIR=C:\dinner-checker\backups
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

mkdir %BACKUP_DIR% 2>nul
mkdir %BACKUP_DIR%\%TIMESTAMP% 2>nul

echo 백업 중...
copy C:\dinner-checker\prisma\dev.db %BACKUP_DIR%\%TIMESTAMP%\dev.db
echo 백업 완료: %BACKUP_DIR%\%TIMESTAMP%

REM 30일 이상 된 백업 삭제
forfiles /p %BACKUP_DIR% /d -30 /c "cmd /c rd /s /q @path" 2>nul
```

---

## 유용한 단축키

### 키오스크 모드에서
- `ESC`: 전체화면 해제
- `F11`: 전체화면 토글
- `F5`: 페이지 새로고침
- `Ctrl + Shift + R`: 캐시 무시하고 새로고침
- `F12`: 개발자 도구 열기 (문제 해결용)

### 관리자 페이지
- URL: `http://localhost:3000/admin`
- 로그인: `shindo` / `shindo1234`

---

## 지원 및 문의

문제가 발생하면 다음을 확인하세요:
1. 서버 로그 확인
2. 브라우저 개발자 도구 (F12) → Console 탭
3. Windows 이벤트 뷰어

---

## 라이선스

이 시스템은 내부 사용을 위해 제작되었습니다.

---

**마지막 업데이트:** 2025년 10월 25일
