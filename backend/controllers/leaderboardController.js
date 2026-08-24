const db = require("../config/db");

const getLeaderboard = (req, res) => {
    const sql = `
        SELECT
            m.member_id,
            m.first_name,
            m.last_name,
            m.avatar_url,
            m.github_handle,
            COALESCE(SUM(p.points), 0) AS total_points,
            COALESCE(gc.commit_count, 0)
                + COALESCE(gc.pr_count, 0)
                + COALESCE(gc.issue_count, 0)
                + COALESCE(gc.repo_count, 0)
                + COALESCE(gc.star_count, 0) AS github_score,
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
        GROUP BY m.member_id
        ORDER BY total_points DESC, github_score DESC, attendance_rate DESC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load leaderboard." });

        db.query(
            "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('tier_bronze_min','tier_silver_min','tier_gold_min','github_weight','attendance_weight')",
            (err, settings) => {
                if (err) return res.status(500).json({ message: "Failed to load tier config." });

                const cfg = {};
                settings.forEach((s) => { cfg[s.setting_key] = s.setting_value; });
                const githubWeight = parseFloat(cfg.github_weight) || 1;
                const bronzeMin = parseInt(cfg.tier_bronze_min, 10) || 0;
                const silverMin = parseInt(cfg.tier_silver_min, 10) || 500;
                const goldMin = parseInt(cfg.tier_gold_min, 10) || 1500;

                const ranked = results.map((row, index) => {
                    const githubPoints = Math.round(row.github_score * githubWeight);
                    const progressScore = row.total_points + githubPoints;
                    let tier = "Bronze";
                    if (progressScore >= goldMin) tier = "Gold";
                    else if (progressScore >= silverMin) tier = "Silver";

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
                        progress_score: progressScore,
                        tier
                    };
                });

                res.json({ leaderboard: ranked, tiers: { bronzeMin, silverMin, goldMin } });
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
        db.query(
            "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('tier_bronze_min','tier_silver_min','tier_gold_min','github_weight')",
            (err, settings) => {
                if (err) return res.status(500).json({ message: "Failed to load tier config." });

                const cfg = {};
                settings.forEach((s) => { cfg[s.setting_key] = s.setting_value; });
                const githubWeight = parseFloat(cfg.github_weight) || 1;
                const githubPoints = Math.round(row.github_score * githubWeight);
                const progressScore = row.total_points + githubPoints;

                let tier = "Bronze";
                let nextTier = "Silver";
                let pointsToNext = (parseInt(cfg.tier_silver_min, 10) || 500) - progressScore;

                if (progressScore >= (parseInt(cfg.tier_gold_min, 10) || 1500)) {
                    tier = "Gold";
                    nextTier = null;
                    pointsToNext = 0;
                } else if (progressScore >= (parseInt(cfg.tier_silver_min, 10) || 500)) {
                    tier = "Silver";
                    nextTier = "Gold";
                    pointsToNext = (parseInt(cfg.tier_gold_min, 10) || 1500) - progressScore;
                }

                res.json({
                    progress: {
                        ...row,
                        github_points: githubPoints,
                        progress_score: progressScore,
                        tier,
                        next_tier: nextTier,
                        points_to_next: Math.max(0, pointsToNext)
                    }
                });
            }
        );
    });
};

const getDashboardStats = (req, res) => {
    const queries = {
        memberCount: "SELECT COUNT(*) AS n FROM members WHERE approval_status = 'Approved' AND is_active = TRUE",
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