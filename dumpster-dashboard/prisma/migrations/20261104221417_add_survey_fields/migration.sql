-- AlterTable
ALTER TABLE "pickup_record" ADD COLUMN     "containerSize" TEXT,
ADD COLUMN     "maintenanceIssue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maintenanceNotes" VARCHAR(200),
ADD COLUMN     "serviceCompleted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "serviceNotCompletedReason" VARCHAR(200);
