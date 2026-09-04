const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken, loadRoleName, requireRole("Admin"));

router.get("/pending", adminController.listPending);
router.post("/pending/:id/approve", adminController.approve);
router.post("/pending/:id/reject", adminController.reject);
router.put("/members/:id/role", adminController.setRole);
router.delete("/members/:id", adminController.removeMember);

module.exports = router;