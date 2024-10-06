import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

// Logic
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ status: 401, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({ status: 401, message: "Unauthorized" });
      }
      req.user = user as AuthUser;

      console.log("#########################");
      console.log("AuthMiddleware User:", req.user.email);
      console.log("#########################");

      next();
    });
  } catch (error) {
    return res.status(401).json({ status: 401, message: "Unauthorized" });
  }
};

export default authMiddleware;
