/*
  Warnings:

  - You are about to drop the column `findings` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `recommendations` on the `Assessment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "findings",
DROP COLUMN "recommendations";

-- CreateTable
CREATE TABLE "Finding" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Finding_assessmentId_idx" ON "Finding"("assessmentId");

-- CreateIndex
CREATE INDEX "Finding_severity_idx" ON "Finding"("severity");

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
