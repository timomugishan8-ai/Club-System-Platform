const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const resourceController = require("../controllers/resourceController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 }
});

router.use(verifyToken);

router.get("/", resourceController.list);
router.get("/:id", resourceController.getById);

router.post(
    "/",
    loadRoleName,
    requireRole("Admin", "Leader"),
    upload.single("file"),
    resourceController.create
);
router.put("/:id", loadRoleName, requireRole("Admin", "Leader"), resourceController.update);
router.delete("/:id", loadRoleName, requireRole("Admin", "Leader"), resourceController.remove);

module.exports = router;