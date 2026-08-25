const db = require("../config/db");
const GitHubContribution = require("../models/GitHubContribution");
const githubService = require("../services/githubService");
const pointService = require("../services/pointService");
const badgeService = require("../services/badgeService");

const getMyGitHub = (req, res) => {
    GitHubContribution.getSummary(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load GitHub stats." });
        res.json({ stats: results[0] || null });
    });
};

const getMyActivity = (req, res) => {
    GitHubContribution.getDailyActivity(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load activity." });
        res.json({ activity: results });
    });
};

const getMemberGitHub = (req, res) => {
    GitHubContribution.getSummary(req.params.memberId, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load GitHub stats." });
        res.json({ stats: results[0] || null });
    });
};

const getMemberActivity = (req, res) => {
    GitHubContribution.getDailyActivity(req.params.memberId, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load activity." });
        res.json({ activity: results });
    });
};

const refreshMyGitHub = (req, res) => {
    db.query(
        "SELECT github_handle FROM members WHERE member_id = ?",
        [req.user.id],
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(500).json({ message: "Failed to verify member." });
            }

            const handle = results[0].github_handle;
            if (!handle) {
                return res.status(400).json({
                    message: "No GitHub handle linked. Set it in your profile settings."
                });
            }

            githubService.refreshForMember(req.user.id, handle)
                .then((stats) => {
                    pointService.awardGitHubPoints(req.user.id, stats, () => {
                        badgeService.evaluateBadges(req.user.id, () => {
                            res.json({ message: "GitHub stats refreshed.", stats });
                        });
                    });
                })
                .catch((error) => {
                    res.status(502).json({
                        message: error.message || "Failed to refresh GitHub stats."
                    });
                });
        }
    );
};

const refreshMemberGitHub = (req, res) => {
    db.query(
        "SELECT github_handle FROM members WHERE member_id = ?",
        [req.params.memberId],
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ message: "Member not found." });
            }

            const handle = results[0].github_handle;
            if (!handle) {
                return res.status(400).json({ message: "Member has no GitHub handle linked." });
            }

            githubService.refreshForMember(req.params.memberId, handle)
                .then((stats) => {
                    pointService.awardGitHubPoints(req.params.memberId, stats, () => {
                        badgeService.evaluateBadges(req.params.memberId, () => {
                            res.json({ message: "GitHub stats refreshed.", stats });
                        });
                    });
                })
                .catch((error) => {
                    res.status(502).json({
                        message: error.message || "Failed to refresh GitHub stats."
                    });
                });
        }
    );
};

module.exports = {
    getMyGitHub, getMyActivity,
    getMemberGitHub, getMemberActivity,
    refreshMyGitHub, refreshMemberGitHub
};