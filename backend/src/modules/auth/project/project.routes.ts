import { Router } from "express";
import { createNewProject, listProjects, updateProjectById, deleteProjectById } from "./project.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createNewProject);
router.get("/", authMiddleware, listProjects);
router.patch("/:projectId", authMiddleware, updateProjectById);
router.delete("/:projectId", authMiddleware, deleteProjectById);

export default router;
