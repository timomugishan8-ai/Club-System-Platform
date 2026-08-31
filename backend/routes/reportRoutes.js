const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken, loadRoleName, requireRole("Admin"));

router.get("/semester", reportController.getSemesterReport);
router.get("/semester/members.csv", reportController.exportMembersCsv);

module.exports = router;