import { Router } from "express";
import {
    register,
    login,
    logout,
    registerValidation,
    loginValidation,
    requestReset,
    reset,
    forgotPasswordValidation,
    resetPasswordValidation
} from "./auth.controller";
import { authRateLimiter } from "../../middleware/rate-limiter.middleware";

const router = Router();

// Apply strict rate limiting + input validation to prevent brute force attacks
router.post("/register", authRateLimiter, registerValidation, register);
router.post("/login", authRateLimiter, loginValidation, login);
router.post("/logout", logout);

// Password Reset Flow
router.post("/forgot-password", authRateLimiter, forgotPasswordValidation, requestReset);
router.post("/reset-password", authRateLimiter, resetPasswordValidation, reset);

export default router;
