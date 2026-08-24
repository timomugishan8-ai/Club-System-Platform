const db = require("../config/db");

const Notification = {
    create: (memberId, type, title, body, callback) => {
        const sql = `
            INSERT INTO notifications (member_id, type, title, body)
            VALUES (?, ?, ?, ?)
        `;
        db.query(sql, [memberId, type, title, body], callback);
    },

    createMany: (memberIds, type, title, body, callback) => {
        if (!memberIds || memberIds.length === 0) {
            return callback(null, { affectedRows: 0 });
        }
        const values = memberIds.map((id) => [id, type, title, body]);
        const sql = `
            INSERT INTO notifications (member_id, type, title, body)
            VALUES ?
        `;
        db.query(sql, [values], callback);
    },

    findByMember: (memberId, callback) => {
        const sql = `
            SELECT notification_id, type, title, body, is_read, created_at
            FROM notifications
            WHERE member_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `;
        db.query(sql, [memberId], callback);
    },

    countUnread: (memberId, callback) => {
        db.query(
            "SELECT COUNT(*) AS n FROM notifications WHERE member_id = ? AND is_read = FALSE",
            [memberId],
            callback
        );
    },

    markRead: (notificationId, memberId, callback) => {
        db.query(
            "UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND member_id = ?",
            [notificationId, memberId],
            callback
        );
    },

    markAllRead: (memberId, callback) => {
        db.query(
            "UPDATE notifications SET is_read = TRUE WHERE member_id = ? AND is_read = FALSE",
            [memberId],
            callback
        );
    },

    markEmailSent: (notificationId, callback) => {
        db.query(
            "UPDATE notifications SET email_sent = TRUE WHERE notification_id = ?",
            [notificationId],
            callback
        );
    }
};

module.exports = Notification;