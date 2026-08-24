const Participation = require("../models/Participation");

const listTypes = (req, res) => {
    Participation.getParticipationTypes((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load participation types." });
        res.json({ types: results });
    });
};

const record = (req, res) => {
    const { meeting_id, member_id, activity, points, remarks } = req.body;

    if (!meeting_id || !member_id || !activity) {
        return res.status(400).json({
            message: "meeting_id, member_id and activity are required."
        });
    }

    Participation.create({
        meeting_id, member_id, activity, points, remarks
    }, (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to record participation." });
        res.status(201).json({
            message: "Participation recorded.",
            participation_id: result.insertId
        });
    });
};

const getByMeeting = (req, res) => {
    Participation.findByMeeting(req.params.meetingId, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load participation." });
        res.json({ participation: results });
    });
};

const getByMember = (req, res) => {
    const memberId = req.params.memberId === "me" ? req.user.id : req.params.memberId;
    Participation.findByMember(memberId, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load participation." });
        res.json({ participation: results });
    });
};

const getMyPoints = (req, res) => {
    Participation.getMemberPoints(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load points." });
        res.json({ total_points: results[0].total_points });
    });
};

const update = (req, res) => {
    const { activity, points, remarks } = req.body;

    if (!activity) {
        return res.status(400).json({ message: "activity is required." });
    }

    Participation.update(req.params.id, { activity, points, remarks }, (err) => {
        if (err) return res.status(500).json({ message: "Failed to update participation." });
        res.json({ message: "Participation updated." });
    });
};

const remove = (req, res) => {
    Participation.delete(req.params.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete participation." });
        res.json({ message: "Participation deleted." });
    });
};

module.exports = { listTypes, record, getByMeeting, getByMember, getMyPoints, update, remove };