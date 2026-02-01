import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeamMember {
  userId: Types.ObjectId;
  role: "admin" | "member";
  joinedAt: Date;
}

export interface ITeamInvite {
  email: string;
  role: "admin" | "member";
  invitedBy: Types.ObjectId;
  invitedAt: Date;
  status: "pending" | "accepted" | "rejected";
}

export interface ITeam extends Document {
  name: string;
  createdBy: Types.ObjectId;
  members: ITeamMember[];
  invites: ITeamInvite[];
}

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, enum: ["admin", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    invites: [
      {
        email: { type: String, required: true },
        role: { type: String, enum: ["admin", "member"], default: "member" },
        invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        invitedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" }
      }
    ]
  },
  { timestamps: true }
);

export const Team = mongoose.model<ITeam>("Team", TeamSchema);
