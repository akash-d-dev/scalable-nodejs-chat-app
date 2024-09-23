import { Request, response, Response } from "express";
import prisma from "../config/db.config.js";
import jwt from "jsonwebtoken";

//types
interface LoginPayloadType {
  name: string;
  email: string;
  oauth_id: string;
  provider: string;
  image: string;
}

class AuthController {
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
        name: findUser.name,
        email: findUser.email,
        id: findUser.id,
      };
      const token = jwt.sign(JWTPayload, process.env.JWT_SECRET as string, {
        expiresIn: "365d",
      });

      return response.json({
        message: "Logged in successfully",
        user: { ...findUser, token: `Bearer ${token}` },
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Something went wrong. Please try again!" });
    }
  }
}

export default AuthController;
