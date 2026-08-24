const path = require("path");
const fs = require("fs");
const Resource = require("../models/Resource");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const list = (req, res) => {
    Resource.findAll((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load resources." });
        res.json({ resources: results });
    });
};

const getById = (req, res) => {
    Resource.findById(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load resource." });
        if (results.length === 0) return res.status(404).json({ message: "Resource not found." });
        res.json({ resource: results[0] });
    });
};

const create = (req, res) => {
    const { title, description, category, difficulty, link_url } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required." });
    }

    let filePath = null;
    let fileSize = null;

    if (req.file) {
        filePath = `/uploads/${req.file.filename}`;
        fileSize = req.file.size;
    }

    if (!link_url && !filePath) {
        return res.status(400).json({
            message: "Either link_url or a file upload is required."
        });
    }

    Resource.create({
        title, description, category, difficulty, link_url,
        file_path: filePath, file_size: fileSize,
        uploaded_by: req.user.id
    }, (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to create resource." });
        res.status(201).json({
            message: "Resource created.",
            resource_id: result.insertId
        });
    });
};

const update = (req, res) => {
    const { title, description, category, difficulty, link_url } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required." });
    }

    Resource.update(req.params.id, {
        title, description, category, difficulty, link_url
    }, (err) => {
        if (err) return res.status(500).json({ message: "Failed to update resource." });
        res.json({ message: "Resource updated." });
    });
};

const remove = (req, res) => {
    Resource.findById(req.params.id, (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: "Resource not found." });
        }

        const resource = results[0];

        Resource.delete(req.params.id, (err) => {
            if (err) return res.status(500).json({ message: "Failed to delete resource." });

            if (resource.file_path) {
                const absPath = path.join(UPLOAD_DIR, path.basename(resource.file_path));
                fs.unlink(absPath, () => {});
            }

            res.json({ message: "Resource deleted." });
        });
    });
};

module.exports = { list, getById, create, update, remove };