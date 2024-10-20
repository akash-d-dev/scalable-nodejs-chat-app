import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db.config.js";

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

      let findUser = await prisma.user.findUnique({
        where: {
          email: body.email,
        },
      });

      if (!findUser) {
        findUser = await prisma.user.create({
          data: body,
        });
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
        .json({ message: "Something went wrong.please try again!" });
    }
  }

  ////////////////////////////////////////////////////
  // To login the user to a chat room
  ////////////////////////////////////////////////////
  static async chatRoomLogin(roomId: string, passCode: string) {
    try {
      const room = await prisma.chatGroup.findUnique({
        where: {
          id: roomId,
        },
      });

      if (!room) {
        return false;
      }

      if (room.passcode !== passCode) {
        return false;
      }

      return true;
    } catch (error) {
      console.log("Something went wrong.please try again!");
      return false;
    }
  }
}

export default AuthController;
