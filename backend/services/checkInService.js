const db = require("../config/db");
const QRToken = require("../models/QRToken");
const Attendance = require("../models/Attendance");
const pointService = require("./pointService");

// Read the grace window (minutes after start_time that still counts as
// "Present"). Falls back to 15 when unset or malformed.
const getGraceMinutes = (callback) => {
    db.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'late_grace_minutes' LIMIT 1",
        (err, rows) => {
            if (err || rows.length === 0) return callback(null, 15);
            const parsed = parseInt(rows[0].setting_value, 10);
            callback(null, Number.isFinite(parsed) && parsed >= 0 ? parsed : 15);
        }
    );
};

// Derive Present/Late from scan time vs meeting start + grace window.
// Meetings without a start_time always count as Present.
const resolveStatus = (startTime, graceMinutes) => {
    if (!startTime) return "Present";

    const now = new Date();
    const [h, m] = String(startTime).split(":").map(Number);
    const start = new Date(now);
    start.setHours(h || 0, m || 0, 0, 0);

    const minutesLate = Math.floor((now - start) / 60000);
    return minutesLate <= graceMinutes ? "Present" : "Late";
};

// Compare by calendar day in local time, regardless of whether the driver
// returned a Date or a "YYYY-MM-DD" string (which Date() parses as UTC).
const toDayKey = (value) => {
    if (value instanceof Date) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
    }
    return String(value).slice(0, 10);
};

const checkIn = (memberId, tokenValue, callback) => {
    QRToken.findByTokenValue(tokenValue, (err, tokens) => {
        if (err) return callback({ status: 500, message: "Check-in failed." });
        const token = tokens[0];
        if (!token) return callback({ status: 404, message: "Invalid or expired check-in code. Ask a leader to display the QR code." });

        if (token.expires_at && new Date(token.expires_at) < new Date()) {
            return callback({ status: 410, message: "This check-in code has expired. Ask a leader to display the QR code." });
        }

        db.query(
            "SELECT meeting_id, meeting_date, start_time, title FROM meetings WHERE meeting_id = ? LIMIT 1",
            [token.meeting_id],
            (err, meetings) => {
                if (err) return callback({ status: 500, message: "Check-in failed." });
                const meeting = meetings[0];
                if (!meeting) return callback({ status: 404, message: "Meeting not found." });

                // QR codes are single-day artifacts: the token must be
                // scanned on the meeting's own date.
                const todayKey = toDayKey(new Date());
                const meetingDayKey = toDayKey(meeting.meeting_date);
                if (meetingDayKey !== todayKey) {
                    return callback({ status: 410, message: "This check-in code is not for today's meeting." });
                }

                getGraceMinutes((err, grace) => {
                    if (err) return callback({ status: 500, message: "Check-in failed." });
                    const status = resolveStatus(meeting.start_time, grace);
                    const now = new Date();
                    const checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

                    // A member already has a record if they re-scan or a leader
                    // recorded them manually. First record wins: re-scans must
                    // not overwrite an earlier Present with Late (the scan
                    // happens minutes later, past the grace window) nor clobber
                    // a leader's manual entry.
                    Attendance.findByMeetingAndMember(meeting.meeting_id, memberId, (err, existing) => {
                        if (err) return callback({ status: 500, message: "Check-in failed." });
                        if (existing) {
                            return callback(null, {
                                status: existing.status,
                                check_in_time: existing.check_in_time,
                                already_checked_in: true,
                                meeting: {
                                    meeting_id: meeting.meeting_id,
                                    title: meeting.title,
                                    meeting_date: meeting.meeting_date,
                                    start_time: meeting.start_time
                                }
                            });
                        }

                        Attendance.create({
                            meeting_id: meeting.meeting_id,
                            member_id: memberId,
                            status,
                            check_in_time: checkInTime,
                            remarks: "QR check-in"
                        }, (err) => {
                            if (err) return callback({ status: 500, message: "Check-in failed." });

                            // Idempotent: awards only the first time per meeting,
                            // so re-scans are harmless.
                            pointService.awardAttendancePoints(meeting.meeting_id, memberId, status, () => {
                                pointService.awardStreakBonus(memberId, () => {
                                    callback(null, {
                                        status,
                                        check_in_time: checkInTime,
                                        meeting: {
                                            meeting_id: meeting.meeting_id,
                                            title: meeting.title,
                                            meeting_date: meeting.meeting_date,
                                            start_time: meeting.start_time
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            }
        );
    });
};

module.exports = { checkIn, getGraceMinutes, resolveStatus };