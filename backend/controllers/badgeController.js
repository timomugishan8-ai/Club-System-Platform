const Badge = require("../models/Badge");

const getAllBadges = (req, res) => {
    Badge.findAll((err, badges) => {
        if (err) return res.status(500).json({ message: "Failed to load badges." });
        res.json({ badges });
    });
};

const getMyBadges = (req, res) => {
    Badge.findByMember(req.user.id, (err, badges) => {
        if (err) return res.status(500).json({ message: "Failed to load badges." });
        res.json({ badges });
    });
};

const getMemberBadges = (req, res) => {
    Badge.findByMember(req.params.memberId, (err, badges) => {
        if (err) return res.status(500).json({ message: "Failed to load badges." });
        res.json({ badges });
    });
};

const getMyBadgeCount = (req, res) => {
    Badge.countByMember(req.user.id, (err, count) => {
        if (err) return res.status(500).json({ message: "Failed to load badge count." });
        res.json({ badges_earned: count });
    });
};

module.exports = {
    getAllBadges,
    getMyBadges,
    getMemberBadges,
    getMyBadgeCount
};