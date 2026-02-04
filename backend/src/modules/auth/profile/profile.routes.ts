import { Router } from "express";
import { updateUserProfile, updateUserSettings, changeUserPassword, uploadAvatar, testEmail } from "./profile.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { upload } from "../../../middleware/upload.middleware";

const router = Router();

router.patch("/", authMiddleware, updateUserProfile);
router.patch("/settings", authMiddleware, updateUserSettings);
router.post("/change-password", authMiddleware, changeUserPassword);
router.post("/avatar", authMiddleware, upload.single("avatar"), uploadAvatar);
router.post("/test-email", authMiddleware, testEmail);

export default router;
