import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import PrismaUtils from "../utils/PrismaUtils.js";
import { prisma } from "../config/db.config.js";

// Types
interface LoginPayloadType {
  name: string;
  email: string;
  oauth_id: string;
  provider: string;
  image: string;
}

// Logic
class AuthController {
  ////////////////////////////////////////////////////
  // To login the user
  ////////////////////////////////////////////////////
  static async login(req: Request, res: Response) {
    try {
      const body: LoginPayloadType = req.body;

      let findUser = await PrismaUtils.findOne(prisma.user, {
        email: body.email,
      });

      if (!findUser) {
        findUser = await PrismaUtils.create(prisma.user, body);
      }

      let JWTPayload = {
        name: body.name,
        email: body.email,
        id: findUser.id,
      };

      const token = jwt.sign(JWTPayload, process.env.JWT_SECRET, {
        expiresIn: "365d",
      });

      return res.json({
        message: "Logged in successfully!",
        user: {
          ...findUser,
          token: `Bearer ${token}`,
        },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Something went wrong. Please try again!" });
    }
  }

  ////////////////////////////////////////////////////
  // To login the user to a chat room
  ////////////////////////////////////////////////////
  static async chatRoomLogin(roomId: string, passCode: string) {
    try {
      const room = await PrismaUtils.findOne(prisma.chatGroup, {
        id: roomId,
      });

      if (!room || room.passcode !== passCode) {
        return false;
      }

      return true;
    } catch (error) {
      console.log("Something went wrong. Please try again!");
      return false;
    }
  }
}

export default AuthController;
