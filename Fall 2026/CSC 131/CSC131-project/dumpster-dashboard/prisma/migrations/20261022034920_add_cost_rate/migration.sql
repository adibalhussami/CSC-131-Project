-- CreateTable
CREATE TABLE "cost_rate" (
    "wasteStream" "WasteStream" NOT NULL,
    "usdPerPickup" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "cost_rate_pkey" PRIMARY KEY ("wasteStream")
);
