const express = require("express");
const router = express.Router();

const committeeController = require("../controllers/committeeController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

// Any signed-in member may list committees (used for dropdowns/profile display).
router.get("/", verifyToken, loadRoleName, committeeController.list);

// Adding committees is an admin function.
router.post("/", verifyToken, loadRoleName, requireRole("Admin"), committeeController.create);

module.exports = router;