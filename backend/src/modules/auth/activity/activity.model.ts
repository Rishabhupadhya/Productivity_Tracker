import mongoose, { Schema, Document, Types } from "mongoose";

export interface IActivity extends Document {
  teamId?: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  targetType: "task" | "member" | "team" | "transaction" | "goal" | "habit" | "project";
  targetId?: Types.ObjectId;
  details: {
    taskTitle?: string;
    projectName?: string;
    memberName?: string;
    memberEmail?: string;
    changes?: string;
    role?: string;
    type?: string;
    amount?: number;
    category?: string;
    title?: string;
    name?: string;
    streak?: number;
    finalValue?: number;
  };
  timestamp: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: false, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      required: true
      // Enum removed to support dynamic project/task actions
    },
    targetType: { type: String, enum: ["task", "member", "team", "transaction", "goal", "habit", "project"], required: true },
    targetId: { type: Schema.Types.ObjectId },
    details: {
      taskTitle: String,
      projectName: String,
      memberName: String,
      memberEmail: String,
      changes: String,
      role: String
    },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: false }
);

// Index for efficient queries
ActivitySchema.index({ teamId: 1, timestamp: -1 });

export const Activity = mongoose.model<IActivity>("Activity", ActivitySchema);
