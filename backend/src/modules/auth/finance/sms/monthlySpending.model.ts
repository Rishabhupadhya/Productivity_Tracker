/**
 * Monthly Spending Tracker Model
 * 
 * Tracks credit card spending aggregated by month.
 * Auto-resets when a new month begins.
 */

import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMonthlySpending extends Document {
  userId: Types.ObjectId;
  creditCardId: Types.ObjectId;
  month: string; // Format: "YYYY-MM" (e.g., "2026-01")
  totalSpent: number;
  transactionCount: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlySpendingSchema = new Schema<IMonthlySpending>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    creditCardId: { type: Schema.Types.ObjectId, ref: "CreditCard", required: true, index: true },
    month: { 
      type: String, 
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/ // Validate YYYY-MM format
    },
    totalSpent: { type: Number, default: 0, min: 0 },
    transactionCount: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Compound unique index: One record per card per month
MonthlySpendingSchema.index({ creditCardId: 1, month: 1 }, { unique: true });
MonthlySpendingSchema.index({ userId: 1, month: 1 });

export const MonthlySpending = mongoose.model<IMonthlySpending>("MonthlySpending", MonthlySpendingSchema);
