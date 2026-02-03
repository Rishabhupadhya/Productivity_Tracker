import mongoose, { Schema, Document, Types } from "mongoose";

export type TaskStatus = "pending" | "completed" | "overdue";

export interface ITask extends Document {
  title: string;
  duration: string;
  day: string; // Date in YYYY-MM-DD format
  startTime: string;
  userId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  teamId?: Types.ObjectId;
  workspaceId: string;
  
  // Completion tracking
  completed: boolean;
  completedAt?: Date;
  status: TaskStatus;
  
  // Date fields for proper scheduling
  scheduledDate?: Date; // Full date object (optional, auto-set from day)
  scheduledTime?: string; // HH:mm format
  
  // Email notification tracking
  lastEmailSentAt?: Date;
  emailsSentCount: number;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    duration: { type: String, required: true },
    day: { type: String, required: true }, // YYYY-MM-DD format
    startTime: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    workspaceId: { type: String, required: true },
    
    // Completion tracking
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    status: { 
      type: String, 
      enum: ["pending", "completed", "overdue"], 
      default: "pending" 
    },
    
    // Scheduling (make scheduledDate optional for backwards compatibility)
    scheduledDate: { type: Date },
    scheduledTime: { type: String }, // Optional time
    
    // Email tracking
    lastEmailSentAt: { type: Date },
    emailsSentCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Index for efficient queries
TaskSchema.index({ userId: 1, scheduledDate: 1 });
TaskSchema.index({ status: 1, scheduledDate: 1 });
TaskSchema.index({ completed: 1, scheduledDate: 1 });

// Pre-save hook to ensure scheduledDate is set
TaskSchema.pre('save', function(next) {
  if (!this.scheduledDate && this.day) {
    this.scheduledDate = new Date(this.day);
    this.scheduledDate.setHours(0, 0, 0, 0);
  }
  next();
});

export const Task = mongoose.model<ITask>("Task", TaskSchema);