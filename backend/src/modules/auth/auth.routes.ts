import { Router } from "express";
import { register, login, logout, registerValidation, loginValidation } from "./auth.controller";
import { authRateLimiter } from "../../middleware/rate-limiter.middleware";

const router = Router();

// Apply strict rate limiting + input validation to prevent brute force attacks
router.post("/register", authRateLimiter, registerValidation, register);
router.post("/login", authRateLimiter, loginValidation, login);
router.post("/logout", logout);

export default router;
