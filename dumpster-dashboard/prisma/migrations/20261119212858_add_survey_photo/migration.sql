-- CreateTable
CREATE TABLE "pickup_photo" (
    "id" SERIAL NOT NULL,
    "recordId" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pickup_photo_recordId_key" ON "pickup_photo"("recordId");

-- AddForeignKey
ALTER TABLE "pickup_photo" ADD CONSTRAINT "pickup_photo_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "pickup_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
