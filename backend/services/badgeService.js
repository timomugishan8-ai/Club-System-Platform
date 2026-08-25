const db = require("../config/db");
const Badge = require("../models/Badge");

const RULES = {
    python_explorer: {
        check: (memberId, callback) => {
            const sql = `
                SELECT COUNT(*) AS n
                FROM project_members pm
                JOIN projects p ON pm.project_id = p.project_id
                WHERE pm.member_id = ?
                    AND (p.title LIKE '%python%' OR p.description LIKE '%python%'
                         OR p.repo_url LIKE '%python%')
                    AND p.status = 'Completed'
            `;
            db.query(sql, [memberId], (err, rows) => {
                if (err) return callback(err, false);
                callback(null, rows[0].n >= 1);
            });
        }
    },
    data_analyst: {
        check: (memberId, callback) => {
            const sql = `
                SELECT COUNT(*) AS n FROM participation
                WHERE member_id = ? AND activity = 'Presentation'
            `;
            db.query(sql, [memberId], (err, rows) => {
                if (err) return callback(err, false);
                callback(null, rows[0].n >= 1);
            });
        }
    },
    git_master: {
        check: (memberId, callback) => {
            const sql = `
                SELECT COALESCE(commit_count, 0) AS commits
                FROM github_contributions WHERE member_id = ?
            `;
            db.query(sql, [memberId], (err, rows) => {
                if (err) return callback(err, false);
                callback(null, (rows[0] ? rows[0].commits : 0) >= 10);
            });
        }
    },
    consistency_star: {
        check: (memberId, callback) => {
            const sql = `
                SELECT meeting_date FROM attendance a
                JOIN meetings m ON a.meeting_id = m.meeting_id
                WHERE a.member_id = ? AND a.status IN ('Present', 'Late')
                ORDER BY m.meeting_date DESC
            `;
            db.query(sql, [memberId], (err, rows) => {
                if (err) return callback(err, false);
                if (rows.length < 4) return callback(null, false);

                let streak = 1;
                for (let i = 1; i < rows.length; i++) {
                    const prev = new Date(rows[i - 1].meeting_date);
                    const curr = new Date(rows[i].meeting_date);
                    const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));
                    if (diffDays >= 6 && diffDays <= 8) {
                        streak++;
                    } else {
                        break;
                    }
                }
                callback(null, streak >= 4);
            });
        }
    },
    git_champion: {
        check: (memberId, callback) => {
            const sql = `
                SELECT
                    COALESCE(commit_count, 0) AS commits,
                    COALESCE(pr_count, 0) AS prs
                FROM github_contributions WHERE member_id = ?
            `;
            db.query(sql, [memberId], (err, rows) => {
                if (err) return callback(err, false);
                if (!rows[0]) return callback(null, false);
                callback(null, rows[0].commits >= 50 && rows[0].prs >= 5);
            });
        }
    },
    community_builder: {
        check: (memberId, callback) => {
            const sql = `
                SELECT COUNT(*) AS n FROM participation
                WHERE member_id = ? AND activity = 'Answered Question'
            `;
            db.query(sql, [memberId], (err, rows) => {
                if (err) return callback(err, false);
                callback(null, rows[0].n >= 5);
            });
        }
    },
    r_rookie: {
        check: (memberId, callback) => {
            const sql = `
                SELECT COUNT(*) AS n
                FROM project_members pm
                JOIN projects p ON pm.project_id = p.project_id
                WHERE pm.member_id = ?
                    AND (p.title LIKE '% r %' OR p.description LIKE '% r %'
                         OR p.repo_url LIKE '%-r-%' OR p.title LIKE '%R project%')
                    AND p.status = 'Completed'
            `;
            db.query(sql, [memberId], (err, rows) => {
                if (err) return callback(err, false);
                callback(null, rows[0].n >= 1);
            });
        }
    },
    r_master: {
        check: (memberId, callback) => {
            const sql = `
                SELECT COUNT(*) AS n
                FROM project_members pm
                JOIN projects p ON pm.project_id = p.project_id
                WHERE pm.member_id = ?
                    AND (p.title LIKE '% r %' OR p.description LIKE '% r %'
                         OR p.repo_url LIKE '%-r-%' OR p.title LIKE '%R project%')
                    AND p.status = 'Completed'
            `;
            db.query(sql, [memberId], (err, rows) => {
                if (err) return callback(err, false);
                callback(null, rows[0].n >= 3);
            });
        }
    },
    viz_guru: {
        check: (memberId, callback) => {
            const sql = `
                SELECT COUNT(*) AS n FROM participation
                WHERE member_id = ? AND activity = 'Presentation'
            `;
            db.query(sql, [memberId], (err, rows) => {
                if (err) return callback(err, false);
                callback(null, rows[0].n >= 3);
            });
        }
    },
    model_builder: {
        check: (memberId, callback) => {
            const sql = `
                SELECT COUNT(*) AS n FROM participation
                WHERE member_id = ? AND activity = 'Workshop Facilitator'
            `;
            db.query(sql, [memberId], (err, rows) => {
                if (err) return callback(err, false);
                callback(null, rows[0].n >= 1);
            });
        }
    }
};

const badgeService = {
    evaluateBadges: (memberId, callback) => {
        Badge.findAll((err, badges) => {
            if (err) return callback(err);

            let pending = badges.length;
            if (pending === 0) return callback(null);

            let hadError = false;
            badges.forEach((badge) => {
                const rule = RULES[badge.rule_key];
                if (!rule) {
                    pending--;
                    if (pending === 0 && !hadError) callback(null);
                    return;
                }

                rule.check(memberId, (err, met) => {
                    if (err && !hadError) {
                        hadError = true;
                        return callback(err);
                    }
                    if (met) {
                        Badge.hasBadge(memberId, badge.badge_id, (err, already) => {
                            if (err && !hadError) {
                                hadError = true;
                                return callback(err);
                            }
                            if (!already) {
                                Badge.award(memberId, badge.badge_id, () => {
                                    pending--;
                                    if (pending === 0 && !hadError) callback(null);
                                });
                            } else {
                                pending--;
                                if (pending === 0 && !hadError) callback(null);
                            }
                        });
                    } else {
                        pending--;
                        if (pending === 0 && !hadError) callback(null);
                    }
                });
            });
        });
    },

    evaluateMember: (memberId, callback) => {
        badgeService.evaluateBadges(memberId, callback);
    }
};

module.exports = badgeService;