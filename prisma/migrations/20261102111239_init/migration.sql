-- CreateTable
CREATE TABLE "Assessment" (
    "id" UUID NOT NULL,
    "ssid" VARCHAR(32) NOT NULL,
    "securityProtocol" TEXT NOT NULL,
    "passwordProtection" TEXT NOT NULL,
    "wpsEnabled" TEXT NOT NULL,
    "firmwareStatus" TEXT NOT NULL,
    "notes" VARCHAR(250) NOT NULL DEFAULT '',
    "riskLevel" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assessment_createdAt_idx" ON "Assessment"("createdAt");

-- CreateIndex
CREATE INDEX "Assessment_riskLevel_idx" ON "Assessment"("riskLevel");
