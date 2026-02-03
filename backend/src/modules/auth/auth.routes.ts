import { Router } from "express";
import { register, login } from "./auth.controller";
import { authRateLimiter } from "../../middleware/rate-limiter.middleware";

const router = Router();

// Apply strict rate limiting to prevent brute force attacks
router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);

export default router;
