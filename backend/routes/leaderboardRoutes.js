const express = require("express");
const router = express.Router();

const leaderboardController = require("../controllers/leaderboardController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/", leaderboardController.getLeaderboard);
router.get("/me/progress", leaderboardController.getMyProgress);
router.get("/me/dashboard", leaderboardController.getDashboardStats);
router.get(
    "/admin/dashboard",
    loadRoleName,
    requireRole("Admin"),
    leaderboardController.getAdminDashboard
);
router.get(
    "/member/:memberId/progress",
    loadRoleName,
    requireRole("Admin", "Leader"),
    leaderboardController.getMemberProgress
);

module.exports = router;