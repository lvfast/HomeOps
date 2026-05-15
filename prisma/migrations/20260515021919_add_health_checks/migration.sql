-- CreateEnum
CREATE TYPE "HealthCheckStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateTable
CREATE TABLE "health_checks" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" "HealthCheckStatus" NOT NULL,
    "statusCode" INTEGER,
    "responseTimeMs" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "health_checks" ADD CONSTRAINT "health_checks_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
