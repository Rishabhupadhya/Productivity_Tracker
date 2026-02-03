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
    console.log('Auth failed: No token provided', {
      hasAuthHeader: !!req.headers.authorization,
      hasCookies: !!req.cookies,
      path: req.path
    });
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
    console.log('Auth failed: Invalid token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path
    });
    res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};
