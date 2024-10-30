/*
  Warnings:

  - You are about to drop the column `is_image` on the `chats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chats" DROP COLUMN "is_image",
ADD COLUMN     "has_image" BOOLEAN NOT NULL DEFAULT false;
