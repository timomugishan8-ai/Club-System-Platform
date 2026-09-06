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

// MySQL DECIMAL aggregates (SUM/ROUND) arrive as strings; coerce before
// arithmetic so totals add numerically instead of concatenating
// ("0" + 258533 -> "02585330").
const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

// Stars are recognition from others, not member effort — one popular repo
// would otherwise flood the score (e.g. linking a 258k-star account).
// They contribute, capped at 50.
const STAR_CAP = 50;

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
            COALESCE(MAX(gc.commit_count), 0) AS commit_count,
            COALESCE(MAX(gc.pr_count), 0) AS pr_count,
            COALESCE(MAX(gc.issue_count), 0) AS issue_count,
            COALESCE(MAX(gc.repo_count), 0) AS repo_count,
            COALESCE(MAX(gc.star_count), 0) AS star_count,
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
                    const stars = Math.min(toNum(row.star_count), STAR_CAP);
                    // Repos + commits + PRs + issues, stars capped (they're
                    // recognition from others, not member effort)
                    const githubScore = toNum(row.repo_count) + toNum(row.commit_count)
                        + toNum(row.pr_count) + toNum(row.issue_count) + stars;
                    const githubPoints = Math.round(githubScore * githubWeight);
                    const attendancePoints = Math.round((toNum(row.attendance_rate) / 100) * attendanceWeight);
                    const progressScore = toNum(row.total_points) + githubPoints + attendancePoints;

                    return {
                        rank: index + 1,
                        member_id: row.member_id,
                        first_name: row.first_name,
                        last_name: row.last_name,
                        avatar_url: row.avatar_url,
                        github_handle: row.github_handle,
                        total_points: toNum(row.total_points),
                        github_score: githubScore,
                        attendance_rate: row.attendance_rate,
                        github_points: githubPoints,
                        attendance_points: attendancePoints,
                        progress_score: progressScore,
                        tier: assignTier(progressScore, cfg)
                    };
                });

                // Rank in JS: github_score is computed with the star cap,
                // which SQL can't see
                ranked.sort((a, b) =>
                    b.progress_score - a.progress_score
                    || b.github_score - a.github_score
                    || (toNum(b.attendance_rate) - toNum(a.attendance_rate))
                );
                ranked.forEach((r, i) => { r.rank = i + 1; });

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
    buildMemberProgress(req.user.id, (err, status, payload) => {
        if (err) return res.status(500).json({ message: "Failed to load progress." });
        if (status === 404) return res.status(404).json({ message: "Member not found." });
        res.json({ progress: payload });
    });
};

