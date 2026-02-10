/*
  Warnings:

  - You are about to drop the column `investment_id` on the `mutasi_records` table. All the data in the column will be lost.
  - You are about to drop the `investments` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `kode` to the `investors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `investor_id` to the `mutasi_records` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."investments" DROP CONSTRAINT "investments_investor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."mutasi_records" DROP CONSTRAINT "mutasi_records_investment_id_fkey";

-- AlterTable
ALTER TABLE "public"."investors" ADD COLUMN     "kode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."mutasi_records" DROP COLUMN "investment_id",
ADD COLUMN     "investor_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."investments";

-- AddForeignKey
ALTER TABLE "public"."mutasi_records" ADD CONSTRAINT "mutasi_records_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "public"."investors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
