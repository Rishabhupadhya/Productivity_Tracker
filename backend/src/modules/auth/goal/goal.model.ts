import mongoose, { Schema, Document, Types } from "mongoose";

export type GoalType = "financial" | "time" | "count" | "binary";
export type GoalStatus = "active" | "completed" | "archived";

export interface IMilestone {
  title: string;
  targetValue: number;
  completed: boolean;
  completedAt?: Date;
}

export interface IGoalReview {
  date: Date;
  whatHelped: string;
  whatBlocked: string;
  notes: string;
}

export interface IGoal extends Document {
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  title: string;
  description: string;
  type: GoalType;
  status: GoalStatus;
  
  // Progress tracking
  targetValue: number;
  currentValue: number;
  unit: string; // "₹", "hours", "count", ""
  
  // Dates
  startDate: Date;
  targetDate?: Date;
  completedAt?: Date;
  
  // Milestones
  milestones: IMilestone[];
  
  // Auto-update links
  linkedHabits: Types.ObjectId[]; // Habit IDs
  linkedFinanceCategory?: string;
  linkedTasks: Types.ObjectId[]; // Task IDs
  
  // Reviews
  reviews: IGoalReview[];
  
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema({
  title: { type: String, required: true },
  targetValue: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
}, { _id: false });

const GoalReviewSchema = new Schema({
  date: { type: Date, default: Date.now },
  whatHelped: { type: String, default: "" },
  whatBlocked: { type: String, default: "" },
  notes: { type: String, default: "" }
}, { _id: true, versionKey: false });

const GoalSchema = new Schema<IGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["financial", "time", "count", "binary"], required: true },
    status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
    
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    
    startDate: { type: Date, default: Date.now },
    targetDate: { type: Date },
    completedAt: { type: Date },
    
    milestones: [MilestoneSchema],
    
    linkedHabits: [{ type: Schema.Types.ObjectId, ref: "Habit" }],
    linkedFinanceCategory: { type: String },
    linkedTasks: [{ type: Schema.Types.ObjectId, ref: "Task" }],
    
    reviews: [GoalReviewSchema]
  },
  { timestamps: true }
);

GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ teamId: 1, status: 1 });

export const Goal = mongoose.model<IGoal>("Goal", GoalSchema);
