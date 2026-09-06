const express = require("express");
const router = express.Router();

const qrCheckInController = require("../controllers/qrCheckInController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

// Public (no auth): scan landing page previews the meeting before login
router.get("/preview/:token", qrCheckInController.previewToken);

// Authenticated members: check in with the scanned token
router.post("/check-in", verifyToken, qrCheckInController.checkIn);

// Admin/Leader: QR display screen + rotation
router.use("/meeting/:meetingId", verifyToken, loadRoleName, requireRole("Admin", "Leader"));
router.get("/meeting/:meetingId/token", qrCheckInController.getToken);
router.post("/meeting/:meetingId/rotate", qrCheckInController.rotateToken);

module.exports = router;