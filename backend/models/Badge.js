const db = require("../config/db");

const Badge = {
    findAll: (callback) => {
        const sql = `
            SELECT badge_id, name, description, icon, color, rule_key, pillar
            FROM badges
            ORDER BY badge_id ASC
        `;
        db.query(sql, callback);
    },

    findByMember: (memberId, callback) => {
        const sql = `
            SELECT
                b.badge_id, b.name, b.description, b.icon, b.color,
                b.rule_key, b.pillar, mb.awarded_at
            FROM member_badges mb
            JOIN badges b ON mb.badge_id = b.badge_id
            WHERE mb.member_id = ?
            ORDER BY mb.awarded_at DESC
        `;
        db.query(sql, [memberId], callback);
    },

    findByRuleKey: (ruleKey, callback) => {
        db.query(
            "SELECT * FROM badges WHERE rule_key = ?",
            [ruleKey],
            callback
        );
    },

    award: (memberId, badgeId, callback) => {
        const sql = `
            INSERT INTO member_badges (member_id, badge_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE member_badge_id = member_badge_id
        `;
        db.query(sql, [memberId, badgeId], callback);
    },

    revoke: (memberId, badgeId, callback) => {
        db.query(
            "DELETE FROM member_badges WHERE member_id = ? AND badge_id = ?",
            [memberId, badgeId],
            callback
        );
    },

    hasBadge: (memberId, badgeId, callback) => {
        db.query(
            "SELECT 1 FROM member_badges WHERE member_id = ? AND badge_id = ? LIMIT 1",
            [memberId, badgeId],
            (err, rows) => {
                if (err) return callback(err);
                callback(null, rows.length > 0);
            }
        );
    },

    countByMember: (memberId, callback) => {
        db.query(
            "SELECT COUNT(*) AS count FROM member_badges WHERE member_id = ?",
            [memberId],
            (err, rows) => {
                if (err) return callback(err);
                callback(null, rows[0].count);
            }
        );
    },

    // Live counters that power the "how close am I?" display in the badge
    // catalog. Each metric mirrors its badge rule's SQL.
    getProgressMetrics: (memberId, callback) => {
        const queries = {
            // Completed Python projects the member is on
            python_projects: `
                SELECT COUNT(*) AS n
                FROM project_members pm
                JOIN projects p ON pm.project_id = p.project_id
                WHERE pm.member_id = ?
                    AND (p.title LIKE '%python%' OR p.description LIKE '%python%'
                         OR p.repo_url LIKE '%python%')
                    AND p.status = 'Completed'
            `,
            presentations: `
                SELECT COUNT(*) AS n FROM participation
                WHERE member_id = ? AND activity = 'Presentation'
            `,
            answered_questions: `
                SELECT COUNT(*) AS n FROM participation
                WHERE member_id = ? AND activity = 'Answered Question'
            `,
            workshops: `
                SELECT COUNT(*) AS n FROM participation
                WHERE member_id = ? AND activity = 'Workshop Facilitator'
            `,
            // Completed R projects the member is on
            r_projects: `
                SELECT COUNT(*) AS n
                FROM project_members pm
                JOIN projects p ON pm.project_id = p.project_id
                WHERE pm.member_id = ?
                    AND (p.title LIKE '% r %' OR p.description LIKE '% r %'
                         OR p.repo_url LIKE '%-r-%' OR p.title LIKE '%R project%')
                    AND p.status = 'Completed'
            `,
        };

        const keys = Object.keys(queries);
        const metrics = {};
        let pending = keys.length;
        if (pending === 0) return callback(null, metrics);

        let hadError = false;
        keys.forEach((key) => {
            db.query(queries[key], [memberId], (err, rows) => {
                if (err && !hadError) {
                    hadError = true;
                    return callback(err);
                }
                metrics[key] = rows && rows[0] ? rows[0].n : 0;
                pending--;
                if (pending === 0 && !hadError) {
                    // GitHub-derived metrics in one shot
                    db.query(
                        `SELECT COALESCE(commit_count, 0) AS commits, COALESCE(pr_count, 0) AS prs
                         FROM github_contributions WHERE member_id = ? LIMIT 1`,
                        [memberId],
                        (err, rows) => {
                            if (!err && rows && rows[0]) {
                                metrics.commits = rows[0].commits;
                                metrics.merged_prs = rows[0].prs;
                            } else {
                                metrics.commits = 0;
                                metrics.merged_prs = 0;
                            }
                            callback(null, metrics);
                        }
                    );
                }
            });
        });
    },

    // Longest current weekly attendance streak (Present/Late), mirroring
    // consistency_star's rule logic
    getAttendanceStreak: (memberId, callback) => {
        const sql = `
            SELECT meeting_date FROM attendance a
            JOIN meetings m ON a.meeting_id = m.meeting_id
            WHERE a.member_id = ? AND a.status IN ('Present', 'Late')
            ORDER BY m.meeting_date DESC
        `;
        db.query(sql, [memberId], (err, rows) => {
            if (err) return callback(err);
            if (rows.length === 0) return callback(null, 0);
            let streak = 1;
            for (let i = 1; i < rows.length; i++) {
                const prev = new Date(rows[i - 1].meeting_date);
                const curr = new Date(rows[i].meeting_date);
                const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
                if (diffDays >= 6 && diffDays <= 8) streak++;
                else break;
            }
            callback(null, streak);
        });
    }
};

module.exports = Badge;