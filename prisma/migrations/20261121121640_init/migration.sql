-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "StationType" AS ENUM ('VOR', 'DVOR', 'DME', 'NDB', 'ILS_LOC', 'ILS_GS', 'MARKER_OM', 'MARKER_MM', 'MARKER_IM');

-- CreateEnum
CREATE TYPE "FlightResult" AS ENUM ('IN_PROGRESS', 'LANDED', 'CRASHED', 'COMPLETED', 'ABORTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Airport" (
    "id" SERIAL NOT NULL,
    "icao" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "elevationFt" INTEGER NOT NULL,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Runway" (
    "id" SERIAL NOT NULL,
    "airportId" INTEGER NOT NULL,
    "ident" TEXT NOT NULL,
    "headingDeg" DOUBLE PRECISION NOT NULL,
    "thresholdLat" DOUBLE PRECISION NOT NULL,
    "thresholdLon" DOUBLE PRECISION NOT NULL,
    "lengthM" INTEGER NOT NULL,
    "widthM" INTEGER NOT NULL,

    CONSTRAINT "Runway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavStation" (
    "id" SERIAL NOT NULL,
    "type" "StationType" NOT NULL,
    "ident" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" DOUBLE PRECISION NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "rangeNm" INTEGER NOT NULL,
    "runwayId" INTEGER,

    CONSTRAINT "NavStation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waypoint" (
    "id" SERIAL NOT NULL,
    "ident" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Waypoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "config" JSONB NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "result" "FlightResult" NOT NULL DEFAULT 'IN_PROGRESS',

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightSample" (
    "id" SERIAL NOT NULL,
    "flightId" TEXT NOT NULL,
    "tMs" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "altFt" DOUBLE PRECISION NOT NULL,
    "hdgDeg" DOUBLE PRECISION NOT NULL,
    "iasKt" DOUBLE PRECISION NOT NULL,
    "vsFpm" DOUBLE PRECISION NOT NULL,
    "nav" JSONB NOT NULL,

    CONSTRAINT "FlightSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Score" (
    "id" SERIAL NOT NULL,
    "flightId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "details" JSONB NOT NULL,

    CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Airport_icao_key" ON "Airport"("icao");

-- CreateIndex
CREATE INDEX "NavStation_frequency_idx" ON "NavStation"("frequency");

-- CreateIndex
CREATE UNIQUE INDEX "Waypoint_ident_key" ON "Waypoint"("ident");

-- CreateIndex
CREATE INDEX "Flight_userId_idx" ON "Flight"("userId");

-- CreateIndex
CREATE INDEX "FlightSample_flightId_tMs_idx" ON "FlightSample"("flightId", "tMs");

-- CreateIndex
CREATE UNIQUE INDEX "Score_flightId_key" ON "Score"("flightId");

-- AddForeignKey
ALTER TABLE "Runway" ADD CONSTRAINT "Runway_airportId_fkey" FOREIGN KEY ("airportId") REFERENCES "Airport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavStation" ADD CONSTRAINT "NavStation_runwayId_fkey" FOREIGN KEY ("runwayId") REFERENCES "Runway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightSample" ADD CONSTRAINT "FlightSample_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Score" ADD CONSTRAINT "Score_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE CASCADE ON UPDATE CASCADE;
