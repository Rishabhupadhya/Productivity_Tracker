import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log full error details for debugging with request info
  logger.error('Error occurred:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });
  
  // Return error message in all environments for debugging
  res.status(500).json({ 
    success: false,
    message: err.message,
    path: req.path,
    // Only include stack in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
