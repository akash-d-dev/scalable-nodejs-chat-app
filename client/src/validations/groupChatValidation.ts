import { z } from "zod";

export const createChatSchema = z
  .object({
    title: z
      .string()
      .min(4, { message: "Chat title must be at least 4 characters long" })
      .max(50, { message: "Chat title must be at most 50 characters long" }),
    passcode: z
      .string()
      .min(4, { message: "Passcode must be at least 4 characters long" })
      .max(25, {
        message: "Passcode must be at most 25 characters long",
      }),
  })
  .required();

export type createChatSchemaType = z.infer<typeof createChatSchema>;
