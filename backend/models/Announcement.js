const db = require("../config/db");

const Announcement = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO announcements (title, body, category, is_pinned, expires_at, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.title,
            data.body,
            data.category || "General",
            data.is_pinned ? 1 : 0,
            data.expires_at || null,
            data.created_by
        ];
        db.query(sql, params, callback);
    },

    findAll: (callback) => {
        const sql = `
            SELECT
                a.announcement_id, a.title, a.body, a.category, a.is_pinned,
                a.expires_at, a.created_at,
                CONCAT(m.first_name, ' ', m.last_name) AS created_by_name
            FROM announcements a
            LEFT JOIN members m ON a.created_by = m.member_id
            WHERE (a.expires_at IS NULL OR a.expires_at > NOW())
            ORDER BY a.is_pinned DESC, a.created_at DESC
        `;
        db.query(sql, callback);
    },

    findRecent: (limit, callback) => {
        const sql = `
            SELECT
                a.announcement_id, a.title, a.body, a.category, a.is_pinned,
                a.created_at
            FROM announcements a
            WHERE (a.expires_at IS NULL OR a.expires_at > NOW())
            ORDER BY a.is_pinned DESC, a.created_at DESC
            LIMIT ?
        `;
        db.query(sql, [limit], callback);
    },

    findById: (id, callback) => {
        const sql = `
            SELECT
                a.announcement_id, a.title, a.body, a.category, a.is_pinned,
                a.expires_at, a.created_at,
                CONCAT(m.first_name, ' ', m.last_name) AS created_by_name
            FROM announcements a
            LEFT JOIN members m ON a.created_by = m.member_id
            WHERE a.announcement_id = ?
        `;
        db.query(sql, [id], callback);
    },

    update: (id, data, callback) => {
        const sql = `
            UPDATE announcements
            SET title = ?, body = ?, category = ?, is_pinned = ?, expires_at = ?
            WHERE announcement_id = ?
        `;
        const params = [
            data.title,
            data.body,
            data.category || "General",
            data.is_pinned ? 1 : 0,
            data.expires_at || null,
            id
        ];
        db.query(sql, params, callback);
    },

    delete: (id, callback) => {
        db.query("DELETE FROM announcements WHERE announcement_id = ?", [id], callback);
    }
};

module.exports = Announcement;