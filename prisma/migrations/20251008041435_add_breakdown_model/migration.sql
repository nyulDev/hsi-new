/*
  Warnings:

  - You are about to drop the column `bank` on the `investors` table. All the data in the column will be lost.
  - You are about to drop the column `nomor_rekening` on the `investors` table. All the data in the column will be lost.
  - Added the required column `kode` to the `mutasi_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nilai_mutasi` to the `mutasi_records` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."investors_email_key";

-- AlterTable
ALTER TABLE "public"."investors" DROP COLUMN "bank",
DROP COLUMN "nomor_rekening",
ADD COLUMN     "rekening_bank" TEXT,
ALTER COLUMN "nama" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "kode" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."mutasi_records" ADD COLUMN     "kode" TEXT NOT NULL,
ADD COLUMN     "nama" TEXT,
ADD COLUMN     "nilai_mutasi" DECIMAL(10,0) NOT NULL,
ADD COLUMN     "rekening_bank" TEXT;

-- CreateTable
CREATE TABLE "public"."breakdowns" (
    "id" TEXT NOT NULL,
    "kode" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "project_pt" TEXT,
    "keterangan" TEXT,
    "nilai" DECIMAL(15,2) NOT NULL,
    "tempo" INTEGER NOT NULL,
    "bagi_hasil" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "breakdowns_kode_key" ON "public"."breakdowns"("kode");
