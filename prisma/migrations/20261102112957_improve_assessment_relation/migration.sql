/*
  Warnings:

  - You are about to drop the column `recommendation` on the `Finding` table. All the data in the column will be lost.
  - Added the required column `recommendations` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "recommendations" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Finding" DROP COLUMN "recommendation";
