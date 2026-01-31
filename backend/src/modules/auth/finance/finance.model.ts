import mongoose, { Schema, Document, Types } from "mongoose";

// Transaction Model
export interface ITransaction extends Document {
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentType: "cash" | "debit" | "credit";
  creditCardId?: Types.ObjectId;
  isRecurring: boolean;
  recurringId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    date: { type: Date, default: Date.now },
    paymentType: { 
      type: String, 
      enum: ["cash", "debit", "credit"], 
      default: "cash" 
    },
    creditCardId: { 
      type: Schema.Types.ObjectId, 
      ref: "CreditCard",
      validate: {
        validator: function(this: ITransaction, value: any) {
          // creditCardId required only if paymentType is credit
          if (this.paymentType === "credit" && !value) return false;
          return true;
        },
        message: "creditCardId is required when paymentType is credit"
      }
    },
    isRecurring: { type: Boolean, default: false },
    recurringId: { type: Schema.Types.ObjectId, ref: "RecurringTransaction" }
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ teamId: 1, date: -1 });
TransactionSchema.index({ creditCardId: 1, date: -1 });

export const Transaction = mongoose.model<ITransaction>("Transaction", TransactionSchema);

// Budget Model
export interface IBudget extends Document {
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  category: string;
  monthlyLimit: number;
  month: string; // Format: "YYYY-MM"
  spent: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    category: { type: String, required: true },
    monthlyLimit: { type: Number, required: true },
    month: { type: String, required: true },
    spent: { type: Number, default: 0 }
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>("Budget", BudgetSchema);

// Recurring Transaction Model
export interface IRecurringTransaction extends Document {
  userId: Types.ObjectId;
  teamId?: Types.ObjectId;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  dayOfMonth?: number; // For monthly transactions
  dayOfWeek?: number; // For weekly transactions (0 = Sunday)
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  lastProcessed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringTransactionSchema = new Schema<IRecurringTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team" },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String, default: "" },
    frequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"], required: true },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    lastProcessed: { type: Date }
  },
  { timestamps: true }
);

export const RecurringTransaction = mongoose.model<IRecurringTransaction>("RecurringTransaction", RecurringTransactionSchema);

// Default Categories
export const DEFAULT_CATEGORIES = {
  expense: ["Food", "Travel", "Rent", "Utilities", "Shopping", "Entertainment", "Health", "Education", "Other"],
  income: ["Salary", "Freelance", "Investment", "Gift", "Other"]
};
