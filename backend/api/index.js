"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("../src/app");
const db_1 = require("../src/config/db");
// Initialize database connection
let isConnected = false;
const initDB = async () => {
    if (!isConnected) {
        await (0, db_1.connectDB)();
        isConnected = true;
    }
};
// Vercel serverless function handler
exports.default = async (req, res) => {
    await initDB();
    return (0, app_1.app)(req, res);
};
