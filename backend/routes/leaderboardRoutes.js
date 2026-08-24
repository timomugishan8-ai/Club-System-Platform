const express = require("express");
const router = express.Router();

const leaderboardController = require("../controllers/leaderboardController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", leaderboardController.getLeaderboard);
router.get("/me/progress", leaderboardController.getMyProgress);
router.get("/me/dashboard", leaderboardController.getDashboardStats);

module.exports = router;