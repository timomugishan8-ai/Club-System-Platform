const db = require("../config/db");
const PointAdjustment = require("../models/PointAdjustment");

const TIERS = [
    { key: "tier_diamond_min",     name: "Diamond",     color: "#06B6D4" },
    { key: "tier_gold_min",        name: "Gold",        color: "#F59E0B" },
    { key: "tier_silver_min",      name: "Silver",      color: "#9CA3AF" },
    { key: "tier_bronze_min",       name: "Bronze",       color: "#92400E" },
    { key: "tier_rising_star_min", name: "Rising Star", color: "#14B8A6" },
    { key: "tier_rookie_min",      name: "Rookie",      color: "#6B7280" }
];

const assignTier = (score, cfg) => {
    for (const t of TIERS) {
        const threshold = parseInt(cfg[t.key], 10);
        if (!isNaN(threshold) && score >= threshold) {
            return t.name;
        }
    }
    return "Rookie";
};

const getLeaderboard = (req, res) => {
    const sql = `
        SELECT
            m.member_id,
            m.first_name,
            m.last_name,
            m.avatar_url,
            m.github_handle,
            COALESCE(SUM(p.points), 0) AS total_points,
            COALESCE(MAX(gc.commit_count), 0)
                + COALESCE(MAX(gc.pr_count), 0)
                + COALESCE(MAX(gc.issue_count), 0)
                + COALESCE(MAX(gc.repo_count), 0)
                + COALESCE(MAX(gc.star_count), 0) AS github_score,
            CASE
                WHEN COUNT(a.attendance_id) = 0 THEN 0
                ELSE ROUND(
                    SUM(a.status = 'Present' OR a.status = 'Late')
                    / COUNT(a.attendance_id) * 100, 1
                )
            END AS attendance_rate
        FROM members m
        LEFT JOIN participation p ON m.member_id = p.member_id
        LEFT JOIN attendance a ON m.member_id = a.member_id
        LEFT JOIN github_contributions gc ON m.member_id = gc.member_id
        WHERE m.approval_status = 'Approved'
            AND m.is_active = TRUE
            AND m.role_id != 1
        GROUP BY m.member_id
        ORDER BY total_points DESC, github_score DESC, attendance_rate DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load leaderboard." });

        const settingKeys = [
            ...TIERS.map((t) => t.key),
            "github_weight", "attendance_weight"
        ];
        db.query(
            `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (${settingKeys.map(() => "?").join(",")})`,
            settingKeys,
            (err, settings) => {
                if (err) return res.status(500).json({ message: "Failed to load tier config." });

                const cfg = {};
                settings.forEach((s) => { cfg[s.setting_key] = s.setting_value; });
                const githubWeight = parseFloat(cfg.github_weight) || 1;
                const attendanceWeight = parseFloat(cfg.attendance_weight) || 0;

                const ranked = results.map((row, index) => {
                    const githubPoints = Math.round(row.github_score * githubWeight);
                    const attendancePoints = Math.round((row.attendance_rate / 100) * attendanceWeight);
                    const progressScore = row.total_points + githubPoints + attendancePoints;

                    return {
                        rank: index + 1,
                        member_id: row.member_id,
                        first_name: row.first_name,
                        last_name: row.last_name,
                        avatar_url: row.avatar_url,
                        github_handle: row.github_handle,
                        total_points: row.total_points,
                        github_score: row.github_score,
                        attendance_rate: row.attendance_rate,
                        github_points: githubPoints,
                        attendance_points: attendancePoints,
                        progress_score: progressScore,
                        tier: assignTier(progressScore, cfg)
                    };
                });

                const tiers = {};
                TIERS.forEach((t) => {
                    tiers[t.name] = parseInt(cfg[t.key], 10) || 0;
                });

                res.json({ leaderboard: ranked, tiers });
            }
        );
    });
};

const getMyProgress = (req, res) => {
    const memberId = req.user.id;

    const sql = `
        SELECT
            m.member_id, m.first_name, m.last_name,
            COALESCE(SUM(p.points), 0) AS total_points,
            (SELECT COALESCE(SUM(commit_count + pr_count + issue_count + repo_count + star_count), 0)
             FROM github_contributions WHERE member_id = m.member_id) AS github_score,
            CASE
                WHEN (SELECT COUNT(*) FROM attendance WHERE member_id = m.member_id) = 0 THEN 0
                ELSE ROUND(
                    (SELECT SUM(status = 'Present' OR status = 'Late')
                     FROM attendance WHERE member_id = m.member_id)
                    / (SELECT COUNT(*) FROM attendance WHERE member_id = m.member_id) * 100, 1
                )
            END AS attendance_rate,
            (SELECT COUNT(*) FROM member_badges WHERE member_id = m.member_id) AS badges_earned
        FROM members m
        LEFT JOIN participation p ON m.member_id = p.member_id
        WHERE m.member_id = ?
        GROUP BY m.member_id
    `;

    db.query(sql, [memberId], (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load progress." });
        if (results.length === 0) return res.status(404).json({ message: "Member not found." });

        const row = results[0];
        const settingKeys = [
            ...TIERS.map((t) => t.key),
            "github_weight", "attendance_weight"
        ];
        db.query(
            `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (${settingKeys.map(() => "?").join(",")})`,
            settingKeys,
            (err, settings) => {
                if (err) return res.status(500).json({ message: "Failed to load tier config." });

                const cfg = {};
                settings.forEach((s) => { cfg[s.setting_key] = s.setting_value; });
                const githubWeight = parseFloat(cfg.github_weight) || 1;
                const attendanceWeight = parseFloat(cfg.attendance_weight) || 0;
                const githubPoints = Math.round(row.github_score * githubWeight);
                const attendancePoints = Math.round((row.attendance_rate / 100) * attendanceWeight);
                const progressScore = row.total_points + githubPoints + attendancePoints;

                const tierName = assignTier(progressScore, cfg);
                const tierIndex = TIERS.findIndex((t) => t.name === tierName);
                const nextTier = tierIndex > 0 ? TIERS[tierIndex - 1].name : null;
                const nextThreshold = tierIndex > 0
                    ? (parseInt(cfg[TIERS[tierIndex - 1].key], 10) || 0)
                    : null;
                const pointsToNext = nextThreshold != null
                    ? Math.max(0, nextThreshold - progressScore)
                    : 0;

                PointAdjustment.getMemberPillarPoints(memberId, (err, pillarRows) => {
                    const pillarPoints = {};
                    [
                        "Attendance & Participation",
                        "Technical Skills",
                        "Projects & GitHub",
                        "Community Contribution",
                        "Professional Growth"
                    ].forEach((p) => { pillarPoints[p] = 0; });
                    (pillarRows || []).forEach((p) => {
                        pillarPoints[p.pillar] = p.pillar_points;
                    });

                    res.json({
                        progress: {
                            ...row,
                            github_points: githubPoints,
                            attendance_points: attendancePoints,
                            progress_score: progressScore,
                            tier: tierName,
                            next_tier: nextTier,
                            points_to_next: pointsToNext,
                            pillar_points: pillarPoints
                        }
                    });
                });
            }
        );
    });
};

const getDashboardStats = (req, res) => {
    const queries = {
        memberCount: "SELECT COUNT(*) AS n FROM members WHERE approval_status = 'Approved' AND is_active = TRUE AND role_id != 1",
        meetingCount: "SELECT COUNT(*) AS n FROM meetings WHERE meeting_date >= DATE_SUB(CURDATE(), INTERVAL 4 MONTH)",
        projectCount: "SELECT COUNT(*) AS n FROM projects WHERE status = 'Completed'",
        myPoints: "SELECT COALESCE(SUM(points), 0) AS n FROM participation WHERE member_id = ?",
        upcomingEvents: `
            SELECT event_id, title, event_type, venue, event_date, start_time
            FROM events WHERE event_date >= CURDATE()
            ORDER BY event_date ASC LIMIT 5
        `,
        recentAnnouncements: `
            SELECT announcement_id, title, body, category, created_at
            FROM announcements
            WHERE (expires_at IS NULL OR expires_at > NOW())
            ORDER BY is_pinned DESC, created_at DESC LIMIT 5
        `
    };

    const stats = {};
    let pending = 6;
    const done = () => {
        pending--;
        if (pending === 0) res.json({ dashboard: stats });
    };

    db.query(queries.memberCount, (err, r) => {
        stats.chapter_members = (r && r[0]) ? r[0].n : 0;
        done();
    });
    db.query(queries.meetingCount, (err, r) => {
        stats.workshops_held = (r && r[0]) ? r[0].n : 0;
        done();
    });
    db.query(queries.projectCount, (err, r) => {
        stats.projects_completed = (r && r[0]) ? r[0].n : 0;
        done();
    });
    db.query(queries.myPoints, [req.user.id], (err, r) => {
        stats.my_points = (r && r[0]) ? r[0].n : 0;
        done();
    });
    db.query(queries.upcomingEvents, (err, r) => {
        stats.upcoming_events = r || [];
        done();
    });
    db.query(queries.recentAnnouncements, (err, r) => {
        stats.recent_announcements = r || [];
        done();
    });
};

module.exports = { getLeaderboard, getMyProgress, getDashboardStats };