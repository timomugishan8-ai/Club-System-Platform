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
    }
};

module.exports = Badge;