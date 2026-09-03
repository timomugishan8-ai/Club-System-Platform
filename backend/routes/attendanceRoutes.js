const express = require("express");
const router = express.Router();

const attendanceController = require("../controllers/attendanceController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/me", attendanceController.getByMember);
router.get("/me/stats", attendanceController.getMyStats);
router.get("/meeting/:meetingId", attendanceController.getByMeeting);
router.get("/member/:memberId", attendanceController.getByMember);
router.get("/all", loadRoleName, requireRole("Admin", "Leader"), attendanceController.getAllRecords);

router.post("/", loadRoleName, requireRole("Admin", "Leader"), attendanceController.record);
router.post("/meeting/:meetingId/bulk", loadRoleName, requireRole("Admin", "Leader"), attendanceController.bulkRecord);
router.put("/:id", loadRoleName, requireRole("Admin", "Leader"), attendanceController.update);
router.delete("/:id", loadRoleName, requireRole("Admin", "Leader"), attendanceController.remove);

module.exports = router;