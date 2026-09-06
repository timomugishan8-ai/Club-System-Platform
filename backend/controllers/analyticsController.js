const db = require("../config/db");

const getAnalytics = (req, res) => {
    const stats = {};
    let pending = 9;
    const done = () => {
        pending--;
        if (pending === 0) res.json({ analytics: stats });
    };

    // 1. Overview counts
    db.query(`
        SELECT
            (SELECT COUNT(*) FROM members WHERE approval_status = 'Approved' AND is_active = TRUE AND role_id != 1) AS active_members,
            (SELECT COUNT(*) FROM members WHERE approval_status = 'Pending') AS pending_members,
            (SELECT COUNT(*) FROM members WHERE approval_status = 'Rejected') AS rejected_members,
            (SELECT COUNT(*) FROM meetings) AS total_meetings,
            (SELECT COUNT(*) FROM events) AS total_events,
            (SELECT COUNT(*) FROM projects) AS total_projects,
            (SELECT COUNT(*) FROM announcements) AS total_announcements,
            (SELECT COUNT(*) FROM resources) AS total_resources,
            (SELECT COALESCE(SUM(points), 0) FROM participation) AS total_points,
            (SELECT COALESCE(SUM(commit_count + pr_count + issue_count + repo_count + star_count), 0)
             FROM github_contributions) AS total_github_contributions
    `, (err, r) => {
        if (r && r[0]) stats.overview = r[0];
        done();
    });

    // 2. Member growth (last 12 months)
    db.query(`
        SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS month,
            COUNT(*) AS count
        FROM members
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month ASC
    `, (err, r) => {
        stats.member_growth = r || [];
        done();
    });

    // 3. Attendance trend (last 12 meetings)
    db.query(`
        SELECT
            mt.meeting_id, mt.title, mt.meeting_date,
            COUNT(a.attendance_id) AS total,
            SUM(a.status = 'Present' OR a.status = 'Late') AS attended,
            SUM(a.status = 'Present') AS present,
            SUM(a.status = 'Late') AS late,
            SUM(a.status = 'Absent') AS absent,
            SUM(a.status = 'Excused') AS excused
        FROM meetings mt
        LEFT JOIN attendance a ON mt.meeting_id = a.meeting_id
        GROUP BY mt.meeting_id
        ORDER BY mt.meeting_date DESC
        LIMIT 12
    `, (err, r) => {
        stats.attendance_trend = (r || []).reverse();
        done();
    });

    // 4. Tier distribution
    db.query(`
        SELECT
            COALESCE(SUM(p.points), 0) +
            COALESCE((SELECT SUM(gc.commit_count + gc.pr_count + gc.issue_count + gc.repo_count + gc.star_count)
                      FROM github_contributions gc WHERE gc.member_id = m.member_id), 0) AS progress_score
        FROM members m
        LEFT JOIN participation p ON m.member_id = p.member_id
        WHERE m.approval_status = 'Approved' AND m.is_active = TRUE AND m.role_id != 1
        GROUP BY m.member_id
    `, (err, r) => {
        const scores = (r || []).map((row) => row.progress_score || 0);
        const settingKeys = [
            'tier_rookie_min', 'tier_rising_star_min',
            'tier_bronze_min', 'tier_silver_min',
            'tier_gold_min', 'tier_diamond_min'
        ];
        db.query(
            `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (${settingKeys.map(() => "?").join(",")})`,
            settingKeys,
            (err, settings) => {
                const cfg = {};
                (settings || []).forEach((s) => { cfg[s.setting_key] = parseInt(s.setting_value, 10) || 0; });

                stats.tier_distribution = {
                    Rookie: scores.filter((s) => s < cfg.tier_rising_star_min).length,
                    "Rising Star": scores.filter((s) => s >= cfg.tier_rising_star_min && s < cfg.tier_bronze_min).length,
                    Bronze: scores.filter((s) => s >= cfg.tier_bronze_min && s < cfg.tier_silver_min).length,
                    Silver: scores.filter((s) => s >= cfg.tier_silver_min && s < cfg.tier_gold_min).length,
                    Gold: scores.filter((s) => s >= cfg.tier_gold_min && s < cfg.tier_diamond_min).length,
                    Diamond: scores.filter((s) => s >= cfg.tier_diamond_min).length,
                };
                done();
            }
        );
    });

    // 5. Committee distribution
    db.query(`
        SELECT
            COALESCE(c.committee_name, 'Unassigned') AS committee,
            COUNT(*) AS count
        FROM members m
        LEFT JOIN committees c ON m.committee_id = c.committee_id
        WHERE m.approval_status = 'Approved' AND m.is_active = TRUE AND m.role_id != 1
        GROUP BY c.committee_name
        ORDER BY count DESC
    `, (err, r) => {
        stats.committee_distribution = r || [];
        done();
    });

    // 6. Activity (participation type) distribution — top points by activity
    db.query(`
        SELECT
            p.activity,
            SUM(p.points) AS total_points,
            COUNT(*) AS record_count
        FROM participation p
        GROUP BY p.activity
        ORDER BY total_points DESC
        LIMIT 8
    `, (err, r) => {
        stats.activity_distribution = r || [];
        done();
    });

    // 7. Project status distribution
    db.query(`
        SELECT
            status,
            COUNT(*) AS count
        FROM projects
        GROUP BY status
    `, (err, r) => {
        stats.project_status = r || [];
        done();
    });

    // 8. Attendance status distribution (overall)
    db.query(`
        SELECT
            status,
            COUNT(*) AS count
        FROM attendance
        GROUP BY status
    `, (err, r) => {
        stats.attendance_status = r || [];
        done();
    });

    // 9. Top contributors (top 5 by points)
    db.query(`
        SELECT
            m.member_id, m.first_name, m.last_name, m.avatar_url,
            COALESCE(SUM(p.points), 0) AS points,
            COALESCE((SELECT SUM(gc.commit_count + gc.pr_count + gc.issue_count + gc.repo_count + LEAST(gc.star_count, 50))
                      FROM github_contributions gc WHERE gc.member_id = m.member_id), 0) AS github_score
        FROM members m
        LEFT JOIN participation p ON m.member_id = p.member_id
        WHERE m.approval_status = 'Approved' AND m.is_active = TRUE AND m.role_id != 1
        GROUP BY m.member_id
        ORDER BY points DESC, github_score DESC
        LIMIT 5
    `, (err, r) => {
        stats.top_contributors = r || [];
        done();
    });
};

module.exports = { getAnalytics };