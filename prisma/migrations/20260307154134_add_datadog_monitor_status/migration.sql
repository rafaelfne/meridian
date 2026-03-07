-- CreateEnum
CREATE TYPE "DatadogMonitorStatus" AS ENUM ('OK', 'WARN', 'ALERT', 'NO_DATA', 'NOT_FOUND');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "datadogMonitorIds" JSONB,
ADD COLUMN     "datadogStatus" "DatadogMonitorStatus",
ADD COLUMN     "datadogStatusUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "System" ADD COLUMN     "datadogStatus" "DatadogMonitorStatus";
