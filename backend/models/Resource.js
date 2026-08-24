const db = require("../config/db");

const Resource = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO resources
                (title, description, category, difficulty, link_url, file_path, file_size, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.title,
            data.description || null,
            data.category || "Other",
            data.difficulty || "Beginner",
            data.link_url || null,
            data.file_path || null,
            data.file_size || null,
            data.uploaded_by
        ];
        db.query(sql, params, callback);
    },

    findAll: (callback) => {
        const sql = `
            SELECT
                r.resource_id, r.title, r.description, r.category, r.difficulty,
                r.link_url, r.file_path, r.file_size, r.created_at,
                CONCAT(m.first_name, ' ', m.last_name) AS uploaded_by_name
            FROM resources r
            LEFT JOIN members m ON r.uploaded_by = m.member_id
            ORDER BY r.created_at DESC
        `;
        db.query(sql, callback);
    },

    findById: (id, callback) => {
        const sql = `
            SELECT
                r.resource_id, r.title, r.description, r.category, r.difficulty,
                r.link_url, r.file_path, r.file_size, r.created_at,
                CONCAT(m.first_name, ' ', m.last_name) AS uploaded_by_name
            FROM resources r
            LEFT JOIN members m ON r.uploaded_by = m.member_id
            WHERE r.resource_id = ?
        `;
        db.query(sql, [id], callback);
    },

    update: (id, data, callback) => {
        const sql = `
            UPDATE resources
            SET title = ?, description = ?, category = ?, difficulty = ?,
                link_url = ?
            WHERE resource_id = ?
        `;
        const params = [
            data.title,
            data.description || null,
            data.category || "Other",
            data.difficulty || "Beginner",
            data.link_url || null,
            id
        ];
        db.query(sql, params, callback);
    },

    delete: (id, callback) => {
        db.query("DELETE FROM resources WHERE resource_id = ?", [id], callback);
    }
};

module.exports = Resource;