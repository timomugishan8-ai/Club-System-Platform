const express = require("express");
const router = express.Router();

const badgeController = require("../controllers/badgeController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", badgeController.getAllBadges);
router.get("/me", badgeController.getMyBadges);
router.get("/me/count", badgeController.getMyBadgeCount);
router.get("/member/:memberId", badgeController.getMemberBadges);

module.exports = router;