-- Order ↔ JobCard link (JobCard table may be added separately)
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "jobCardId" TEXT;

-- Delivery proof / exception notes
ALTER TABLE "Delivery"
  ADD COLUMN IF NOT EXISTS "note" TEXT;
