const Announcement = require("../models/Announcement");
const { notifyAllMembers } = require("../services/notificationService");

const list = (req, res) => {
    Announcement.findAll((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load announcements." });
        res.json({ announcements: results });
    });
};

const recent = (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 5;
    Announcement.findRecent(limit, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load announcements." });
        res.json({ announcements: results });
    });
};

const getById = (req, res) => {
    Announcement.findById(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load announcement." });
        if (results.length === 0) return res.status(404).json({ message: "Announcement not found." });
        res.json({ announcement: results[0] });
    });
};

const create = (req, res) => {
    const { title, body, category, is_pinned, expires_at } = req.body;

    if (!title || !body) {
        return res.status(400).json({ message: "title and body are required." });
    }

    Announcement.create({
        title, body, category, is_pinned, expires_at,
        created_by: req.user.id
    }, (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to create announcement." });

        notifyAllMembers(
            "announcement",
            `New Announcement: ${title}`,
            body
        );

        res.status(201).json({
            message: "Announcement created.",
            announcement_id: result.insertId
        });
    });
};

const update = (req, res) => {
    const { title, body, category, is_pinned, expires_at } = req.body;

    if (!title || !body) {
        return res.status(400).json({ message: "title and body are required." });
    }

    Announcement.update(req.params.id, {
        title, body, category, is_pinned, expires_at
    }, (err) => {
        if (err) return res.status(500).json({ message: "Failed to update announcement." });
        res.json({ message: "Announcement updated." });
    });
};

const remove = (req, res) => {
    Announcement.delete(req.params.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete announcement." });
        res.json({ message: "Announcement deleted." });
    });
};

module.exports = { list, recent, getById, create, update, remove };