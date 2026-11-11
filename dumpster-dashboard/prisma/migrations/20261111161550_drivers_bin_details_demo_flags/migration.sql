-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'DRIVER';

-- AlterTable
ALTER TABLE "app_user" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "failedLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "pinHash" TEXT,
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "bin" ADD COLUMN     "containerSize" TEXT,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "pickup_record" ADD COLUMN     "driverId" INTEGER,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "pickup_record_driverId_idx" ON "pickup_record"("driverId");

-- AddForeignKey
ALTER TABLE "pickup_record" ADD CONSTRAINT "pickup_record_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Flag the mock data that `npm run seed` created before this column existed,
-- so Settings > Data > "Delete demo data" can remove it without touching real
-- records. Seeded pickups always had bin IDs SIM-001..SIM-050; these four bin
-- codes are the seed's demo bins.
UPDATE "pickup_record" SET "isDemo" = true WHERE "binId" ~ '^SIM-[0-9]{3}$';
UPDATE "bin" SET "isDemo" = true WHERE "code" IN ('LIB-CP-LF-01', 'LIB-CP-RC-01', 'UNION-OR-01', 'ALP-LF-01');
