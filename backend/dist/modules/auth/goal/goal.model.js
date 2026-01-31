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
exports.Goal = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MilestoneSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    targetValue: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
}, { _id: false });
const GoalReviewSchema = new mongoose_1.Schema({
    date: { type: Date, default: Date.now },
    whatHelped: { type: String, default: "" },
    whatBlocked: { type: String, default: "" },
    notes: { type: String, default: "" }
}, { _id: false });
const GoalSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Team" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["financial", "time", "count", "binary"], required: true },
    status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
    targetValue: { type: Number, required: true },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, default: "" },
    startDate: { type: Date, default: Date.now },
    targetDate: { type: Date },
    completedAt: { type: Date },
    milestones: [MilestoneSchema],
    linkedHabits: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Habit" }],
    linkedFinanceCategory: { type: String },
    linkedTasks: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Task" }],
    reviews: [GoalReviewSchema]
}, { timestamps: true });
GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ teamId: 1, status: 1 });
exports.Goal = mongoose_1.default.model("Goal", GoalSchema);
