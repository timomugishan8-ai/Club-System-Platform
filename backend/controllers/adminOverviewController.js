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
        COALESCE(r.role_name, 'Member') AS role_name,
        COALESCE(c.committee_name, 'Unassigned') AS committee,
        COALESCE(SUM(pts.points), 0) AS total_points,
        COALESCE(MAX(gc.commit_count), 0) AS commits,
        COALESCE(MAX(gc.pr_count), 0) AS prs,
        COALESCE(MAX(gc.issue_count), 0) AS issues,
        COALESCE(MAX(gc.repo_count), 0) AS repos,
        COALESCE(MAX(gc.star_count), 0) AS stars,
        COALESCE(MAX(gc.commit_count), 0) + COALESCE(MAX(gc.pr_count), 0) + COALESCE(MAX(gc.issue_count), 0)
            + COALESCE(MAX(gc.repo_count), 0) + COALESCE(MAX(gc.star_count), 0) AS github_score,
        COUNT(DISTINCT a.attendance_id) AS meetings_attended,
        COALESCE(ROUND(SUM(a.status IN ('Present', 'Late')) / NULLIF(COUNT(DISTINCT a.attendance_id), 0) * 100, 1), 0) AS attendance_rate,
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

module.exports = { getMembersOverview };