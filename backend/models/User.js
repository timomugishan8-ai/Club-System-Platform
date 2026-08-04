const db = require("../config/db");

const User = {

    create: (userData, callback) => {

        const sql = `
            INSERT INTO users
            (full_name, email, password_hash, role_id)
            VALUES (?, ?, ?, ?)
        `;

        db.query(sql, [
            userData.full_name,
            userData.email,
            userData.password_hash,
            userData.role_id
        ], callback);
    },

    findByEmail: (email, callback) => {

        const sql = `
            SELECT *
            FROM users
            WHERE email = ?
        `;

        db.query(sql, [email], callback);
    },

    findById: (id, callback) => {

        const sql = `
            SELECT
                u.user_id,
                u.full_name,
                u.email,
                r.role_name
            FROM users u
            JOIN roles r
                ON u.role_id = r.role_id
            WHERE u.user_id = ?
        `;

        db.query(sql, [id], callback);
    }

};

module.exports = User;