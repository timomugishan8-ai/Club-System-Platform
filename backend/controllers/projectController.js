const Project = require("../models/Project");

const list = (req, res) => {
    Project.findAll((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load projects." });
        res.json({ projects: results });
    });
};

const getMine = (req, res) => {
    Project.findByMember(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load projects." });
        res.json({ projects: results });
    });
};

const getById = (req, res) => {
    Project.findById(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load project." });
        if (results.length === 0) return res.status(404).json({ message: "Project not found." });
        res.json({ project: results[0] });
    });
};

const create = (req, res) => {
    const { title, description, repo_url, status, start_date, end_date } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required." });
    }

    Project.create({
        title, description, repo_url, status, start_date, end_date,
        created_by: req.user.id
    }, (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to create project." });
        res.status(201).json({ message: "Project created.", project_id: result.insertId });
    });
};

const update = (req, res) => {
    const { title, description, repo_url, status, start_date, end_date } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required." });
    }

    Project.update(req.params.id, {
        title, description, repo_url, status, start_date, end_date
    }, (err) => {
        if (err) return res.status(500).json({ message: "Failed to update project." });
        res.json({ message: "Project updated." });
    });
};

const remove = (req, res) => {
    Project.delete(req.params.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete project." });
        res.json({ message: "Project deleted." });
    });
};

const getMembers = (req, res) => {
    Project.getMembers(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load members." });
        res.json({ members: results });
    });
};

const addMember = (req, res) => {
    const { member_id, role } = req.body;
    if (!member_id) {
        return res.status(400).json({ message: "member_id is required." });
    }
    Project.addMember(req.params.id, member_id, role, (err) => {
        if (err) return res.status(500).json({ message: "Failed to add member." });
        res.json({ message: "Member added to project." });
    });
};

const removeMember = (req, res) => {
    Project.removeMember(req.params.id, req.params.memberId, (err) => {
        if (err) return res.status(500).json({ message: "Failed to remove member." });
        res.json({ message: "Member removed from project." });
    });
};

module.exports = {
    list, getMine, getById, create, update, remove,
    getMembers, addMember, removeMember
};