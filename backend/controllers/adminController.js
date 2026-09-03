const db = require("../config/db");
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

// Admin-only role management: promote Member -> Leader (and back).
// Guards: Admin role itself is never assignable, and admin accounts are
// never modified — keeps the admin account neutral by design.
const PROMOTABLE = { Member: 3, Leader: 2 };

const setRole = (req, res) => {
    const memberId = req.params.id;
    const { role } = req.body || {};

    if (!PROMOTABLE[role]) {
        return res.status(400).json({ message: "Role must be 'Member' or 'Leader'." });
    }

    db.query(
        `SELECT m.role_id, r.role_name
         FROM members m JOIN roles r ON m.role_id = r.role_id
         WHERE m.member_id = ?`,
        [memberId],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Failed to verify member." });
            if (results_empty(rows)) {
                return res.status(404).json({ message: "Member not found." });
            }
            if (Number(rows[0].role_id) === 1) {
                return res.status(400).json({ message: "The admin account's role cannot be changed." });
            }

            const newRoleId = PROMOTABLE[role];
            if (Number(rows[0].role_id) === newRoleId) {
                return res.json({ message: `Member is already a ${role}.`, role });
            }

            Member.updateRole(memberId, newRoleId, (err) => {
                if (err) return res.status(500).json({ message: "Role change failed." });

                const msg = role === "Leader"
                    ? "You have been promoted to Chapter Leader. You can now manage meetings, attendance, events, and review articles."
                    : "Your role has been changed to Chapter Member.";
                notifyMember(memberId, "role_change", role === "Leader" ? "Promoted to Leader" : "Role Updated", msg);

                res.json({ message: `Member is now a ${role}.`, role });
            });
        }
    );
};

// tiny helper kept local to avoid noise
const results_empty = (rows) => !rows || rows.length === 0;

module.exports = { listPending, approve, reject, setRole };