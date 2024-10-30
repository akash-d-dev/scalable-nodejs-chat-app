-- AlterTable
ALTER TABLE "chats" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_image" BOOLEAN NOT NULL DEFAULT false;
