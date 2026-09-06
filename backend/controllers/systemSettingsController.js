const db = require("../config/db");

const EDITABLE_KEYS = [
    "tier_rookie_min",
    "tier_rising_star_min",
    "tier_bronze_min",
    "tier_silver_min",
    "tier_gold_min",
    "tier_diamond_min",
    "github_weight",
    "attendance_weight",
    "late_grace_minutes"
];

const getSettings = (req, res) => {
    db.query(
        `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (${EDITABLE_KEYS.map(() => "?").join(",")})`,
        EDITABLE_KEYS,
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Failed to load settings." });
            const settings = {};
            (rows || []).forEach((r) => { settings[r.setting_key] = r.setting_value; });
            res.json({ settings });
        }
    );
};

const updateSettings = (req, res) => {
    const updates = req.body || {};
    const keys = Object.keys(updates).filter((k) => EDITABLE_KEYS.includes(k));
    if (keys.length === 0) {
        return res.status(400).json({ message: "No valid settings provided." });
    }

    let pending = keys.length;
    let failed = false;
    keys.forEach((key) => {
        const raw = updates[key];
        const value = key.endsWith("_weight")
            ? String(parseFloat(raw) || 0)
            : String(parseInt(raw, 10) || 0);
        db.query(
            "UPDATE system_settings SET setting_value = ? WHERE setting_key = ?",
            [value, key],
            (err) => {
                if (err) failed = true;
                pending--;
                if (pending === 0) {
                    if (failed) return res.status(500).json({ message: "Failed to update settings." });
                    res.json({ message: "Settings updated." });
                }
            }
        );
    });
};

module.exports = { getSettings, updateSettings };