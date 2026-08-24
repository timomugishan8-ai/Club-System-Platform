const express = require("express");
const router = express.Router();

const memberController = require("../controllers/memberController");
const { verifyToken } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", memberController.list);
router.get("/me", memberController.getMe);
router.get("/:id", memberController.getById);
router.put("/:id", memberController.updateProfile);
router.put("/me/password", memberController.changePassword);
router.delete("/:id", memberController.remove);

module.exports = router;