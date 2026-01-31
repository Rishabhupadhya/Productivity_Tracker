"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Habit = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const HabitCompletionSchema = new mongoose_1.Schema({
    date: { type: Date, required: true },
    completed: { type: Boolean, default: true },
    notes: { type: String, default: "" }
}, { _id: false });
const HabitSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Team" },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    frequency: { type: String, enum: ["daily", "weekly", "custom"], required: true },
    timesPerWeek: { type: Number, min: 1, max: 7 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletedDate: { type: Date },
    graceDays: { type: Number, default: 1 },
    graceDaysUsed: { type: Number, default: 0 },
    completions: [HabitCompletionSchema],
    linkedGoals: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Goal" }],
    totalCompletions: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
HabitSchema.index({ userId: 1, isActive: 1 });
HabitSchema.index({ teamId: 1, isActive: 1 });
exports.Habit = mongoose_1.default.model("Habit", HabitSchema);
