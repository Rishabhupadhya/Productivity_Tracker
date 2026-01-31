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
exports.getProgress = exports.getReviews = exports.addReview = exports.deleteGoal = exports.updateProgress = exports.updateGoal = exports.getGoals = exports.createGoal = void 0;
const goalService = __importStar(require("./goal.service"));
const createGoal = async (req, res, next) => {
    try {
        const goal = await goalService.createGoal(req.user.id, req.body);
        res.status(201).json(goal);
    }
    catch (error) {
        next(error);
    }
};
exports.createGoal = createGoal;
const getGoals = async (req, res, next) => {
    try {
        const { status } = req.query;
        const goals = await goalService.getUserGoals(req.user.id, status);
        res.json(goals);
    }
    catch (error) {
        next(error);
    }
};
exports.getGoals = getGoals;
const updateGoal = async (req, res, next) => {
    try {
        const { goalId } = req.params;
        const goal = await goalService.updateGoal(goalId, req.user.id, req.body);
        res.json(goal);
    }
    catch (error) {
        next(error);
    }
};
exports.updateGoal = updateGoal;
const updateProgress = async (req, res, next) => {
    try {
        const { goalId } = req.params;
        const { incrementValue } = req.body;
        const goal = await goalService.updateGoalProgress(goalId, req.user.id, incrementValue);
        res.json(goal);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProgress = updateProgress;
const deleteGoal = async (req, res, next) => {
    try {
        const { goalId } = req.params;
        await goalService.deleteGoal(goalId, req.user.id);
        res.json({ message: "Goal deleted" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteGoal = deleteGoal;
const addReview = async (req, res, next) => {
    try {
        const { goalId } = req.params;
        const goal = await goalService.addGoalReview(goalId, req.user.id, req.body);
        res.json(goal);
    }
    catch (error) {
        next(error);
    }
};
exports.addReview = addReview;
const getReviews = async (req, res, next) => {
    try {
        const { goalId } = req.params;
        const reviews = await goalService.getGoalReviews(goalId, req.user.id);
        res.json(reviews);
    }
    catch (error) {
        next(error);
    }
};
exports.getReviews = getReviews;
const getProgress = async (req, res, next) => {
    try {
        const { goalId } = req.params;
        const progress = await goalService.getGoalProgress(goalId, req.user.id);
        res.json(progress);
    }
    catch (error) {
        next(error);
    }
};
exports.getProgress = getProgress;
