const db = require("../config/db");

const Project = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO projects
                (title, description, repo_url, status, start_date, end_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.title,
            data.description || null,
            data.repo_url || null,
            data.status || "Planning",
            data.start_date || null,
            data.end_date || null,
            data.created_by
        ];
        db.query(sql, params, callback);
    },

    findAll: (callback) => {
        const sql = `
            SELECT
                p.project_id, p.title, p.description, p.repo_url, p.status,
                p.start_date, p.end_date,
                CONCAT(m.first_name, ' ', m.last_name) AS created_by_name
            FROM projects p
            LEFT JOIN members m ON p.created_by = m.member_id
            ORDER BY p.start_date DESC
        `;
        db.query(sql, callback);
    },

    findById: (id, callback) => {
        const sql = `
            SELECT
                p.project_id, p.title, p.description, p.repo_url, p.status,
                p.start_date, p.end_date,
                CONCAT(m.first_name, ' ', m.last_name) AS created_by_name
            FROM projects p
            LEFT JOIN members m ON p.created_by = m.member_id
            WHERE p.project_id = ?
        `;
        db.query(sql, [id], callback);
    },

    update: (id, data, callback) => {
        const sql = `
            UPDATE projects
            SET title = ?, description = ?, repo_url = ?, status = ?,
                start_date = ?, end_date = ?
            WHERE project_id = ?
        `;
        const params = [
            data.title,
            data.description || null,
            data.repo_url || null,
            data.status || "Planning",
            data.start_date || null,
            data.end_date || null,
            id
        ];
        db.query(sql, params, callback);
    },

    delete: (id, callback) => {
        db.query("DELETE FROM projects WHERE project_id = ?", [id], callback);
    },

    getMembers: (projectId, callback) => {
        const sql = `
            SELECT
                pm.project_member_id, pm.role,
                m.member_id, m.first_name, m.last_name, m.student_number,
                m.github_handle, m.avatar_url
            FROM project_members pm
            JOIN members m ON pm.member_id = m.member_id
            WHERE pm.project_id = ?
            ORDER BY m.first_name, m.last_name
        `;
        db.query(sql, [projectId], callback);
    },

    addMember: (projectId, memberId, role, callback) => {
        const sql = `
            INSERT IGNORE INTO project_members (project_id, member_id, role)
            VALUES (?, ?, ?)
        `;
        db.query(sql, [projectId, memberId, role || "Member"], callback);
    },

    removeMember: (projectId, memberId, callback) => {
        db.query(
            "DELETE FROM project_members WHERE project_id = ? AND member_id = ?",
            [projectId, memberId],
            callback
        );
    },

    findByMember: (memberId, callback) => {
        const sql = `
            SELECT
                p.project_id, p.title, p.description, p.repo_url, p.status,
                p.start_date, p.end_date, pm.role
            FROM project_members pm
            JOIN projects p ON pm.project_id = p.project_id
            WHERE pm.member_id = ?
            ORDER BY p.start_date DESC
        `;
        db.query(sql, [memberId], callback);
    }
};

module.exports = Project;