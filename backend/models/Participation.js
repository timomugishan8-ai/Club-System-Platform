const db = require("../config/db");

const Participation = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO participation (meeting_id, member_id, activity, points, pillar, remarks)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.meeting_id,
            data.member_id,
            data.activity,
            data.points || 0,
            data.pillar || "Attendance & Participation",
            data.remarks || null
        ];
        db.query(sql, params, callback);
    },

    findByMeeting: (meetingId, callback) => {
        const sql = `
            SELECT
                p.participation_id, p.activity, p.points, p.remarks, p.recorded_at,
                m.member_id, m.first_name, m.last_name, m.student_number
            FROM participation p
            JOIN members m ON p.member_id = m.member_id
            WHERE p.meeting_id = ?
            ORDER BY p.recorded_at DESC
        `;
        db.query(sql, [meetingId], callback);
    },

    findByMember: (memberId, callback) => {
        const sql = `
            SELECT
                p.participation_id, p.activity, p.points, p.remarks, p.recorded_at,
                mt.meeting_id, mt.title, mt.meeting_date
            FROM participation p
            JOIN meetings mt ON p.meeting_id = mt.meeting_id
            WHERE p.member_id = ?
            ORDER BY p.recorded_at DESC
        `;
        db.query(sql, [memberId], callback);
    },

    findById: (id, callback) => {
        const sql = `
            SELECT
                p.participation_id, p.meeting_id, p.member_id, p.activity,
                p.points, p.remarks, p.recorded_at,
                m.first_name, m.last_name, mt.title
            FROM participation p
            JOIN members m ON p.member_id = m.member_id
            JOIN meetings mt ON p.meeting_id = mt.meeting_id
            WHERE p.participation_id = ?
        `;
        db.query(sql, [id], callback);
    },

    update: (id, data, callback) => {
        const sql = `
            UPDATE participation
            SET activity = ?, points = ?, remarks = ?
            WHERE participation_id = ?
        `;
        const params = [
            data.activity,
            data.points || 0,
            data.remarks || null,
            id
        ];
        db.query(sql, params, callback);
    },

    delete: (id, callback) => {
        db.query("DELETE FROM participation WHERE participation_id = ?", [id], callback);
    },

    getMemberPoints: (memberId, callback) => {
        const sql = `
            SELECT COALESCE(SUM(points), 0) AS total_points
            FROM participation
            WHERE member_id = ?
        `;
        db.query(sql, [memberId], callback);
    },

    getParticipationTypes: (callback) => {
        db.query("SELECT * FROM participation_types ORDER BY default_points ASC", callback);
    }
};

module.exports = Participation;