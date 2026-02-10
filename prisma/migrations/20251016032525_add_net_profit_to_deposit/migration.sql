/*
  Warnings:

  - Added the required column `net_profit` to the `deposits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "deposits" ADD COLUMN     "net_profit" DECIMAL(15,2) NOT NULL DEFAULT 0;
