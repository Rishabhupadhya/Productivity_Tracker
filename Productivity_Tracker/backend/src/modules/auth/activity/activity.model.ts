import mongoose, { Schema, Document, Types } from "mongoose";

export interface IActivity extends Document {
  teamId: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  targetType: "task" | "member" | "team" | "transaction" | "goal" | "habit";
  targetId?: Types.ObjectId;
  details: {
    taskTitle?: string;
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
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { 
      type: String, 
      required: true,
      enum: [
        "task_created",
        "task_updated", 
        "task_deleted",
        "member_invited",
        "member_joined",
        "member_removed",
        "team_created",
        "finance_transaction_added",
        "finance_budget_set",
        "goal_created",
        "goal_completed",
        "habit_completed",
        "habit_streak_milestone"
      ]
    },
    targetType: { type: String, enum: ["task", "member", "team", "transaction", "goal", "habit"], required: true },
    targetId: { type: Schema.Types.ObjectId },
    details: {
      taskTitle: String,
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
