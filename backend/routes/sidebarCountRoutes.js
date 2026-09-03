const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName } = require("../middleware/roleMiddleware");

const countQuery = (sql, params) =>
    new Promise((resolve, reject) => {
        db.query(sql, params || [], (err, results) => {
            if (err) return reject(err);
            const row = Array.isArray(results) ? results[0] : results;
            resolve(row ? Number(Object.values(row)[0]) : 0);
        });
    });

// GET /api/sidebar-counts
// Per-section badge counts for the sidebar.
// Members see counts of content newer than their account (meetings,
// announcements, events). Admins/Leaders additionally get actionable
// queue sizes (pending approvals, articles to review, member roster size).
router.get("/", verifyToken, loadRoleName, async (req, res) => {
    try {
        const memberId = req.user.id;

        const memberRows = await new Promise((resolve, reject) => {
            db.query(
                "SELECT created_at FROM members WHERE member_id = ?",
                [memberId],
                (err, results) => {
                    if (err) return reject(err);
                    if (results.length === 0) return reject(new Error("member_not_found"));
                    resolve(results);
                }
            );
        });

        const since = memberRows[0].created_at;

        // Announcements & articles have created_at; meetings/events/projects
        // do not, so count their full list instead.
        const [newAnnouncements, newEvents] = await Promise.all([
            countQuery(
                "SELECT COUNT(*) AS c FROM announcements WHERE created_at > ? AND created_by <> ?",
                [since, memberId]
            ),
            countQuery("SELECT COUNT(*) AS c FROM events"),
        ]);

        const counts = {
            meetings: 0,
            announcements: newAnnouncements,
            events: newEvents,
        };

        if (req.user.role_name === "Admin") {
            const [pendingApprovals, reviewArticles, newMembers, activeProjects] =
                await Promise.all([
                    countQuery(
                        "SELECT COUNT(*) AS c FROM members WHERE approval_status = 'Pending'"
                    ),
                    countQuery(
                        "SELECT COUNT(*) AS c FROM articles WHERE status = 'Submitted'"
                    ),
                    countQuery(
                        "SELECT COUNT(*) AS c FROM members WHERE approval_status = 'Approved' AND member_id <> ?",
                        [memberId]
                    ),
                    countQuery(
                        "SELECT COUNT(*) AS c FROM projects WHERE status IN ('Planning','In Progress')"
                    ),
                ]);

            counts.pending = pendingApprovals;
            counts["admin/articles"] = reviewArticles;
            counts["admin/members"] = newMembers;
            counts.projects = activeProjects;
        } else if (req.user.role_name === "Leader") {
            counts["admin/articles"] = await countQuery(
                "SELECT COUNT(*) AS c FROM articles WHERE status = 'Submitted'"
            );
        }

        res.json({ counts });
    } catch (err) {
        if (err.message === "member_not_found") {
            return res.status(403).json({ message: "Forbidden: member not found." });
        }
        console.error("sidebar-counts error:", err);
        res.status(500).json({ message: "Failed to load counts." });
    }
});

module.exports = router;