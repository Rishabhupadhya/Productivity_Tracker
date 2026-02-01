/**
 * Processed Email Model
 * 
 * Deduplication tracking using content hash.
 * Prevents creating duplicate transactions from:
 * - Same email processed multiple times
 * - Multiple alert emails for same transaction
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IProcessedEmail extends Document {
  userId: mongoose.Types.ObjectId;
  contentHash: string; // SHA-256 hash of (amount + date + merchant + card)
  messageId: string; // Original email message ID
  transactionId?: mongoose.Types.ObjectId; // Link to transaction if created
  processedAt: Date;
}

const ProcessedEmailSchema = new Schema<IProcessedEmail>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    contentHash: { 
      type: String, 
      required: true, 
      index: true 
    },
    messageId: { 
      type: String, 
      required: true, 
      index: true 
    },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    processedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Compound unique index for deduplication
ProcessedEmailSchema.index({ userId: 1, contentHash: 1 }, { unique: true });

export const ProcessedEmail = mongoose.model<IProcessedEmail>("ProcessedEmail", ProcessedEmailSchema);
