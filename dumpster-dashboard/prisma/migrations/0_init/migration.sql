-- CreateEnum
CREATE TYPE "WasteStream" AS ENUM ('LANDFILL', 'RECYCLING', 'ORGANICS');

-- CreateEnum
CREATE TYPE "ContaminationLevel" AS ENUM ('NONE', 'A_LITTLE', 'A_LOT');

-- CreateTable
CREATE TABLE "app_user" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_record" (
    "id" SERIAL NOT NULL,
    "collectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "building" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "binId" TEXT,
    "driverName" TEXT NOT NULL,
    "wasteStream" "WasteStream" NOT NULL,
    "fullnessPercent" INTEGER NOT NULL,
    "contamination" "ContaminationLevel" NOT NULL,
    "overflow" BOOLEAN NOT NULL DEFAULT false,
    "comments" VARCHAR(1000),

    CONSTRAINT "pickup_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_username_key" ON "app_user"("username");

-- CreateIndex
CREATE INDEX "pickup_record_collectionDate_idx" ON "pickup_record"("collectionDate");

