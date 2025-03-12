import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwtUtil";
import "../types/express";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = decoded;
  next();
};
