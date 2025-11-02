-- 초기 스키마 생성 (기존 운영 DB가 있다면 이미 존재할 것임)
-- CreateTable (IF NOT EXISTS로 안전하게)
CREATE TABLE IF NOT EXISTS "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nfcId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "password" TEXT NOT NULL,  -- 기존에는 필수였음
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Applicant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "isApplicant" BOOLEAN NOT NULL,
    "checkTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoPath" TEXT,
    CONSTRAINT "CheckIn_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("studentId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex (이미 존재하면 에러 무시)
CREATE UNIQUE INDEX IF NOT EXISTS "Student_nfcId_key" ON "Student"("nfcId");
CREATE UNIQUE INDEX IF NOT EXISTS "Student_studentId_key" ON "Student"("studentId");
CREATE INDEX IF NOT EXISTS "Applicant_month_idx" ON "Applicant"("month");
CREATE UNIQUE INDEX IF NOT EXISTS "Applicant_studentId_month_key" ON "Applicant"("studentId", "month");
CREATE INDEX IF NOT EXISTS "CheckIn_date_idx" ON "CheckIn"("date");
CREATE INDEX IF NOT EXISTS "CheckIn_studentId_date_idx" ON "CheckIn"("studentId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_username_key" ON "Admin"("username");
