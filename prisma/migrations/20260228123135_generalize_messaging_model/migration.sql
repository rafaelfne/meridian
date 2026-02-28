-- CreateEnum
CREATE TYPE "MessageBroker" AS ENUM ('KAFKA', 'RABBITMQ', 'SQS', 'SNS', 'OTHER');

-- AlterEnum
ALTER TYPE "DependencyType" ADD VALUE 'RABBITMQ_QUEUE';
ALTER TYPE "DependencyType" ADD VALUE 'SQS_QUEUE';

-- CreateTable
CREATE TABLE "MessageTopic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "TopicRole" NOT NULL,
    "broker" "MessageBroker" NOT NULL,
    "metadata" JSONB,
    "systemId" TEXT NOT NULL,

    CONSTRAINT "MessageTopic_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data
INSERT INTO "MessageTopic" ("id", "name", "role", "broker", "systemId")
SELECT "id", "name", "role", 'KAFKA'::"MessageBroker", "systemId"
FROM "KafkaTopic";

-- DropTable
DROP TABLE "KafkaTopic";

-- AddForeignKey
ALTER TABLE "MessageTopic" ADD CONSTRAINT "MessageTopic_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE CASCADE ON UPDATE CASCADE;
