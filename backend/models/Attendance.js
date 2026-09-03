const db = require("../config/db");

const Attendance = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO attendance (meeting_id, member_id, status, check_in_time, remarks)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                check_in_time = VALUES(check_in_time),
                remarks = VALUES(remarks)
        `;
        const params = [
            data.meeting_id,
            data.member_id,
            data.status || "Absent",
            data.check_in_time || null,
            data.remarks || null
        ];
        db.query(sql, params, callback);
    },

    bulkCreate: (meetingId, records, callback) => {
        if (!records || records.length === 0) {
            return callback(null, { affectedRows: 0 });
        }

        const values = records.map((r) => [
            meetingId,
            r.member_id,
            r.status || "Absent",
            r.check_in_time || null,
            r.remarks || null
        ]);

        const sql = `
            INSERT INTO attendance (meeting_id, member_id, status, check_in_time, remarks)
            VALUES ?
            ON DUPLICATE KEY UPDATE
                status = VALUES(status),
                check_in_time = VALUES(check_in_time),
                remarks = VALUES(remarks)
        `;
        db.query(sql, [values], callback);
    },

    findByMeeting: (meetingId, callback) => {
        const sql = `
            SELECT
                a.attendance_id, a.status, a.check_in_time, a.remarks,
                m.member_id, m.first_name, m.last_name, m.student_number
            FROM attendance a
            JOIN members m ON a.member_id = m.member_id
            WHERE a.meeting_id = ?
            ORDER BY m.first_name, m.last_name
        `;
        db.query(sql, [meetingId], callback);
    },

    findByMember: (memberId, callback) => {
        const sql = `
            SELECT
                a.attendance_id, a.status, a.check_in_time, a.remarks,
                mt.meeting_id, mt.title, mt.meeting_date
            FROM attendance a
            JOIN meetings mt ON a.meeting_id = mt.meeting_id
            WHERE a.member_id = ?
            ORDER BY mt.meeting_date DESC
        `;
        db.query(sql, [memberId], callback);
    },

    update: (attendanceId, data, callback) => {
        const sql = `
            UPDATE attendance
            SET status = ?, check_in_time = ?, remarks = ?
            WHERE attendance_id = ?
        `;
        const params = [
            data.status || "Absent",
            data.check_in_time || null,
            data.remarks || null,
            attendanceId
        ];
        db.query(sql, params, callback);
    },

    delete: (attendanceId, callback) => {
        db.query("DELETE FROM attendance WHERE attendance_id = ?", [attendanceId], callback);
    },

    getMemberStats: (memberId, callback) => {
        const sql = `
            SELECT
                COUNT(*) AS total,
                SUM(status = 'Present') AS present,
                SUM(status = 'Late') AS late,
                SUM(status = 'Absent') AS absent,
                SUM(status = 'Excused') AS excused
            FROM attendance
            WHERE member_id = ?
        `;
        db.query(sql, [memberId], callback);
    },

    findAllRecords: (callback) => {
        const sql = `
            SELECT
                a.attendance_id, a.status, a.check_in_time, a.remarks,
                m.member_id, m.first_name, m.last_name, m.avatar_url,
                mt.meeting_id, mt.title, mt.meeting_date
            FROM attendance a
            JOIN members m ON a.member_id = m.member_id
            JOIN meetings mt ON a.meeting_id = mt.meeting_id
            ORDER BY mt.meeting_date DESC, m.first_name ASC
            LIMIT 500
        `;
        db.query(sql, callback);
    }
};

module.exports = Attendance;