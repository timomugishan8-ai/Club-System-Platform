const Notification = require("../models/Notification");

const listMine = (req, res) => {
    Notification.findByMember(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load notifications." });
        res.json({ notifications: results });
    });
};

const countUnread = (req, res) => {
    Notification.countUnread(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load notification count." });
        res.json({ unread: results[0].n });
    });
};

const markRead = (req, res) => {
    Notification.markRead(req.params.id, req.user.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to mark notification." });
        res.json({ message: "Notification marked as read." });
    });
};

const markAllRead = (req, res) => {
    Notification.markAllRead(req.user.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to mark notifications." });
        res.json({ message: "All notifications marked as read." });
    });
};

module.exports = { listMine, countUnread, markRead, markAllRead };