/**
 * Email Metadata Model
 * 
 * Stores minimal metadata about processed emails (NOT full email body).
 * Used for tracking which emails have been processed.
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IEmailMetadata extends Document {
  userId: mongoose.Types.ObjectId;
  messageId: string; // Unique email identifier from Gmail/Outlook
  subject: string;
  from: string; // Sender email address
  receivedDate: Date;
  processedAt: Date;
  parsedSuccessfully: boolean;
  bankName?: string; // Identified bank
  transactionId?: mongoose.Types.ObjectId; // Link to created transaction
  errorMessage?: string; // If parsing failed
  body?: string; // Email body (text + OCR extracted text)
  snippet?: string; // Gmail snippet for quick preview
}

const EmailMetadataSchema = new Schema<IEmailMetadata>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    messageId: { 
      type: String, 
      required: true, 
      unique: true, // Prevent duplicate processing
      index: true 
    },
    subject: { type: String, required: true },
    from: { type: String, required: true },
    receivedDate: { type: Date, required: true },
    processedAt: { type: Date, default: Date.now },
    parsedSuccessfully: { type: Boolean, default: false },
    bankName: { type: String },
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    errorMessage: { type: String },
    body: { type: String }, // Email body (includes OCR text from images)
    snippet: { type: String } // Gmail snippet
  },
  { timestamps: true }
);

// Compound index for efficient queries
EmailMetadataSchema.index({ userId: 1, receivedDate: -1 });
EmailMetadataSchema.index({ userId: 1, parsedSuccessfully: 1 });

export const EmailMetadata = mongoose.model<IEmailMetadata>("EmailMetadata", EmailMetadataSchema);
