-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('ACTIVE', 'MATURED', 'WITHDRAWN', 'ROLLED_OVER');

-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "status" "DepositStatus" NOT NULL DEFAULT 'ACTIVE';
