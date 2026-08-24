const Attendance = require("../models/Attendance");

const record = (req, res) => {
    const { meeting_id, member_id, status, check_in_time, remarks } = req.body;

    if (!meeting_id || !member_id) {
        return res.status(400).json({ message: "meeting_id and member_id are required." });
    }

    Attendance.create({
        meeting_id, member_id, status, check_in_time, remarks
    }, (err) => {
        if (err) return res.status(500).json({ message: "Failed to record attendance." });
        res.status(201).json({ message: "Attendance recorded." });
    });
};

const bulkRecord = (req, res) => {
    const meetingId = req.params.meetingId;
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: "records array is required." });
    }

    Attendance.bulkCreate(meetingId, records, (err) => {
        if (err) return res.status(500).json({ message: "Failed to record attendance." });
        res.json({ message: "Attendance recorded for all members." });
    });
};

const getByMeeting = (req, res) => {
    Attendance.findByMeeting(req.params.meetingId, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load attendance." });
        res.json({ attendance: results });
    });
};

const getByMember = (req, res) => {
    const memberId = req.params.memberId === "me" ? req.user.id : req.params.memberId;
    Attendance.findByMember(memberId, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load attendance." });
        res.json({ attendance: results });
    });
};

const getMyStats = (req, res) => {
    Attendance.getMemberStats(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load stats." });
        res.json({ stats: results[0] });
    });
};

const update = (req, res) => {
    const { status, check_in_time, remarks } = req.body;
    Attendance.update(req.params.id, { status, check_in_time, remarks }, (err) => {
        if (err) return res.status(500).json({ message: "Failed to update attendance." });
        res.json({ message: "Attendance updated." });
    });
};

const remove = (req, res) => {
    Attendance.delete(req.params.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete attendance." });
        res.json({ message: "Attendance deleted." });
    });
};

module.exports = { record, bulkRecord, getByMeeting, getByMember, getMyStats, update, remove };