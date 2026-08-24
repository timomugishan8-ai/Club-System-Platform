const express = require("express");
const router = express.Router();

const meetingController = require("../controllers/meetingController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/", meetingController.list);
router.get("/upcoming", meetingController.upcoming);
router.get("/:id", meetingController.getById);

router.post("/", loadRoleName, requireRole("Admin", "Leader"), meetingController.create);
router.put("/:id", loadRoleName, requireRole("Admin", "Leader"), meetingController.update);
router.delete("/:id", loadRoleName, requireRole("Admin", "Leader"), meetingController.remove);

module.exports = router;