// Shared builder so admins can fetch any member's progress detail.
const buildMemberProgress = (memberId, callback) => {
    const sql = `
        SELECT
            m.member_id, m.first_name, m.last_name,
            COALESCE(SUM(p.points), 0) AS total_points,
            (SELECT COALESCE(SUM(commit_count + pr_count + issue_count + repo_count), 0)
             FROM github_contributions WHERE member_id = m.member_id) AS github_core,
            (SELECT COALESCE(SUM(star_count), 0)
             FROM github_contributions WHERE member_id = m.member_id) AS star_count_raw,
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
        if (err) return callback(err);
        if (results.length === 0) return callback(null, 404);

        const row = results[0];
        const settingKeys = [
            ...TIERS.map((t) => t.key),
            "github_weight", "attendance_weight"
        ];
        db.query(
            `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (${settingKeys.map(() => "?").join(",")})`,
            settingKeys,
            (err, settings) => {
                if (err) return callback(err);

                const cfg = {};
                settings.forEach((s) => { cfg[s.setting_key] = s.setting_value; });
                const githubWeight = parseFloat(cfg.github_weight) || 1;
                const attendanceWeight = parseFloat(cfg.attendance_weight) || 0;
                const githubScore = toNum(row.github_core) + Math.min(toNum(row.star_count_raw), STAR_CAP);
                const githubPoints = Math.round(githubScore * githubWeight);
                const attendancePoints = Math.round((toNum(row.attendance_rate) / 100) * attendanceWeight);
                const totalPoints = toNum(row.total_points);
                const progressScore = totalPoints + githubPoints + attendancePoints;

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
                    if (err) return callback(err);
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

                    // Per-activity breakdown (e.g. "Attendance Bonus × 4 = 8 pts")
                    // so the admin's member dropdown can show the full detail.
                    PointAdjustment.getMemberActivityBreakdown(memberId, (err, activityRows) => {
                        if (err) return callback(err);
                        const activity_breakdown = {};
                        (activityRows || []).forEach((r) => {
                            if (!activity_breakdown[r.pillar]) activity_breakdown[r.pillar] = [];
                            activity_breakdown[r.pillar].push({
                                activity: r.activity,
                                total_points: r.total_points,
                                times_awarded: r.times_awarded
                            });
                        });

                        callback(null, 200, {
                            ...row,
                            total_points: totalPoints,
                            github_score: githubScore,
                            github_points: githubPoints,
                            attendance_points: attendancePoints,
                            progress_score: progressScore,
                            tier: tierName,
                            next_tier: nextTier,
                            points_to_next: pointsToNext,
                            pillar_points: pillarPoints,
                            activity_breakdown
                        });
                    });
                });
            }
        );
    });
};

// Admin/Leader: any member's full progress detail
const getMemberProgress = (req, res) => {
    buildMemberProgress(req.params.memberId, (err, status, payload) => {
        if (err) return res.status(500).json({ message: "Failed to load progress." });
        if (status === 404) return res.status(404).json({ message: "Member not found." });
        res.json({ progress: payload });
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

// Admin dashboard: neutral chapter-oversight overview. No personal stats,
// points, GitHub, or ranking — the admin account doesn't participate.
const getAdminDashboard = (req, res) => {
    const stats = {};
    let pending = 6;
    const done = () => {
        pending--;
        if (pending === 0) res.json({ dashboard: stats });
    };

    // 1. Chapter health counts
    db.query(`
        SELECT
            (SELECT COUNT(*) FROM members WHERE approval_status = 'Approved' AND is_active = TRUE AND role_id != 1) AS approved_members,
            (SELECT COUNT(*) FROM members WHERE approval_status = 'Pending') AS pending_members,
            (SELECT COUNT(*) FROM members WHERE approval_status = 'Rejected') AS rejected_members,
            (SELECT COUNT(*) FROM members WHERE approval_status = 'Approved' AND is_active = TRUE AND role_id != 1 AND github_handle IS NOT NULL AND github_handle != '') AS members_with_github,
            (SELECT COUNT(*) FROM meetings) AS total_meetings,
            (SELECT COUNT(*) FROM projects WHERE status IN ('Planning', 'In Progress')) AS active_projects,
            (SELECT COUNT(*) FROM projects WHERE status = 'Completed') AS completed_projects,
            (SELECT COUNT(*) FROM events WHERE event_date >= CURDATE()) AS upcoming_events_count,
            (SELECT COALESCE(SUM(points), 0) FROM participation) AS total_points_awarded
    `, (err, r) => {
        stats.chapter = (r && r[0]) || {};
        done();
    });

    // 2. Attendance overview (all-time per status)
    db.query(`
        SELECT
            COALESCE(SUM(status = 'Present'), 0) AS present,
            COALESCE(SUM(status = 'Late'), 0) AS late,
            COALESCE(SUM(status = 'Absent'), 0) AS absent,
            COALESCE(SUM(status = 'Excused'), 0) AS excused
        FROM attendance
    `, (err, r) => {
        stats.attendance = (r && r[0]) || {};
        done();
    });

    // 3. Pending approvals (top 5, oldest first)
    db.query(`
        SELECT member_id, first_name, last_name, email, created_at
        FROM members WHERE approval_status = 'Pending'
        ORDER BY created_at ASC LIMIT 5
    `, (err, r) => {
        stats.pending_approvals = r || [];
        done();
    });

    // 4. GitHub coverage: linked vs refreshed
    db.query(`
        SELECT
            COUNT(DISTINCT gc.member_id) AS members_synced
        FROM github_contributions gc
        JOIN members m ON gc.member_id = m.member_id
        WHERE m.role_id != 1
    `, (err, r) => {
        stats.github_synced = (r && r[0]) ? r[0].members_synced : 0;
        done();
    });

    // 5. Recent activity pulse (participation records, last 10)
    db.query(`
        SELECT p.participation_id, p.activity, p.points, p.recorded_at,
               m.member_id, m.first_name, m.last_name
        FROM participation p
        JOIN members m ON p.member_id = m.member_id
        ORDER BY p.recorded_at DESC LIMIT 10
    `, (err, r) => {
        stats.recent_activity = r || [];
        done();
    });

    // 6. Tier distribution snapshot
    db.query(`
        SELECT
            COALESCE(SUM(p.points), 0) AS total_points,
            (SELECT COALESCE(SUM(commit_count + pr_count + issue_count + repo_count), 0)
             FROM github_contributions WHERE member_id = m.member_id) AS github_core,
            (SELECT COALESCE(SUM(star_count), 0)
             FROM github_contributions WHERE member_id = m.member_id) AS star_count_raw,
            CASE
                WHEN (SELECT COUNT(*) FROM attendance WHERE member_id = m.member_id) = 0 THEN 0
                ELSE ROUND(
                    (SELECT SUM(status = 'Present' OR status = 'Late')
                     FROM attendance WHERE member_id = m.member_id)
                    / (SELECT COUNT(*) FROM attendance WHERE member_id = m.member_id) * 100, 1)
            END AS attendance_rate
        FROM members m
        LEFT JOIN participation p ON m.member_id = p.member_id
        WHERE m.approval_status = 'Approved' AND m.is_active = TRUE AND m.role_id != 1
        GROUP BY m.member_id
    `, (err, r) => {
        const settingKeys = [...TIERS.map((t) => t.key), "github_weight", "attendance_weight"];
        db.query(
            `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (${settingKeys.map(() => "?").join(",")})`,
            settingKeys,
            (err, settings) => {
                const cfg = {};
                (settings || []).forEach((s) => { cfg[s.setting_key] = s.setting_value; });
                const githubWeight = parseFloat(cfg.github_weight) || 1;
                const attendanceWeight = parseFloat(cfg.attendance_weight) || 0;
                // Same formula as the leaderboard: points + weighted github
                // (stars capped) + weighted attendance
                const scores = (r || []).map((row) =>
                    toNum(row.total_points)
                    + Math.round((toNum(row.github_core) + Math.min(toNum(row.star_count_raw), STAR_CAP)) * githubWeight)
                    + Math.round((toNum(row.attendance_rate) / 100) * attendanceWeight)
                );
                stats.tier_distribution = {
                    Diamond: scores.filter((s) => s >= (parseInt(cfg.tier_diamond_min, 10) || 0)).length,
                    Gold: scores.filter((s) => s >= (parseInt(cfg.tier_gold_min, 10) || 0) && s < (parseInt(cfg.tier_diamond_min, 10) || 0)).length,
                    Silver: scores.filter((s) => s >= (parseInt(cfg.tier_silver_min, 10) || 0) && s < (parseInt(cfg.tier_gold_min, 10) || 0)).length,
                    Bronze: scores.filter((s) => s >= (parseInt(cfg.tier_bronze_min, 10) || 0) && s < (parseInt(cfg.tier_silver_min, 10) || 0)).length,
                    "Rising Star": scores.filter((s) => s >= (parseInt(cfg.tier_rising_star_min, 10) || 0) && s < (parseInt(cfg.tier_bronze_min, 10) || 0)).length,
                    Rookie: scores.filter((s) => s < (parseInt(cfg.tier_rising_star_min, 10) || 0)).length,
                };
                done();
            }
        );
    });
};

module.exports = { getLeaderboard, getMyProgress, getMemberProgress, getDashboardStats, getAdminDashboard };