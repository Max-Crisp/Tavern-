// src/controllers/workload.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Quest } from "../models/quest.model";

// statuses that count as “active work”
const ACTIVE_STATUSES: string[] = ["Accepted"]; // adjust if you add "InProgress"
const MAX_ACTIVE_QUESTS = 3;

export const getMyWorkload = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const activeCount = await Quest.countDocuments({
      adventurerId: req.userId,
      status: { $in: ACTIVE_STATUSES },
    });

    let status: "OK" | "WARNING" | "BLOCKED" = "OK";
    let message = "Workload is manageable.";

    if (activeCount >= MAX_ACTIVE_QUESTS) {
      status = "BLOCKED";
      message = "You have too many active quests. Complete some before taking new ones.";
    } else if (activeCount === MAX_ACTIVE_QUESTS - 1) {
      status = "WARNING";
      message = "You are close to your maximum active quests. Be cautious.";
    }

    return res.json({
      success: true,
      activeCount,
      maxActive: MAX_ACTIVE_QUESTS,
      status,
      message,
    });
  } catch (err) {
    next(err);
  }
};

// Middleware to enforce the limit when accepting a quest
export const enforceWorkloadLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const activeCount = await Quest.countDocuments({
      adventurerId: req.userId,
      status: { $in: ACTIVE_STATUSES },
    });

    if (activeCount >= MAX_ACTIVE_QUESTS) {
      return res.status(400).json({
        success: false,
        message:
          "You already have too many active quests. Complete existing ones first.",
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};
