const express = require("express");
const router = express.Router();

const adminOverviewController = require("../controllers/adminOverviewController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken, loadRoleName, requireRole("Admin"));

router.get("/members-overview", adminOverviewController.getMembersOverview);

module.exports = router;