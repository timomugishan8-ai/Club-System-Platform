const crypto = require("crypto");
const QRToken = require("../models/QRToken");
const db = require("../config/db");
const checkInService = require("../services/checkInService");

// Admin/Leader: show the live QR screen for a meeting (generates a token
// on first use, rotates the old one otherwise)
const getToken = (req, res) => {
    const meetingId = req.params.meetingId;

    QRToken.findActiveByMeeting(meetingId, (err, tokens) => {
        if (err) return res.status(500).json({ message: "Failed to load check-in code." });

        const finish = (token) => {
            QRToken.countCheckIns(meetingId, (err, counts) => {
                res.json({
                    token: token.token,
                    expires_at: token.expires_at,
                    created_at: token.created_at,
                    check_ins: counts ? {
                        total: counts[0]?.total || 0,
                        present: counts[0]?.present || 0,
                        late: counts[0]?.late || 0
                    } : { total: 0, present: 0, late: 0 }
                });
            });
        };

        if (tokens.length > 0) return finish(tokens[0]);

        const token = crypto.randomUUID();
        QRToken.create({
            meeting_id: meetingId,
            token,
            created_by: req.user.id
        }, (err) => {
            if (err) return res.status(500).json({ message: "Failed to create check-in code." });
            QRToken.findActiveByMeeting(meetingId, (err, fresh) => {
                if (err || fresh.length === 0) return res.status(500).json({ message: "Failed to load check-in code." });
                finish(fresh[0]);
            });
        });
    });
};

// Admin/Leader: invalidate the current code (e.g. end of meeting, leaked)
const rotateToken = (req, res) => {
    const meetingId = req.params.meetingId;

    QRToken.findActiveByMeeting(meetingId, (err, tokens) => {
        if (err) return res.status(500).json({ message: "Failed to rotate check-in code." });

        const deactivateThenCreate = (next) => {
            const token = crypto.randomUUID();
            QRToken.create({
                meeting_id: meetingId,
                token,
                created_by: req.user.id
            }, (err) => {
                if (err) return res.status(500).json({ message: "Failed to rotate check-in code." });
                res.json({ token });
            });
        };

        if (tokens.length > 0) {
            QRToken.deactivate(tokens[0].qr_token_id, (err) => {
                if (err) return res.status(500).json({ message: "Failed to rotate check-in code." });
                deactivateThenCreate();
            });
        } else {
            deactivateThenCreate();
        }
    });
};

// Member: POST { token } — records attendance with automatic Present/Late
const checkIn = (req, res) => {
    const { token } = req.body || {};
    if (!token) {
        return res.status(400).json({ message: "Check-in token is required." });
    }

    checkInService.checkIn(req.user.id, String(token).trim(), (err, result) => {
        if (err) return res.status(err.status || 500).json({ message: err.message });
        res.json({
            message: result.status === "Late"
                ? "You're checked in — marked Late."
                : "You're checked in — on time!",
            ...result
        });
    });
};

// Member: lightweight token preview so the scan landing page can show
// "Scanning for <meeting>" before login round-trips
const previewToken = (req, res) => {
    const tokenValue = String(req.params.token || "").trim();
    QRToken.findByTokenValue(tokenValue, (err, tokens) => {
        if (err || tokens.length === 0) {
            return res.json({ valid: false });
        }
        const t = tokens[0];
        db.query(
            "SELECT title, meeting_date, venue, start_time FROM meetings WHERE meeting_id = ? LIMIT 1",
            [t.meeting_id],
            (err, meetings) => {
                if (err || meetings.length === 0) return res.json({ valid: false });
                const m = meetings[0];
                res.json({
                    valid: true,
                    meeting: {
                        title: m.title,
                        meeting_date: m.meeting_date,
                        venue: m.venue,
                        start_time: m.start_time
                    }
                });
            }
        );
    });
};

module.exports = { getToken, rotateToken, checkIn, previewToken };
