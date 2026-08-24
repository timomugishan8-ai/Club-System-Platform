const db = require("../config/db");

const Meeting = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO meetings
                (title, topic, description, venue, meeting_date, start_time, end_time, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.title,
            data.topic || null,
            data.description || null,
            data.venue || null,
            data.meeting_date,
            data.start_time || null,
            data.end_time || null,
            data.created_by
        ];
        db.query(sql, params, callback);
    },

    findAll: (callback) => {
        const sql = `
            SELECT
                m.meeting_id, m.title, m.topic, m.description, m.venue,
                m.meeting_date, m.start_time, m.end_time, m.created_by,
                CONCAT(mb.first_name, ' ', mb.last_name) AS created_by_name
            FROM meetings m
            LEFT JOIN members mb ON m.created_by = mb.member_id
            ORDER BY m.meeting_date DESC, m.start_time DESC
        `;
        db.query(sql, callback);
    },

    findById: (id, callback) => {
        const sql = `
            SELECT
                m.meeting_id, m.title, m.topic, m.description, m.venue,
                m.meeting_date, m.start_time, m.end_time, m.created_by,
                CONCAT(mb.first_name, ' ', mb.last_name) AS created_by_name
            FROM meetings m
            LEFT JOIN members mb ON m.created_by = mb.member_id
            WHERE m.meeting_id = ?
        `;
        db.query(sql, [id], callback);
    },

    update: (id, data, callback) => {
        const sql = `
            UPDATE meetings
            SET title = ?, topic = ?, description = ?, venue = ?,
                meeting_date = ?, start_time = ?, end_time = ?
            WHERE meeting_id = ?
        `;
        const params = [
            data.title,
            data.topic || null,
            data.description || null,
            data.venue || null,
            data.meeting_date,
            data.start_time || null,
            data.end_time || null,
            id
        ];
        db.query(sql, params, callback);
    },

    delete: (id, callback) => {
        db.query("DELETE FROM meetings WHERE meeting_id = ?", [id], callback);
    },

    findUpcoming: (limit, callback) => {
        const sql = `
            SELECT
                meeting_id, title, topic, venue, meeting_date, start_time, end_time
            FROM meetings
            WHERE meeting_date >= CURDATE()
            ORDER BY meeting_date ASC, start_time ASC
            LIMIT ?
        `;
        db.query(sql, [limit], callback);
    }
};

module.exports = Meeting;