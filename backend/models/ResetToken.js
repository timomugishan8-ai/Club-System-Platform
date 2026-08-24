const db = require("../config/db");

const ResetToken = {
    create: (memberId, tokenHash, expiresAt, callback) => {
        const sql = `
            INSERT INTO password_reset_tokens (member_id, token_hash, expires_at)
            VALUES (?, ?, ?)
        `;
        db.query(sql, [memberId, tokenHash, expiresAt], callback);
    },

    findValid: (tokenHash, callback) => {
        const sql = `
            SELECT *
            FROM password_reset_tokens
            WHERE token_hash = ?
              AND used_at IS NULL
              AND expires_at > NOW()
        `;
        db.query(sql, [tokenHash], callback);
    },

    markUsed: (tokenId, callback) => {
        db.query(
            "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_id = ?",
            [tokenId],
            callback
        );
    }
};

module.exports = ResetToken;