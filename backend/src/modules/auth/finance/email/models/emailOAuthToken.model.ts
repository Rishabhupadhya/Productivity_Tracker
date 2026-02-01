/**
 * Email OAuth Token Model
 * 
 * Stores encrypted OAuth tokens for Gmail and Outlook
 * Used for fetching user emails via API
 * 
 * SECURITY:
 * - Tokens are encrypted before storage
 * - Users can revoke access anytime
 * - Tokens expire and need refresh
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IEmailOAuthToken extends Document {
  userId: mongoose.Types.ObjectId;
  provider: "gmail" | "outlook";
  accessToken: string; // Encrypted
  refreshToken?: string; // Encrypted
  expiresAt: Date;
  scope: string;
  userEmail?: string; // User's email address
  connectedAt: Date;
  createdAt: Date;
  lastUsed?: Date;
}

const EmailOAuthTokenSchema = new Schema<IEmailOAuthToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: ["gmail", "outlook"],
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    scope: {
      type: String,
      required: true,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastUsed: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound unique index: one token per user per provider
EmailOAuthTokenSchema.index({ userId: 1, provider: 1 }, { unique: true });

// Index for finding expired tokens
EmailOAuthTokenSchema.index({ expiresAt: 1 });

export const EmailOAuthToken = mongoose.model<IEmailOAuthToken>(
  "EmailOAuthToken",
  EmailOAuthTokenSchema
);
