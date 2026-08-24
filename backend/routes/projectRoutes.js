const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/", projectController.list);
router.get("/mine", projectController.getMine);
router.get("/:id", projectController.getById);
router.get("/:id/members", projectController.getMembers);

router.post("/", loadRoleName, requireRole("Admin", "Leader", "Member"), projectController.create);
router.post("/:id/members", loadRoleName, requireRole("Admin", "Leader"), projectController.addMember);
router.delete("/:id/members/:memberId", loadRoleName, requireRole("Admin", "Leader"), projectController.removeMember);
router.put("/:id", loadRoleName, requireRole("Admin", "Leader"), projectController.update);
router.delete("/:id", loadRoleName, requireRole("Admin", "Leader"), projectController.remove);

module.exports = router;