const express = require("express");
const router = express.Router();

const githubController = require("../controllers/githubController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/me", githubController.getMyGitHub);
router.get("/me/activity", githubController.getMyActivity);
router.post("/me/refresh", githubController.refreshMyGitHub);

router.get("/member/:memberId", githubController.getMemberGitHub);
router.get("/member/:memberId/activity", githubController.getMemberActivity);
router.post(
    "/member/:memberId/refresh",
    loadRoleName,
    requireRole("Admin", "Leader"),
    githubController.refreshMemberGitHub
);

module.exports = router;