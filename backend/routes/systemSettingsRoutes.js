const express = require("express");
const router = express.Router();

const systemSettingsController = require("../controllers/systemSettingsController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken, loadRoleName, requireRole("Admin"));

router.get("/", systemSettingsController.getSettings);
router.put("/", systemSettingsController.updateSettings);

module.exports = router;