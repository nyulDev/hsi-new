/*
  Warnings:

  - A unique constraint covering the columns `[kode]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kode` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."users_email_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "kode" TEXT;

-- Update existing users with a default kode based on their email or name
UPDATE "users" SET "kode" = COALESCE("email", 'user_' || "id") WHERE "kode" IS NULL;

-- Make kode NOT NULL and add unique constraint
ALTER TABLE "users" ALTER COLUMN "kode" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_kode_key" UNIQUE ("kode");
