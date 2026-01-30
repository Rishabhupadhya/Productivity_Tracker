"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const task_routes_1 = __importDefault(require("./modules/auth/task/task.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json());
exports.app.use("/api/auth", auth_routes_1.default);
exports.app.use("/api/tasks", task_routes_1.default);
exports.app.use(error_middleware_1.errorMiddleware);
