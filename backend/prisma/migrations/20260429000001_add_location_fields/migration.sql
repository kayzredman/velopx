-- User profile location (default delivery destination for garages/buyers)
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "lat"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lng"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "address" TEXT;

-- Per-order delivery location override
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "deliveryLat"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deliveryLng"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "deliveryAddress" TEXT;

-- Delivery route endpoints (dealer pickup + garage destination)
ALTER TABLE "Delivery"
  ADD COLUMN IF NOT EXISTS "destAddress"   TEXT,
  ADD COLUMN IF NOT EXISTS "sourceLat"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "sourceLng"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "sourceAddress" TEXT;
