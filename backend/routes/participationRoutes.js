const express = require("express");
const router = express.Router();

const participationController = require("../controllers/participationController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/types", participationController.listTypes);
router.get("/me", participationController.getByMember);
router.get("/me/points", participationController.getMyPoints);
router.get("/meeting/:meetingId", participationController.getByMeeting);
router.get("/member/:memberId", participationController.getByMember);

router.post("/", loadRoleName, requireRole("Admin", "Leader"), participationController.record);
router.put("/:id", loadRoleName, requireRole("Admin", "Leader"), participationController.update);
router.delete("/:id", loadRoleName, requireRole("Admin", "Leader"), participationController.remove);

module.exports = router;