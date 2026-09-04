const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Member = require("../models/Member");
const { loadRoleName } = require("../middleware/roleMiddleware");

const AVATAR_DIR = path.join(__dirname, "..", "uploads", "avatars");

fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, AVATAR_DIR),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ok = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
        cb(ok ? null : new Error("Avatar must be an image (JPG, PNG, GIF, or WebP)"), ok);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Serve-safe path for the stored URL
const publicPath = (filename) => `/uploads/avatars/${filename}`;

// Delete an avatar file if it lives in our avatars dir (never touch external URLs)
const deleteOldAvatar = (avatarUrl) => {
    if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatars/")) return;
    const filename = path.basename(avatarUrl);
    const filePath = path.join(AVATAR_DIR, filename);
    if (filePath.startsWith(AVATAR_DIR)) {
        fs.unlink(filePath, () => {});
    }
};

const getAvatar = (req, res) => {
    Member.findById(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load avatar." });
        if (results.length === 0) return res.status(404).json({ message: "Member not found." });
        res.json({ avatar_url: results[0].avatar_url || null });
    });
};

const uploadAvatar = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No image provided." });
    }

    Member.findById(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to update avatar." });
        if (results.length === 0) return res.status(404).json({ message: "Member not found." });

        const oldAvatar = results[0].avatar_url;
        const avatarUrl = publicPath(req.file.filename);

        Member.updateProfile(req.user.id, { avatar_url: avatarUrl }, (err2) => {
            if (err2) {
                // Clean up the newly uploaded file if the DB write fails
                fs.unlink(req.file.path, () => {});
                return res.status(500).json({ message: "Failed to save avatar." });
            }
            deleteOldAvatar(oldAvatar);
            res.json({ message: "Profile picture updated.", avatar_url: avatarUrl });
        });
    });
};

const removeAvatar = (req, res) => {
    Member.findById(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to remove avatar." });
        if (results.length === 0) return res.status(404).json({ message: "Member not found." });

        const oldAvatar = results[0].avatar_url;
        if (!oldAvatar) return res.json({ message: "No profile picture to remove." });

        Member.updateProfile(req.user.id, { avatar_url: null }, (err2) => {
            if (err2) return res.status(500).json({ message: "Failed to remove avatar." });
            deleteOldAvatar(oldAvatar);
            res.json({ message: "Profile picture removed.", avatar_url: null });
        });
    });
};

module.exports = { getAvatar, uploadAvatar, removeAvatar, upload, loadRoleName };