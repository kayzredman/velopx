-- AlterTable: add optional GPS coordinate columns to Delivery
ALTER TABLE "Delivery"
  ADD COLUMN "driverLat" DOUBLE PRECISION,
  ADD COLUMN "driverLng" DOUBLE PRECISION,
  ADD COLUMN "destLat"   DOUBLE PRECISION,
  ADD COLUMN "destLng"   DOUBLE PRECISION;
