/*
  Warnings:

  - You are about to drop the column `net_profit` on the `deposits` table. All the data in the column will be lost.
  - Added the required column `total_akhir` to the `deposits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "deposits" RENAME COLUMN "net_profit" TO "total_akhir";
