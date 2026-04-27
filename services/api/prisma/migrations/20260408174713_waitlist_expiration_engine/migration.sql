-- AlterTable
ALTER TABLE "WaitlistEntry" ADD COLUMN     "promotedReservationId" TEXT,
ADD COLUMN     "promotionExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WaitlistEntry_promotionExpiresAt_idx" ON "WaitlistEntry"("promotionExpiresAt");

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_promotedReservationId_fkey" FOREIGN KEY ("promotedReservationId") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
