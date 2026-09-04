const db = require("../config/db");

const Committee = {
    findAll: (callback) => {
        db.query(
            `SELECT committee_id, committee_name, description,
                    (SELECT COUNT(*) FROM members m WHERE m.committee_id = c.committee_id) AS member_count
             FROM committees c
             ORDER BY c.committee_name`,
            callback
        );
    },

    create: (name, description, callback) => {
        db.query(
            "INSERT INTO committees (committee_name, description) VALUES (?, ?)",
            [name, description],
            callback
        );
    }
};

module.exports = Committee;