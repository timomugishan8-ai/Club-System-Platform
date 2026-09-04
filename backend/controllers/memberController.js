const Member = require("../models/Member");

const list = (req, res) => {
    Member.findAll((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load members." });
        res.json({ members: results });
    });
};

const getMe = (req, res) => {
    Member.findById(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load profile." });
        if (results.length === 0) return res.status(404).json({ message: "Member not found." });
        res.json({ member: results[0] });
    });
};

const getById = (req, res) => {
    Member.findById(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load member." });
        if (results.length === 0) return res.status(404).json({ message: "Member not found." });
        res.json({ member: results[0] });
    });
};

const updateProfile = (req, res) => {
    const memberId = req.params.id === "me" ? req.user.id : req.params.id;

    if (req.params.id !== "me" && req.user.role_name !== "Admin") {
        return res.status(403).json({ message: "You can only update your own profile." });
    }

    const data = req.body;

    // Committee assignment is an admin decision — strip it from self-updates
    // (admins go through the same endpoint but bypass this via the role check).
    if (data.committee_id !== undefined && req.user.role_name !== "Admin") {
        return res.status(403).json({ message: "Only admins can assign committees." });
    }

    // Accept either a bare handle ("octocat", "@octocat") or a full profile
    // URL ("https://github.com/octocat") and store the normalized handle.
    // GitHub handles: alphanumerics + single hyphens, max 39 chars.
    if (data.github_handle !== undefined) {
        let raw = String(data.github_handle ?? "").trim();
        if (raw) {
            raw = raw.replace(/^@/, "");
            const urlMatch = raw.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/?#\s]+)/i);
            if (urlMatch) {
                raw = urlMatch[1];
            }
            if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(raw)) {
                return res.status(400).json({
                    message: "Invalid GitHub handle. Enter a handle (e.g. octocat) or your profile URL (e.g. https://github.com/octocat)."
                });
            }
            raw = raw.toLowerCase();
        } else {
            raw = null; // clearing the handle
        }
        data.github_handle = raw;
    }

    Member.updateProfile(memberId, data, (err) => {
        if (err) return res.status(500).json({ message: "Profile update failed." });
        res.json({ message: "Profile updated." });
    });
};

const changePassword = async (req, res) => {
    const bcrypt = require("bcrypt");
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return res.status(400).json({ message: "current_password and new_password are required." });
    }

    Member.findById(req.user.id, async (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ message: "Failed to verify member." });
        }

        const member = results[0];
        const valid = await bcrypt.compare(current_password, member.password_hash);
        if (!valid) {
            return res.status(401).json({ message: "Current password is incorrect." });
        }

        const hash = await bcrypt.hash(new_password, 10);
        Member.updatePassword(req.user.id, hash, (err) => {
            if (err) return res.status(500).json({ message: "Password change failed." });
            res.json({ message: "Password changed." });
        });
    });
};

// Legacy single delete is intentionally not exposed — member deletion goes
// through the guarded admin flow (DELETE /api/admin/members/:id), which
// reassigns owned content and cleans up files before removing the row.

module.exports = { list, getMe, getById, updateProfile, changePassword };