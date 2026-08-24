const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/", eventController.list);
router.get("/upcoming", eventController.upcoming);
router.get("/:id", eventController.getById);
router.get("/:id/registrations", loadRoleName, requireRole("Admin", "Leader"), eventController.getRegistrations);

router.post("/", loadRoleName, requireRole("Admin", "Leader"), eventController.create);
router.post("/:id/register", eventController.register);
router.post("/:id/unregister", eventController.unregister);
router.put("/:id", loadRoleName, requireRole("Admin", "Leader"), eventController.update);
router.delete("/:id", loadRoleName, requireRole("Admin", "Leader"), eventController.remove);

module.exports = router;