const Member = require("../models/Member");

const listPending = (req, res) => {
    Member.findPending((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load pending members." });
        res.json({ pending: results });
    });
};

const approve = (req, res) => {
    const memberId = req.params.id;
    const adminId = req.user.id;

    Member.updateApprovalStatus(memberId, "Approved", adminId, (err) => {
        if (err) return res.status(500).json({ message: "Approval failed." });
        res.json({ message: "Member approved." });
    });
};

const reject = (req, res) => {
    const memberId = req.params.id;
    const adminId = req.user.id;

    Member.updateApprovalStatus(memberId, "Rejected", adminId, (err) => {
        if (err) return res.status(500).json({ message: "Rejection failed." });
        res.json({ message: "Member rejected." });
    });
};

module.exports = { listPending, approve, reject };