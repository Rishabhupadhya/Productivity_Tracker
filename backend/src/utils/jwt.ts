import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

interface TokenPayload {
  userId: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Generate Access Token (short-lived)
 * Used for API authentication
 */
export const generateToken = (userId: string, role: string = 'user'): string => {
  const payload: TokenPayload = {
    userId,
    role,
    type: 'access',
  };

  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as any, 
    issuer: 'productivity-tracker',
    audience: 'productivity-tracker-api',
  };

  return jwt.sign(payload, env.JWT_SECRET as string, options);
};

/**
 * Generate Refresh Token (long-lived)
 * Used to obtain new access tokens
 */
export const generateRefreshToken = (userId: string): string => {
  const payload = {
    userId,
    type: 'refresh',
  };

  const options: SignOptions = {
    expiresIn: '30d', // 30 days
    issuer: 'productivity-tracker',
    audience: 'productivity-tracker-api',
  };

  return jwt.sign(payload, (env.JWT_REFRESH_SECRET || env.JWT_SECRET) as string, options);
};

/**
 * Verify Access Token
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET as string, {
    issuer: 'productivity-tracker',
    audience: 'productivity-tracker-api',
  }) as TokenPayload;
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token: string): { userId: string; type: string } => {
  return jwt.verify(token, (env.JWT_REFRESH_SECRET || env.JWT_SECRET) as string, {
    issuer: 'productivity-tracker',
    audience: 'productivity-tracker-api',
  }) as { userId: string; type: string };
};

/**
 * Legacy support - backward compatibility
 */
export const signToken = (payload: object) => {
  return jwt.sign(payload, env.JWT_SECRET as string, { expiresIn: "7d" });
};
