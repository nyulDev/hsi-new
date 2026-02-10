-- CreateEnum
CREATE TYPE "MutasiStatus" AS ENUM ('PROSES', 'SELESAI');

-- AlterTable
ALTER TABLE "mutasi_records" ADD COLUMN     "status" "MutasiStatus" NOT NULL DEFAULT 'PROSES';
