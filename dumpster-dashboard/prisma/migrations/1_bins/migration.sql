-- CreateTable
CREATE TABLE "bin" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "wasteStream" "WasteStream" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bin_code_key" ON "bin"("code");

