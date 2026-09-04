const Committee = require("../models/Committee");

const list = (req, res) => {
    Committee.findAll((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load committees." });
        res.json({ committees: results });
    });
};

// Admin-only: add a new committee (e.g. "Welfare").
const create = (req, res) => {
    const { name, description } = req.body || {};
    if (!name || !String(name).trim()) {
        return res.status(400).json({ message: "Committee name is required." });
    }
    Committee.create(String(name).trim(), description || null, (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ message: "A committee with that name already exists." });
            }
            return res.status(500).json({ message: "Failed to create committee." });
        }
        res.status(201).json({ message: "Committee created.", committee_id: result.insertId, name });
    });
};

module.exports = { list, create };