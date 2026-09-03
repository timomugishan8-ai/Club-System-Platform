const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/", projectController.list);
router.get("/mine", projectController.getMine);
router.get("/member/:memberId", projectController.getByMember);
router.get("/overview-by-member", projectController.getOverviewByMember);
router.get("/:id", projectController.getById);
router.get("/:id/members", projectController.getMembers);
router.get("/:id/comments", projectController.getComments);

// Admin is a neutral reviewer: cannot create/edit/delete projects — only
// Leaders and Members manage them. Admins (and Leaders) can comment.
router.post("/", loadRoleName, requireRole("Leader", "Member"), projectController.create);
router.post("/:id/comments", loadRoleName, requireRole("Admin", "Leader"), projectController.addComment);
router.post("/:id/members", loadRoleName, requireRole("Admin", "Leader"), projectController.addMember);
router.delete("/:id/members/:memberId", loadRoleName, requireRole("Admin", "Leader"), projectController.removeMember);
router.put("/:id", loadRoleName, requireRole("Admin", "Leader"), projectController.update);
router.delete("/:id", loadRoleName, requireRole("Admin", "Leader"), projectController.remove);
router.delete("/:id/comments/:commentId", loadRoleName, projectController.deleteComment);

module.exports = router;