const db = require("../config/db");

const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user || !req.user.role_name) {
            return res.status(403).json({ message: "Forbidden: role not resolved." });
        }

        if (!allowedRoles.includes(req.user.role_name)) {
            return res.status(403).json({
                message: "Forbidden: insufficient permissions."
            });
        }

        next();
    };
};

const loadRoleName = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized." });
    }

    const sql = `
        SELECT r.role_name
        FROM members m
        JOIN roles r ON m.role_id = r.role_id
        WHERE m.member_id = ?
    `;

    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Failed to verify role." });
        }
        if (results.length === 0) {
            return res.status(403).json({ message: "Forbidden: member not found." });
        }

        req.user.role_name = results[0].role_name;
        next();
    });
};

module.exports = { requireRole, loadRoleName };