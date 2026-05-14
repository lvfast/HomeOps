-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('UNKNOWN', 'UP', 'DOWN');

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "expectedStatusCode" INTEGER NOT NULL DEFAULT 200,
    "intervalSeconds" INTEGER NOT NULL DEFAULT 60,
    "timeoutSeconds" INTEGER NOT NULL DEFAULT 5,
    "failureThreshold" INTEGER NOT NULL DEFAULT 3,
    "currentStatus" "ServiceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCheckedAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);
