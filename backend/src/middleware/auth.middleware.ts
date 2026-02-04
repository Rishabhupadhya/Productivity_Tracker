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
    // Verify token without strict issuer/audience to support legacy tokens
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      // Don't enforce issuer/audience for backward compatibility
    }) as any;

    // Support multiple ID formats (id, userId, sub) for cross-service compatibility
    req.user = {
      id: decoded.id || decoded.userId || decoded.sub,
      userId: decoded.userId || decoded.id || decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user'
    };

    if (!req.user.id) {
      console.log('Auth failed: No user ID in token payload', { path: req.path });
      return res.status(401).json({
        success: false,
        message: "Invalid token payload - missing user identification"
      });
    }

    console.log('Auth success:', {
      userId: req.user.id,
      path: req.path
    });

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
