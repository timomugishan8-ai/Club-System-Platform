const Event = require("../models/Event");

const list = (req, res) => {
    Event.findAll((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load events." });
        res.json({ events: results });
    });
};

const upcoming = (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 5;
    Event.findUpcoming(limit, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load upcoming events." });
        res.json({ events: results });
    });
};

const getById = (req, res) => {
    Event.findById(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load event." });
        if (results.length === 0) return res.status(404).json({ message: "Event not found." });
        res.json({ event: results[0] });
    });
};

const create = (req, res) => {
    const { title, description, event_type, venue, event_date, start_time, end_time, image_url } = req.body;

    if (!title || !event_date) {
        return res.status(400).json({ message: "title and event_date are required." });
    }

    Event.create({
        title, description, event_type, venue, event_date, start_time, end_time, image_url,
        created_by: req.user.id
    }, (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to create event." });
        res.status(201).json({ message: "Event created.", event_id: result.insertId });
    });
};

const update = (req, res) => {
    const { title, description, event_type, venue, event_date, start_time, end_time, image_url } = req.body;

    if (!title || !event_date) {
        return res.status(400).json({ message: "title and event_date are required." });
    }

    Event.update(req.params.id, {
        title, description, event_type, venue, event_date, start_time, end_time, image_url
    }, (err) => {
        if (err) return res.status(500).json({ message: "Failed to update event." });
        res.json({ message: "Event updated." });
    });
};

const remove = (req, res) => {
    Event.delete(req.params.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete event." });
        res.json({ message: "Event deleted." });
    });
};

const register = (req, res) => {
    Event.register(req.params.id, req.user.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to register." });
        res.json({ message: "Registered for event." });
    });
};

const unregister = (req, res) => {
    Event.unregister(req.params.id, req.user.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to unregister." });
        res.json({ message: "Unregistered from event." });
    });
};

const getRegistrations = (req, res) => {
    Event.getRegistrations(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load registrations." });
        res.json({ registrations: results });
    });
};

module.exports = {
    list, upcoming, getById, create, update, remove,
    register, unregister, getRegistrations
};