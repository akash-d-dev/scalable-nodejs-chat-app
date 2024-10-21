import { Request, Response } from "express";
import PrismaUtils from "../utils/PrismaUtils.js";
import prisma from "../config/db.config.js";

// Types
interface GroupUserType {
  name: string;
  group_id: string;
}

// Logic
class ChatGroupUserController {
  ////////////////////////////////////////////////////
  // To fetch all group users
  ////////////////////////////////////////////////////
  static async index(req: Request, res: Response) {
    try {
      const { group_id } = req.query;

      // Use the generic PrismaUtils function
      const users = await PrismaUtils.findMany(prisma.groupUsers, {
        group_id: group_id as string,
      });

      return res.json({
        message: "Group users fetched successfully!",
        data: users,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Something went wrong!, Please try again later." });
    }
  }

  ////////////////////////////////////////////////////
  // To create a group user
  ////////////////////////////////////////////////////
  static async store(req: Request, res: Response) {
    try {
      const body: GroupUserType = req.body;
      const user = await PrismaUtils.create(prisma.groupUsers, body);

      return res.json({
        message: "User added successfully!",
        data: user,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Something went wrong!, Please try again later." });
    }
  }
}

export default ChatGroupUserController;
