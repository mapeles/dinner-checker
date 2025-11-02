-- 비밀번호를 optional로 변경하는 안전한 마이그레이션
-- SQLite에서는 ALTER COLUMN을 직접 지원하지 않으므로 다음과 같이 진행:

-- 1. 임시 테이블 생성 (password가 nullable)
CREATE TABLE "Student_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nfcId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "password" TEXT,  -- NULL 허용으로 변경
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- 2. 기존 데이터를 새 테이블로 복사 (모든 데이터 보존)
INSERT INTO "Student_new" ("id", "nfcId", "studentId", "password", "createdAt", "updatedAt")
SELECT "id", "nfcId", "studentId", "password", "createdAt", "updatedAt" FROM "Student";

-- 3. 기존 테이블 삭제
DROP TABLE "Student";

-- 4. 새 테이블을 원래 이름으로 변경
ALTER TABLE "Student_new" RENAME TO "Student";

-- 5. 인덱스 재생성
CREATE UNIQUE INDEX "Student_nfcId_key" ON "Student"("nfcId");
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- 6. TEMP로 시작하는 nfcId를 가진 학생들의 password를 NULL로 설정 (선택사항)
-- UPDATE "Student" SET "password" = NULL WHERE "nfcId" LIKE 'TEMP%';
