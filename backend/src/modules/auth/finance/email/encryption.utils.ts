/**
 * Token Encryption Utilities
 * 
 * Encrypts and decrypts OAuth tokens before storing in database
 * Uses AES-256-GCM for encryption
 */

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const ALGORITHM = "aes-256-gcm";

/**
 * Encrypt a token
 */
export const encryptToken = (token: string): string => {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set in environment variables");
  }

  // Generate random IV
  const iv = crypto.randomBytes(16);

  // Create cipher
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  // Encrypt
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
};

/**
 * Decrypt a token
 */
export const decryptToken = (encryptedToken: string): string => {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set in environment variables");
  }

  // Split into parts
  const parts = encryptedToken.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const [ivHex, authTagHex, encrypted] = parts;

  // Create decipher
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    Buffer.from(ivHex, "hex")
  );

  // Set auth tag
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  // Decrypt
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
