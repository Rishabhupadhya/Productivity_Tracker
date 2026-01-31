import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITask extends Document {
  title: string;
  duration: string;
  day: string;
  startTime: string;
  userId: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  workspaceId: string;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    duration: { type: String, required: true },
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    workspaceId: { type: String, required: true }
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>("Task", TaskSchema);