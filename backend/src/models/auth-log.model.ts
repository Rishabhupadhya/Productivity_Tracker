import mongoose, { Schema, Document } from "mongoose";

/**
 * Authentication Audit Log Model
 * SOC2 Compliance: Track all authentication events
 */
export interface IAuthLog extends Document {
  userId?: mongoose.Types.ObjectId;
  email?: string;
  eventType: 
    | 'login_success'
    | 'login_failed'
    | 'logout'
    | 'oauth_login_success'
    | 'oauth_login_failed'
    | 'token_refresh'
    | 'password_reset_request'
    | 'password_reset_success'
    | 'account_locked'
    | 'account_unlocked'
    | 'mfa_enabled'
    | 'mfa_disabled';
  authMethod: 'email_password' | 'google' | 'microsoft' | 'okta' | 'github';
  ipAddress: string;
  userAgent: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  metadata?: {
    reason?: string;
    errorCode?: string;
    attemptCount?: number;
    [key: string]: any;
  };
  timestamp: Date;
}

const AuthLogSchema = new Schema<IAuthLog>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User",
      index: true 
    },
    email: { 
      type: String, 
      lowercase: true,
      index: true 
    },
    eventType: { 
      type: String, 
      required: true,
      index: true
    },
    authMethod: { 
      type: String, 
      required: true,
      index: true
    },
    ipAddress: { 
      type: String, 
      required: true,
      index: true 
    },
    userAgent: { 
      type: String, 
      required: true 
    },
    location: {
      country: String,
      city: String,
      timezone: String
    },
    metadata: { 
      type: Schema.Types.Mixed 
    },
    timestamp: { 
      type: Date, 
      default: Date.now,
      index: true 
    }
  },
  { 
    timestamps: false, // Use timestamp field instead
    timeseries: {
      timeField: 'timestamp',
      granularity: 'hours'
    }
  }
);

// Compound indexes for common queries
AuthLogSchema.index({ userId: 1, timestamp: -1 });
AuthLogSchema.index({ email: 1, eventType: 1, timestamp: -1 });
AuthLogSchema.index({ timestamp: -1 }); // For recent events

export const AuthLog = mongoose.model<IAuthLog>("AuthLog", AuthLogSchema);
