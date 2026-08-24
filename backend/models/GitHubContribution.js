const db = require("../config/db");

const GitHubContribution = {
    upsertSummary: (memberId, stats, callback) => {
        const sql = `
            INSERT INTO github_contributions
                (member_id, repo_count, commit_count, pr_count, issue_count, star_count, streak_days, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE
                repo_count = VALUES(repo_count),
                commit_count = VALUES(commit_count),
                pr_count = VALUES(pr_count),
                issue_count = VALUES(issue_count),
                star_count = VALUES(star_count),
                streak_days = VALUES(streak_days),
                fetched_at = CURRENT_TIMESTAMP
        `;
        const params = [
            memberId,
            stats.repo_count,
            stats.commit_count,
            stats.pr_count,
            stats.issue_count,
            stats.star_count,
            stats.streak_days
        ];
        db.query(sql, params, callback);
    },

    getSummary: (memberId, callback) => {
        db.query(
            "SELECT * FROM github_contributions WHERE member_id = ?",
            [memberId],
            callback
        );
    },

    replaceDailyActivity: (memberId, dailyRows, callback) => {
        if (!dailyRows || dailyRows.length === 0) {
            return callback(null);
        }

        db.query(
            "DELETE FROM github_daily_activity WHERE member_id = ?",
            [memberId],
            (err) => {
                if (err) return callback(err);

                const values = dailyRows.map((row) => [
                    memberId,
                    row.date,
                    row.count
                ]);

                const sql = `
                    INSERT INTO github_daily_activity (member_id, activity_date, count)
                    VALUES ?
                `;
                db.query(sql, [values], callback);
            }
        );
    },

    getDailyActivity: (memberId, callback) => {
        const sql = `
            SELECT activity_date, count
            FROM github_daily_activity
            WHERE member_id = ?
            ORDER BY activity_date ASC
        `;
        db.query(sql, [memberId], callback);
    },

    getStreak: (memberId, callback) => {
        const sql = `
            SELECT activity_date, count
            FROM github_daily_activity
            WHERE member_id = ? AND count > 0
            ORDER BY activity_date DESC
            LIMIT 400
        `;
        db.query(sql, [memberId], (err, rows) => {
            if (err) return callback(err);

            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < rows.length; i++) {
                const d = new Date(rows[i].activity_date);
                d.setHours(0, 0, 0, 0);
                const expected = new Date(today);
                expected.setDate(expected.getDate() - streak);

                if (d.getTime() === expected.getTime()) {
                    streak++;
                } else {
                    break;
                }
            }

            callback(null, streak);
        });
    }
};

module.exports = GitHubContribution;