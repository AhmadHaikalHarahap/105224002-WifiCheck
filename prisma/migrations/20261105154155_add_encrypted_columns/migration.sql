-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "firmwareStatus_enc" JSONB,
ADD COLUMN     "notes_enc" JSONB,
ADD COLUMN     "passwordProtection_enc" JSONB,
ADD COLUMN     "recommendations_enc" JSONB,
ADD COLUMN     "securityProtocol_enc" JSONB,
ADD COLUMN     "ssid_enc" JSONB,
ADD COLUMN     "summary_enc" JSONB,
ADD COLUMN     "wpsEnabled_enc" JSONB;

-- AlterTable
ALTER TABLE "Finding" ADD COLUMN     "description_enc" JSONB,
ADD COLUMN     "title_enc" JSONB;
