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

const remove = (req, res) => {
    if (req.user.role_name !== "Admin") {
        return res.status(403).json({ message: "Only admins can delete members." });
    }
    Member.deleteById(req.params.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete member." });
        res.json({ message: "Member deleted." });
    });
};

module.exports = { list, getMe, getById, updateProfile, changePassword, remove };