import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Get token from Authorization header (PRIMARY METHOD)
  let token = req.headers.authorization?.split(" ")[1];
  
  // Fall back to cookies if needed
  if (!token && req.cookies) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "Unauthorized - No token provided" 
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};
