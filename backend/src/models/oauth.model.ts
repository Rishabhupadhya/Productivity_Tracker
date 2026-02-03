import mongoose, { Schema, Document } from "mongoose";

/**
 * OAuth Account Model
 * Stores external OAuth provider account information
 * Supports account linking for multiple providers
 */
export interface IOAuthAccount extends Document {
  userId: mongoose.Types.ObjectId;
  provider: 'google' | 'microsoft' | 'okta' | 'github';
  providerId: string; // Unique ID from OAuth provider
  email: string;
  name?: string;
  picture?: string;
  accessToken?: string; // Encrypted
  refreshToken?: string; // Encrypted
  tokenExpiry?: Date;
  scope?: string[];
  rawProfile?: any; // Store full OAuth profile for audit
  lastLogin?: Date;
  isActive: boolean;
}

const OAuthAccountSchema = new Schema<IOAuthAccount>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    provider: { 
      type: String, 
      required: true,
      enum: ['google', 'microsoft', 'okta', 'github'],
      index: true
    },
    providerId: { 
      type: String, 
      required: true,
      index: true
    },
    email: { 
      type: String, 
      required: true,
      lowercase: true,
      index: true
    },
    name: { type: String },
    picture: { type: String },
    accessToken: { type: String, select: false }, // Exclude by default
    refreshToken: { type: String, select: false },
    tokenExpiry: { type: Date },
    scope: [{ type: String }],
    rawProfile: { type: Schema.Types.Mixed },
    lastLogin: { type: Date },
    isActive: { 
      type: Boolean, 
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

// Compound index for provider + providerId uniqueness
OAuthAccountSchema.index({ provider: 1, providerId: 1 }, { unique: true });

// Index for account linking queries
OAuthAccountSchema.index({ userId: 1, provider: 1 });

export const OAuthAccount = mongoose.model<IOAuthAccount>("OAuthAccount", OAuthAccountSchema);
