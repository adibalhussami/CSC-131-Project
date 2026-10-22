-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'ADMIN');

-- AlterTable
ALTER TABLE "app_user" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE';
