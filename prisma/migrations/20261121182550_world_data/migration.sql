-- AlterTable
ALTER TABLE "Airport" ADD COLUMN     "country" TEXT,
ADD COLUMN     "iata" TEXT,
ADD COLUMN     "ident" TEXT,
ADD COLUMN     "municipality" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'airport',
ALTER COLUMN "icao" DROP NOT NULL;

-- AlterTable
ALTER TABLE "NavStation" ADD COLUMN     "country" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Airport_ident_key" ON "Airport"("ident");

-- CreateIndex
CREATE INDEX "Airport_lat_lon_idx" ON "Airport"("lat", "lon");

-- CreateIndex
CREATE INDEX "NavStation_lat_lon_idx" ON "NavStation"("lat", "lon");

-- CreateIndex
CREATE INDEX "Runway_airportId_idx" ON "Runway"("airportId");

