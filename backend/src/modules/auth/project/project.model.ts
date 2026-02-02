import mongoose, { Schema, Document, Types } from "mongoose";

export interface IProject extends Document {
  name: string;
  color: string;
  icon: string;
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#00ffff" },
    icon: { type: String, default: "📁" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" }
  },
  { timestamps: true }
);

export const Project = mongoose.model<IProject>("Project", ProjectSchema);
