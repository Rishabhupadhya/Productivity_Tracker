import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log full error details for debugging
  logger.error(err.stack || err.message);
  
  // Never expose error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      success: false,
      message: 'An internal server error occurred' 
    });
  } else {
    res.status(500).json({ 
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};
