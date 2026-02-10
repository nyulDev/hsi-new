/*
  Warnings:

  - You are about to drop the column `saldo` on the `mutasi_records` table. All the data in the column will be lost.
  - Added the required column `saldo_akhir` to the `mutasi_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "mutasi_records" ADD COLUMN     "saldo_akhir" DECIMAL(15,2) DEFAULT 0,
ALTER COLUMN "nilai_mutasi" SET DATA TYPE DECIMAL(15,2);
-- Update existing records to set saldo_akhir to 0
UPDATE "mutasi_records" SET "saldo_akhir" = 0 WHERE "saldo_akhir" IS NULL;
-- Make saldo_akhir NOT NULL
ALTER TABLE "mutasi_records" ALTER COLUMN "saldo_akhir" SET NOT NULL;
-- Drop the old saldo column
ALTER TABLE "mutasi_records" DROP COLUMN "saldo";
