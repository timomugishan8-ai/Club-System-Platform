const db = require("../config/db");

const Member = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO members
                (email, password_hash, role_id, first_name, last_name,
                 student_number, gender, phone, course, year_of_study,
                 github_handle, bio, notify_email, notify_inapp, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.email,
            data.password_hash,
            data.role_id || 3,
            data.first_name,
            data.last_name,
            data.student_number || null,
            data.gender || null,
            data.phone || null,
            data.course || null,
            data.year_of_study || null,
            data.github_handle || null,
            data.bio || null,
            data.notify_email === false ? 0 : 1,
            data.notify_inapp === false ? 0 : 1,
            data.join_date || null
        ];
        db.query(sql, params, callback);
    },

    findByEmail: (email, callback) => {
        const sql = `
            SELECT m.*, r.role_name
            FROM members m
            JOIN roles r ON m.role_id = r.role_id
            WHERE m.email = ?
        `;
        db.query(sql, [email], callback);
    },

    findById: (id, callback) => {
        const sql = `
            SELECT
                m.member_id, m.email, m.first_name, m.last_name,
                m.student_number, m.gender, m.phone, m.course,
                m.year_of_study, m.committee_id, m.join_date,
                m.status, m.approval_status, m.is_active,
                m.github_handle, m.avatar_url, m.bio,
                m.notify_email, m.notify_inapp, m.theme,
                m.created_at, r.role_id, r.role_name,
                c.committee_name
            FROM members m
            JOIN roles r ON m.role_id = r.role_id
            LEFT JOIN committees c ON m.committee_id = c.committee_id
            WHERE m.member_id = ?
        `;
        db.query(sql, [id], callback);
    },

    findAll: (callback) => {
        const sql = `
            SELECT
                m.member_id, m.email, m.first_name, m.last_name,
                m.student_number, m.status, m.approval_status,
                m.github_handle, m.avatar_url, r.role_name,
                c.committee_name
            FROM members m
            JOIN roles r ON m.role_id = r.role_id
            LEFT JOIN committees c ON m.committee_id = c.committee_id
            WHERE r.role_name != 'Admin'
            ORDER BY m.created_at DESC
        `;
        db.query(sql, callback);
    },

    findPending: (callback) => {
        const sql = `
            SELECT
                m.member_id, m.email, m.first_name, m.last_name,
                m.student_number, m.course, m.year_of_study, m.created_at
            FROM members m
            WHERE m.approval_status = 'Pending'
                AND m.role_id != 1
            ORDER BY m.created_at ASC
        `;
        db.query(sql, callback);
    },

    updateApprovalStatus: (memberId, status, approvedBy, callback) => {
        const sql = `
            UPDATE members
            SET approval_status = ?,
                approved_by = ?,
                approved_at = CASE WHEN ? = 'Approved' THEN CURRENT_TIMESTAMP ELSE approved_at END
            WHERE member_id = ?
        `;
        db.query(sql, [status, approvedBy, status, memberId], callback);
    },

    updateProfile: (memberId, data, callback) => {
        // Only update the fields that were actually provided, so partial
        // updates (e.g. just the GitHub handle) don't wipe other columns.
        const allowed = [
            "first_name", "last_name", "gender", "phone",
            "course", "year_of_study", "committee_id",
            "github_handle", "avatar_url", "bio",
            "notify_email", "notify_inapp", "theme",
        ];
        const sets = [];
        const params = [];
        allowed.forEach((col) => {
            if (data[col] !== undefined) {
                sets.push(`${col} = ?`);
                params.push(data[col]);
            }
        });
        if (sets.length === 0) {
            return callback(null);
        }
        params.push(memberId);
        db.query(
            `UPDATE members SET ${sets.join(", ")} WHERE member_id = ?`,
            params,
            callback
        );
    },

    updatePassword: (memberId, passwordHash, callback) => {
        db.query(
            "UPDATE members SET password_hash = ? WHERE member_id = ?",
            [passwordHash, memberId],
            callback
        );
    },

    deleteById: (memberId, callback) => {
        db.query("DELETE FROM members WHERE member_id = ?", [memberId], callback);
    }
};

module.exports = Member;