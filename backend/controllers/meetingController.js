const Meeting = require("../models/Meeting");

const list = (req, res) => {
    Meeting.findAll((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load meetings." });
        res.json({ meetings: results });
    });
};

const upcoming = (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 5;
    Meeting.findUpcoming(limit, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load upcoming meetings." });
        res.json({ meetings: results });
    });
};

const getById = (req, res) => {
    Meeting.findById(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load meeting." });
        if (results.length === 0) return res.status(404).json({ message: "Meeting not found." });
        res.json({ meeting: results[0] });
    });
};

const create = (req, res) => {
    const { title, topic, description, venue, meeting_date, start_time, end_time } = req.body;

    if (!title || !meeting_date) {
        return res.status(400).json({ message: "title and meeting_date are required." });
    }

    Meeting.create({
        title, topic, description, venue, meeting_date, start_time, end_time,
        created_by: req.user.id
    }, (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to create meeting." });
        res.status(201).json({ message: "Meeting created.", meeting_id: result.insertId });
    });
};

const update = (req, res) => {
    const { title, topic, description, venue, meeting_date, start_time, end_time } = req.body;

    if (!title || !meeting_date) {
        return res.status(400).json({ message: "title and meeting_date are required." });
    }

    Meeting.update(req.params.id, {
        title, topic, description, venue, meeting_date, start_time, end_time
    }, (err) => {
        if (err) return res.status(500).json({ message: "Failed to update meeting." });
        res.json({ message: "Meeting updated." });
    });
};

const remove = (req, res) => {
    Meeting.delete(req.params.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete meeting." });
        res.json({ message: "Meeting deleted." });
    });
};

module.exports = { list, upcoming, getById, create, update, remove };