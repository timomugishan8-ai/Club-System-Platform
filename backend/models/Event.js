const db = require("../config/db");

const Event = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO events
                (title, description, event_type, venue, event_date, start_time, end_time, image_url, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.title,
            data.description || null,
            data.event_type || "Other",
            data.venue || null,
            data.event_date,
            data.start_time || null,
            data.end_time || null,
            data.image_url || null,
            data.created_by
        ];
        db.query(sql, params, callback);
    },

    findAll: (callback) => {
        const sql = `
            SELECT
                e.event_id, e.title, e.description, e.event_type, e.venue,
                e.event_date, e.start_time, e.end_time, e.image_url,
                CONCAT(m.first_name, ' ', m.last_name) AS created_by_name
            FROM events e
            LEFT JOIN members m ON e.created_by = m.member_id
            ORDER BY e.event_date DESC
        `;
        db.query(sql, callback);
    },

    findUpcoming: (limit, callback) => {
        const sql = `
            SELECT event_id, title, description, event_type, venue,
                   event_date, start_time, end_time, image_url
            FROM events
            WHERE event_date >= CURDATE()
            ORDER BY event_date ASC, start_time ASC
            LIMIT ?
        `;
        db.query(sql, [limit], callback);
    },

    findById: (id, callback) => {
        const sql = `
            SELECT
                e.event_id, e.title, e.description, e.event_type, e.venue,
                e.event_date, e.start_time, e.end_time, e.image_url,
                CONCAT(m.first_name, ' ', m.last_name) AS created_by_name
            FROM events e
            LEFT JOIN members m ON e.created_by = m.member_id
            WHERE e.event_id = ?
        `;
        db.query(sql, [id], callback);
    },

    update: (id, data, callback) => {
        const sql = `
            UPDATE events
            SET title = ?, description = ?, event_type = ?, venue = ?,
                event_date = ?, start_time = ?, end_time = ?, image_url = ?
            WHERE event_id = ?
        `;
        const params = [
            data.title,
            data.description || null,
            data.event_type || "Other",
            data.venue || null,
            data.event_date,
            data.start_time || null,
            data.end_time || null,
            data.image_url || null,
            id
        ];
        db.query(sql, params, callback);
    },

    delete: (id, callback) => {
        db.query("DELETE FROM events WHERE event_id = ?", [id], callback);
    },

    register: (eventId, memberId, callback) => {
        const sql = `
            INSERT IGNORE INTO event_registrations (event_id, member_id)
            VALUES (?, ?)
        `;
        db.query(sql, [eventId, memberId], callback);
    },

    unregister: (eventId, memberId, callback) => {
        db.query(
            "DELETE FROM event_registrations WHERE event_id = ? AND member_id = ?",
            [eventId, memberId],
            callback
        );
    },

    getRegistrations: (eventId, callback) => {
        const sql = `
            SELECT
                er.registration_id, er.registered_at,
                m.member_id, m.first_name, m.last_name, m.student_number
            FROM event_registrations er
            JOIN members m ON er.member_id = m.member_id
            WHERE er.event_id = ?
            ORDER BY er.registered_at DESC
        `;
        db.query(sql, [eventId], callback);
    }
};

module.exports = Event;