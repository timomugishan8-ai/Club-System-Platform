// Test double for the QR check-in service: drives QRToken, Attendance,
// and the system_settings lookup without touching MySQL.
const checkInMockDb = {
    tokenRows: [],
    settingValue: "15",
    meetingRow: null,
    createdAttendance: null,
    existingAttendance: null,
    awardCalls: [],

    reset() {
        this.tokenRows = [];
        this.settingValue = "15";
        this.meetingRow = null;
        this.createdAttendance = null;
        this.existingAttendance = null;
        this.awardCalls = [];
    },

    // Default fixture: an active token for meeting 2, meeting scheduled today
    setUpValidToken({ grace, meetingDate, startTime }) {
        const pad = (n) => String(n).padStart(2, "0");
        const d = meetingDate ? new Date(meetingDate) : new Date();
        const dateStr = meetingDate
            ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
            : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        this.tokenRows = [{ qr_token_id: 1, meeting_id: 2, token: "tok", is_active: 1, expires_at: null }];
        this.settingValue = grace === null ? "" : String(grace);
        this.meetingRow = {
            meeting_id: 2,
            meeting_date: dateStr,
            start_time: startTime,
            title: "QR Test Meeting"
        };
    },

    qrTokenModel: {
        findByTokenValue: (token, callback) =>
            callback(null, token === "tok" ? checkInMockDb.tokenRows : []),
        findActiveByMeeting: (meetingId, callback) => callback(null, checkInMockDb.tokenRows),
        create: (data, callback) => callback(null, { insertId: 1 }),
        deactivate: (id, callback) => callback(null),
        countCheckIns: (meetingId, callback) => callback(null, [{ total: 0, present: 0, late: 0 }])
    },

    attendanceModel: {
        create: (data, callback) => {
            checkInMockDb.createdAttendance = data;
            callback(null, { insertId: 1 });
        },
        findByMeetingAndMember: (meetingId, memberId, callback) =>
            callback(null, checkInMockDb.existingAttendance)
    }
};

checkInMockDb.query = (sql, params, callback) => {
    if (typeof params === "function") {
        callback = params;
    }
    const sqlLower = sql.toLowerCase();

    if (sqlLower.includes("system_settings") && sqlLower.includes("late_grace_minutes")) {
        return callback(null, checkInMockDb.settingValue === ""
            ? []
            : [{ setting_value: checkInMockDb.settingValue }]);
    }

    if (sqlLower.includes("from meetings where meeting_id")) {
        return callback(null, checkInMockDb.meetingRow ? [checkInMockDb.meetingRow] : []);
    }

    return callback(new Error(`Unexpected SQL in test: ${sql.replace(/\s+/g, " ").trim()}`));
};

module.exports = { checkInMockDb };