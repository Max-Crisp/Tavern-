import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import adventurerProfileRoutes from "./adventurerProfile.routes";
import questRoutes from "./quest.routes";
import workloadRoutes from "./workload.routes";
import leaderboardRoutes from "./leaderboard.routes";


const router = Router();

router.get("/ping", (req, res) => {
  res.json({ message: "🏰 Tavern backend is alive!" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/", adventurerProfileRoutes);
router.use("/", questRoutes);
router.use("/", adventurerProfileRoutes);
router.use("/", questRoutes);
router.use("/", workloadRoutes);
router.use("/", leaderboardRoutes);


export default router;
