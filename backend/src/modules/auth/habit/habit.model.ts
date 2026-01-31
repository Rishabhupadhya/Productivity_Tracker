import mongoose, { Schema, Document, Types } from "mongoose";

export type HabitFrequency = "daily" | "weekly" | "custom";

export interface IHabitCompletion {
  date: Date;
  completed: boolean;
  notes?: string;
}

export interface IHabit extends Document {
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  name: string;
  description: string;
  frequency: HabitFrequency;
  timesPerWeek?: number; // For "custom" frequency
  
  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: Date;
  
  // Grace days
  graceDays: number;
  graceDaysUsed: number;
  
  // Completions history
  completions: IHabitCompletion[];
  
  // Goal linking
  linkedGoals: Types.ObjectId[];
  
  // Stats
  totalCompletions: number;
  successRate: number; // percentage
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitCompletionSchema = new Schema({
  date: { type: Date, required: true },
  completed: { type: Boolean, default: true },
  notes: { type: String, default: "" }
}, { _id: false });

const HabitSchema = new Schema<IHabit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    frequency: { type: String, enum: ["daily", "weekly", "custom"], required: true },
    timesPerWeek: { type: Number, min: 1, max: 7 },
    
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletedDate: { type: Date },
    
    graceDays: { type: Number, default: 1 },
    graceDaysUsed: { type: Number, default: 0 },
    
    completions: [HabitCompletionSchema],
    
    linkedGoals: [{ type: Schema.Types.ObjectId, ref: "Goal" }],
    
    totalCompletions: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

HabitSchema.index({ userId: 1, isActive: 1 });
HabitSchema.index({ teamId: 1, isActive: 1 });

export const Habit = mongoose.model<IHabit>("Habit", HabitSchema);
