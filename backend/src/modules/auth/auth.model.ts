import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for OAuth users
  workspaceId: string;
  activeTeamId?: mongoose.Types.ObjectId;
  avatar?: string;
  timezone: string;
  xp: number;
  level: number;
  role: 'user' | 'admin' | 'manager';
  authMethod: 'email_password' | 'oauth';
  emailVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  momentum: {
    today: number;
    week: number;
    lastUpdated: Date;
  };
  workingHours: {
    start: string;
    end: string;
  };
  defaultTaskDuration: string;
  settings: {
    weekStartDay: number; // 0 = Sunday, 1 = Monday
    timeFormat: string; // "12h" or "24h"
    showCurrentTimeline: boolean;
    enableUndoDelete: boolean;
    enableDragDrop: boolean;
    focusMode: boolean;
    taskReminders: boolean;
    dailySummary: boolean;
  };
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // Not required for OAuth users
    workspaceId: { type: String, required: true, default: "default" },
    activeTeamId: { type: Schema.Types.ObjectId, ref: "Team" },
    avatar: { type: String },
    timezone: { type: String, default: "UTC" },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    role: { 
      type: String, 
      enum: ['user', 'admin', 'manager'],
      default: 'user',
      index: true
    },
    authMethod: { 
      type: String, 
      enum: ['email_password', 'oauth'],
      default: 'email_password',
      index: true
    },
    emailVerified: { 
      type: Boolean, 
      default: false 
    },
    isActive: { 
      type: Boolean, 
      default: true,
      index: true
    },
    lastLogin: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date },
    momentum: {
      today: { type: Number, default: 0 },
      week: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    workingHours: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "18:00" }
    },
    defaultTaskDuration: { type: String, default: "1h" },
    settings: {
      weekStartDay: { type: Number, default: 1 }, // Monday
      timeFormat: { type: String, default: "24h" },
      showCurrentTimeline: { type: Boolean, default: true },
      enableUndoDelete: { type: Boolean, default: true },
      enableDragDrop: { type: Boolean, default: true },
      focusMode: { type: Boolean, default: false },
      taskReminders: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
