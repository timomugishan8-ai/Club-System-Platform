const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const articleController = require("../controllers/articleController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName, requireRole } = require("../middleware/roleMiddleware");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "articles");
const IMAGE_DIR = path.join(UPLOAD_DIR, "covers");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "cover") {
            cb(null, IMAGE_DIR);
        } else {
            cb(null, UPLOAD_DIR);
        }
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === "cover") {
        const ok = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
        cb(ok ? null : new Error("Cover must be an image"), ok);
    } else {
        const ok = /\.(pdf|docx?|md|txt)$/i.test(file.originalname);
        cb(ok ? null : new Error("Article must be PDF, DOCX, DOC, MD, or TXT"), ok);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.use(verifyToken);

// Published feed (all members)
router.get("/", articleController.listPublished);
router.get("/mine", articleController.listMine);
router.get("/:id", articleController.getById);

// Create (file + cover upload) — Members and Leaders only. The admin is a
// neutral reviewer: they review submitted drafts but never create articles.
router.post(
    "/",
    loadRoleName,
    requireRole("Member", "Leader"),
    upload.fields([{ name: "file" }, { name: "cover" }]),
    articleController.create
);

// Update / submit / delete (author only)
router.put("/:id", articleController.update);
router.post("/:id/submit", articleController.submit);
router.delete("/:id", articleController.remove);

// Like
router.post("/:id/like", articleController.toggleLike);

// Comments
router.get("/:id/comments", articleController.getComments);
router.post("/:id/comments", articleController.addComment);
router.delete("/:id/comments/:commentId", articleController.deleteComment);

// Review queue (Admin/Leader)
router.get(
    "/review/submitted",
    loadRoleName,
    requireRole("Admin", "Leader"),
    articleController.listSubmitted
);
router.post(
    "/:id/review",
    loadRoleName,
    requireRole("Admin", "Leader"),
    articleController.review
);

module.exports = router;