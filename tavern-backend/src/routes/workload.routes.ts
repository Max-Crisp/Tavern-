// src/routes/workload.routes.ts
import { Router } from "express";
import {
  verifyToken,
  authorizeRole,
} from "../middleware/auth.middleware";
import { getMyWorkload } from "../controllers/workload.controller";

const router = Router();

// Adventurer checks their workload
router.get(
  "/adventurers/me/workload",
  verifyToken,
  authorizeRole("ADVENTURER"),
  getMyWorkload
);

export default router;
