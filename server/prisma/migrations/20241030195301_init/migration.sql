/*
  Warnings:

  - You are about to drop the column `has_image` on the `chats` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `chats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chats" DROP COLUMN "has_image",
DROP COLUMN "image_url",
ADD COLUMN     "file_url" TEXT,
ADD COLUMN     "has_file" BOOLEAN NOT NULL DEFAULT false;
