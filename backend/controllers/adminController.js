const Member = require("../models/Member");
const { notifyMember } = require("../services/notificationService");

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

        notifyMember(
            memberId,
            "approval",
            "Account Approved",
            "Your Data Science Chapter account has been approved. You can now log in."
        );

        res.json({ message: "Member approved." });
    });
};

const reject = (req, res) => {
    const memberId = req.params.id;
    const adminId = req.user.id;

    Member.updateApprovalStatus(memberId, "Rejected", adminId, (err) => {
        if (err) return res.status(500).json({ message: "Rejection failed." });

        notifyMember(
            memberId,
            "approval",
            "Account Update",
            "Your Data Science Chapter account application has been rejected. Contact an administrator for details."
        );

        res.json({ message: "Member rejected." });
    });
};

module.exports = { listPending, approve, reject };