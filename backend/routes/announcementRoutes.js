const express = require("express");
const router = express.Router();

const announcementController = require("../controllers/announcementController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/", announcementController.list);
router.get("/recent", announcementController.recent);
router.get("/:id", announcementController.getById);

router.post("/", loadRoleName, requireRole("Admin"), announcementController.create);
router.put("/:id", loadRoleName, requireRole("Admin"), announcementController.update);
router.delete("/:id", loadRoleName, requireRole("Admin"), announcementController.remove);

module.exports = router;