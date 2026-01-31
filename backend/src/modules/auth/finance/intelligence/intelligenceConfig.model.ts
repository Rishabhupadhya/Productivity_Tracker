/**
 * Intelligence Configuration Model
 * 
 * Stores user-specific thresholds and preferences for ML/intelligence features.
 * Allows per-user or per-card customization.
 */

import mongoose, { Document, Schema, Types } from "mongoose";

export interface IIntelligenceConfig extends Document {
  userId: Types.ObjectId;
  creditCardId?: Types.ObjectId;
  
  // Overspending prediction
  overspendingAlertThreshold: number;
  
  // Utilization alerts
  utilizationWarningThreshold: number;
  utilizationCriticalThreshold: number;
  
  // Anomaly detection
  anomalyZScoreThreshold: number;
  anomalySensitivity: "low" | "medium" | "high";
  
  // Analysis frequency
  profileUpdateFrequency: "realtime" | "daily" | "weekly";
  
  // Feature flags
  enableOverspendingPrediction: boolean;
  enableAnomalyDetection: boolean;
  enableProactiveAlerts: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const IntelligenceConfigSchema = new Schema<IIntelligenceConfig>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    creditCardId: { type: Schema.Types.ObjectId, ref: "CreditCard", index: true },
    
    // Defaults are production-tested values
    overspendingAlertThreshold: { type: Number, default: 0.75, min: 0, max: 1 },
    
    utilizationWarningThreshold: { type: Number, default: 50, min: 0, max: 100 },
    utilizationCriticalThreshold: { type: Number, default: 75, min: 0, max: 100 },
    
    anomalyZScoreThreshold: { type: Number, default: 2.5, min: 1, max: 5 },
    anomalySensitivity: { 
      type: String, 
      enum: ["low", "medium", "high"], 
      default: "medium" 
    },
    
    profileUpdateFrequency: { 
      type: String, 
      enum: ["realtime", "daily", "weekly"], 
      default: "daily" 
    },
    
    enableOverspendingPrediction: { type: Boolean, default: true },
    enableAnomalyDetection: { type: Boolean, default: true },
    enableProactiveAlerts: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Unique constraint: one config per user-card combo (or one global per user)
IntelligenceConfigSchema.index({ userId: 1, creditCardId: 1 }, { unique: true });

export const IntelligenceConfig = mongoose.model<IIntelligenceConfig>(
  "IntelligenceConfig",
  IntelligenceConfigSchema
);
