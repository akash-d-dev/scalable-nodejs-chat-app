/*
  Warnings:

  - You are about to drop the column `userId` on the `group_users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "group_users" DROP CONSTRAINT "group_users_userId_fkey";

-- DropIndex
DROP INDEX "chat_groups_created_at_idx";

-- AlterTable
ALTER TABLE "group_users" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "provider" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "chat_groups_user_id_created_at_idx" ON "chat_groups"("user_id", "created_at");
