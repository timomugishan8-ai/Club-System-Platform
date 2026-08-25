const express = require("express");
const router = express.Router();

const pointAdjustmentController = require("../controllers/pointAdjustmentController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/activities", pointAdjustmentController.getActivities);
router.get("/member/:memberId", pointAdjustmentController.getByMember);

router.post("/", loadRoleName, requireRole("Admin", "Leader"), pointAdjustmentController.create);
router.delete("/:id", loadRoleName, requireRole("Admin", "Leader"), pointAdjustmentController.remove);

module.exports = router;