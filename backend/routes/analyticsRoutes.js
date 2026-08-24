const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken, loadRoleName, requireRole("Admin"));

router.get("/", analyticsController.getAnalytics);

module.exports = router;