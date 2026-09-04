const express = require("express");
const router = express.Router();

const memberController = require("../controllers/memberController");
const avatarController = require("../controllers/avatarController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName } = require("../middleware/roleMiddleware");

router.use(verifyToken);

router.get("/", memberController.list);
router.get("/me", memberController.getMe);
router.get("/me/avatar", loadRoleName, avatarController.getAvatar);
router.post("/me/avatar", loadRoleName, avatarController.upload.single("avatar"), avatarController.uploadAvatar);
router.delete("/me/avatar", loadRoleName, avatarController.removeAvatar);
router.get("/:id", memberController.getById);
router.put("/:id", memberController.updateProfile);
router.put("/me/password", memberController.changePassword);

module.exports = router;