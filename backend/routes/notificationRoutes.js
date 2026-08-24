const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", notificationController.listMine);
router.get("/unread", notificationController.countUnread);
router.post("/:id/read", notificationController.markRead);
router.post("/read-all", notificationController.markAllRead);

module.exports = router;