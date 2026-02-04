import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProject extends Document {
  name: string;
  description?: string;
  notes?: string;
  color: string;
  icon: string;
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    notes: { type: String, default: "" },
    color: { type: String, default: "#00ffff" },
    icon: { type: String, default: "📁" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

ProjectSchema.index({ userId: 1, completed: 1 });
ProjectSchema.index({ teamId: 1, completed: 1 });

export const Project = mongoose.model<IProject>("Project", ProjectSchema);
