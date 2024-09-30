import { Request, Response } from "express";
import prisma from "../config/db.config.js";

class ChatController {
  ////////////////////////////////////////////////////
  // To fetch all chats
  ////////////////////////////////////////////////////
  static async index(req: Request, res: Response) {
    const { groupId } = req.params;
    const chats = await prisma.chats.findMany({
      where: {
        group_id: groupId,
      },
    });
    return res.json({
      messsage: "Chats fetched successfully!",
      data: chats,
    });
  }
}

export default ChatController;
