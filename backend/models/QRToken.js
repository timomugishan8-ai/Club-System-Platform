const db = require("../config/db");

const QRToken = {
    // Active token for a meeting (unique meeting_id + is_active=TRUE)
    findActiveByMeeting: (meetingId, callback) => {
        db.query(
            `SELECT qr_token_id, meeting_id, token, is_active, expires_at, created_at
             FROM meeting_qr_tokens
             WHERE meeting_id = ? AND is_active = TRUE
             LIMIT 1`,
            [meetingId],
            callback
        );
    },

    findByTokenValue: (token, callback) => {
        db.query(
            `SELECT qr_token_id, meeting_id, token, is_active, expires_at
             FROM meeting_qr_tokens
             WHERE token = ? AND is_active = TRUE
             LIMIT 1`,
            [token],
            callback
        );
    },

    create: (data, callback) => {
        const sql = `
            INSERT INTO meeting_qr_tokens (meeting_id, token, expires_at, created_by)
            VALUES (?, ?, ?, ?)
        `;
        db.query(sql, [data.meeting_id, data.token, data.expires_at || null, data.created_by], callback);
    },

    deactivate: (qrTokenId, callback) => {
        db.query(
            "UPDATE meeting_qr_tokens SET is_active = FALSE WHERE qr_token_id = ?",
            [qrTokenId],
            callback
        );
    },

    // Live check-in tally for the QR display (who's in, how late)
    countCheckIns: (meetingId, callback) => {
        db.query(
            `SELECT
                COUNT(*) AS total,
                SUM(a.status = 'Present') AS present,
                SUM(a.status = 'Late') AS late
             FROM attendance a
             WHERE a.meeting_id = ? AND a.check_in_time IS NOT NULL
                 AND a.status IN ('Present', 'Late')`,
            [meetingId],
            callback
        );
    }
};

module.exports = QRToken;