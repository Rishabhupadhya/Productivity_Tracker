import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICreditCard extends Document {
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  ownerId: Types.ObjectId; // Who added this card
  cardName: string; // E.g., "HDFC Regalia", "SBI SimplyCLICK"
  bankName: string;
  last4Digits: string;
  creditLimit: number;
  outstandingAmount: number; // Current outstanding balance
  monthlyLimit?: number; // User-defined monthly spending limit
  billingCycleStartDay: number; // 1-31
  dueDateDay: number; // 1-31
  interestRate?: number; // Annual percentage rate
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CreditCardSchema = new Schema<ICreditCard>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cardName: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    last4Digits: { 
      type: String, 
      required: true, 
      validate: {
        validator: (v: string) => /^\d{4}$/.test(v),
        message: "last4Digits must be exactly 4 digits"
      }
    },
    creditLimit: { type: Number, required: true, min: 0 },
    outstandingAmount: { type: Number, default: 0, min: 0 },
    monthlyLimit: { type: Number, min: 0 }, // Optional monthly spending limit
    billingCycleStartDay: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 31 
    },
    dueDateDay: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 31 
    },
    interestRate: { type: Number, min: 0, max: 100 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound index for efficient queries
CreditCardSchema.index({ userId: 1, isActive: 1 });
CreditCardSchema.index({ teamId: 1, isActive: 1 });

export const CreditCard = mongoose.model<ICreditCard>("CreditCard", CreditCardSchema);
