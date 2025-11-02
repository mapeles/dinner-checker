# 운영 환경 마이그레이션 가이드

## 📋 개요
비밀번호 시스템을 제거하고 학번만으로 체크인할 수 있도록 시스템을 업그레이드합니다.
**기존 데이터는 모두 보존됩니다.**

## 🔒 마이그레이션 전 백업 (필수!)

### 1. 데이터베이스 백업
```bash
# 현재 DB 백업
cp prisma/dev.db prisma/dev.db.backup_$(date +%Y%m%d_%H%M%S)

# 또는 백업 스크립트 사용
npm run backup
```

### 2. 학생 데이터 확인
마이그레이션 전 학생 수를 기록해두세요:
```sql
SELECT COUNT(*) FROM Student;
SELECT COUNT(*) FROM Student WHERE password IS NOT NULL;
SELECT COUNT(*) FROM Student WHERE nfcId LIKE 'TEMP%';
```

## 🚀 마이그레이션 실행

### 개발 환경에서 테스트
```bash
# 1. 백업 확인
ls -l prisma/*.backup*

# 2. 마이그레이션 적용
npx prisma migrate deploy

# 3. 데이터 확인
npx prisma studio
# 또는
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Student;"
```

### 운영 환경 배포
```bash
# 1. 서비스 중단 (선택사항, 하지만 권장)
# systemctl stop dinner-checker
# 또는 PM2 사용 시: pm2 stop dinner-checker

# 2. 코드 업데이트
git pull origin main

# 3. 의존성 설치
npm install

# 4. Prisma 클라이언트 재생성
npx prisma generate

# 5. 마이그레이션 실행
npx prisma migrate deploy

# 6. 빌드
npm run build

# 7. 서비스 재시작
# systemctl start dinner-checker
# 또는: pm2 restart dinner-checker
```

## ✅ 마이그레이션 검증

### 1. 데이터 무결성 확인
```bash
# 학생 수가 동일한지 확인
sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Student;"

# password 컬럼이 NULL 허용하는지 확인
sqlite3 prisma/dev.db "PRAGMA table_info(Student);" | grep password
```

### 2. 기능 테스트
- [ ] 기존 NFC 카드로 체크인 가능
- [ ] 기존 학번으로 체크인 가능 (비밀번호 없이)
- [ ] 새로운 학번 입력 시 자동 등록
- [ ] 새로운 NFC 카드 등록 가능
- [ ] 히스토리에서 체크인 취소 가능

## 🔄 데이터 마이그레이션 상세

### 마이그레이션이 하는 일:

1. **새 테이블 생성** (password NULL 허용)
2. **기존 데이터 복사** (모든 학생 데이터 보존)
   - NFC ID 보존
   - 학번 보존
   - 비밀번호 보존 (기존 학생)
3. **테이블 교체**
4. **인덱스 재생성**

### 데이터 보존 보장:

- ✅ **NFC + 학번 + 비밀번호**: 그대로 유지 (비밀번호는 사용 안 함)
- ✅ **TEMP + 학번**: 그대로 유지
- ✅ **체크인 기록**: 모두 유지
- ✅ **급식 신청 기록**: 모두 유지

## 🛟 롤백 방법

마이그레이션 후 문제가 발생하면:

### 방법 1: 백업 복원
```bash
# 1. 서비스 중단
# pm2 stop dinner-checker

# 2. 백업 파일 복원
cp prisma/dev.db.backup_YYYYMMDD_HHMMSS prisma/dev.db

# 3. 이전 코드로 롤백
git checkout <이전_커밋_해시>

# 4. 의존성 재설치
npm install

# 5. 서비스 재시작
# pm2 start dinner-checker
```

### 방법 2: 수동 마이그레이션 롤백 (비추천)
```sql
-- password를 다시 NOT NULL로 되돌리기
-- (하지만 새로 생성된 학생들은 password가 NULL이므로 문제 발생 가능)
```

## 📊 예상 시나리오

### 시나리오 1: 기존 학생 (NFC + 학번 + 비밀번호)
- **마이그레이션 전**: NFC 태그 또는 학번+비밀번호로 체크인
- **마이그레이션 후**: NFC 태그 또는 학번만으로 체크인
- **결과**: ✅ 정상 작동 (비밀번호는 DB에 남아있지만 사용 안 함)

### 시나리오 2: 새로운 학생
- **마이그레이션 후**: 학번만 입력하면 자동 등록
- **결과**: ✅ 정상 작동

### 시나리오 3: 새로운 NFC 카드
- **마이그레이션 후**: NFC 태그 → 학번 입력 → 확인 모달 → 등록
- **결과**: ✅ 정상 작동

## 🔍 트러블슈팅

### 문제: "foreign key mismatch"
```bash
# CheckIn 테이블의 외래 키 확인
sqlite3 prisma/dev.db "PRAGMA foreign_key_check(CheckIn);"
```

### 문제: 마이그레이션 실패
```bash
# 1. 마이그레이션 상태 확인
npx prisma migrate status

# 2. 실패한 마이그레이션 해결
npx prisma migrate resolve --rolled-back 20251102_make_password_optional

# 3. 다시 시도
npx prisma migrate deploy
```

### 문제: 학생 수가 줄어듦
```bash
# 백업에서 복원
cp prisma/dev.db.backup_YYYYMMDD_HHMMSS prisma/dev.db

# 다시 시도하기 전에 개발 환경에서 테스트
```

## 📞 지원

문제 발생 시:
1. 즉시 서비스 중단
2. 백업 복원
3. 로그 확인 및 이슈 보고

## ⚠️ 주의사항

1. **반드시 백업**: 마이그레이션 전 DB 백업 필수
2. **점검 시간 활용**: 가능하면 학생들이 사용하지 않는 시간에 진행
3. **테스트 먼저**: 개발 환경 또는 복사본 DB에서 먼저 테스트
4. **데이터 검증**: 마이그레이션 후 반드시 데이터 개수 확인
5. **외래 키 무결성**: CheckIn 테이블의 studentId 참조 확인

## 🎯 예상 소요 시간

- 소규모 (학생 < 100명): 1-2분
- 중규모 (학생 100-1000명): 2-5분  
- 대규모 (학생 > 1000명): 5-10분

실제 마이그레이션은 매우 빠르지만(초 단위), 안전을 위한 검증 시간을 포함한 예상 시간입니다.
