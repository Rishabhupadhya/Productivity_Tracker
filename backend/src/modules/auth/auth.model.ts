import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  workspaceId: string;
  avatar?: string;
  timezone: string;
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
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    workspaceId: { type: String, required: true, default: "default" },
    avatar: { type: String },
    timezone: { type: String, default: "UTC" },
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
