const db = require("../config/db");

// One aggregated row per approved member: profile + points + github + attendance + badges
const sql = `
    SELECT
        m.member_id,
        m.first_name,
        m.last_name,
        m.email,
        m.phone,
        m.course,
        m.year_of_study,
        m.student_number,
        m.github_handle,
        m.avatar_url,
        m.bio,
        m.join_date,
        m.approval_status,
        m.is_active,
        m.committee_id,
        COALESCE(r.role_name, 'Member') AS role_name,
        COALESCE(c.committee_name, 'Unassigned') AS committee,
        COALESCE(SUM(pts.points), 0) AS total_points,
        COALESCE(MAX(gc.commit_count), 0) AS commit_count,
        COALESCE(MAX(gc.pr_count), 0) AS pr_count,
        COALESCE(MAX(gc.issue_count), 0) AS issue_count,
        COALESCE(MAX(gc.repo_count), 0) AS repo_count,
        COALESCE(MAX(gc.star_count), 0) AS star_count,
        -- Stars are recognition from others, not effort: capped at 50 so a
        -- linked famous repo can't flood the score
        COALESCE(MAX(gc.commit_count), 0) + COALESCE(MAX(gc.pr_count), 0) + COALESCE(MAX(gc.issue_count), 0)
            + COALESCE(MAX(gc.repo_count), 0) + LEAST(COALESCE(MAX(gc.star_count), 0), 50) AS github_score,
        COUNT(DISTINCT a.attendance_id) AS meetings_attended,
        COALESCE(ROUND(SUM(a.status IN ('Present', 'Late')) / NULLIF(COUNT(DISTINCT a.attendance_id), 0) * 100, 1), 0) AS attendance_rate,
        SUM(a.status = 'Present') AS present_count,
        SUM(a.status = 'Late') AS late_count,
        SUM(a.status = 'Absent') AS absent_count,
        (SELECT COUNT(*) FROM member_badges mb WHERE mb.member_id = m.member_id) AS badges_earned
    FROM members m
    LEFT JOIN roles r ON m.role_id = r.role_id
    LEFT JOIN committees c ON m.committee_id = c.committee_id
    LEFT JOIN participation pts ON pts.member_id = m.member_id
    LEFT JOIN github_contributions gc ON gc.member_id = m.member_id
    LEFT JOIN attendance a ON a.member_id = m.member_id
    WHERE m.approval_status = 'Approved' AND m.is_active = TRUE AND m.role_id != 1
    GROUP BY m.member_id
    ORDER BY total_points DESC
`;

const getMembersOverview = (req, res) => {
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ message: "Failed to load members overview." });
        res.json({ members: rows });
    });
};

// What THIS admin has personally done on the platform — the admin-side
// counterpart of member stats. All counts come from "approved_by",
// "reviewed_by", "awarded_by" columns, so no new tables are needed.
const getMyOversight = (req, res) => {
    const adminId = req.user.id;
    db.query(
        `SELECT
            (SELECT COUNT(*) FROM members WHERE approved_by = ? AND approval_status = 'Approved') AS approved_members,
            (SELECT COUNT(*) FROM members WHERE approved_by = ? AND approval_status = 'Rejected') AS rejected_members,
            (SELECT COUNT(*) FROM articles WHERE reviewed_by = ? AND status = 'Published') AS articles_published,
            (SELECT COUNT(*) FROM articles WHERE reviewed_by = ? AND status = 'Rejected') AS articles_rejected,
            (SELECT COUNT(*) FROM point_adjustments WHERE awarded_by = ?) AS point_adjustments,
            (SELECT COUNT(*) FROM members WHERE approved_by = ?) AS total_decisions
        `,
        [adminId, adminId, adminId, adminId, adminId, adminId],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Failed to load oversight stats." });
            res.json({ oversight: rows[0] });
        }
    );
};

module.exports = { getMembersOverview, getMyOversight };