jest.mock("../config/db", () => {
    const { checkInMockDb } = require("./mockCheckInDb");
    return checkInMockDb;
});

jest.mock("../models/QRToken", () => {
    const { checkInMockDb } = require("./mockCheckInDb");
    return checkInMockDb.qrTokenModel;
});

jest.mock("../models/Attendance", () => {
    const { checkInMockDb } = require("./mockCheckInDb");
    return checkInMockDb.attendanceModel;
});

jest.mock("../services/pointService", () => {
    const { checkInMockDb } = require("./mockCheckInDb");
    return {
        awardAttendancePoints: (meetingId, memberId, status, callback) => {
            checkInMockDb.awardCalls.push({ meetingId, memberId, status });
            callback(null);
        },
        awardStreakBonus: (memberId, callback) => callback(null)
    };
});

const { checkInMockDb } = require("./mockCheckInDb");
const checkInService = require("../services/checkInService");

const today = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

beforeEach(() => {
    checkInMockDb.reset();
});

describe("checkInService", () => {
    test("marks Present when scanned within the grace window", (done) => {
        checkInMockDb.setUpValidToken({ grace: 15, startTime: "23:59" });
        checkInService.checkIn(7, "tok", (err, result) => {
            expect(err).toBeNull();
            expect(result.status).toBe("Present");
            expect(result.meeting.meeting_id).toBe(2);
            expect(checkInMockDb.createdAttendance.status).toBe("Present");
            expect(checkInMockDb.awardCalls).toEqual([
                { meetingId: 2, memberId: 7, status: "Present" }
            ]);
            done();
        });
    });

    test("marks Late when scanned after the grace window", (done) => {
        checkInMockDb.setUpValidToken({ grace: 0, startTime: "00:00" });
        checkInService.checkIn(7, "tok", (err, result) => {
            expect(err).toBeNull();
            expect(result.status).toBe("Late");
            done();
        });
    });

    test("rejects unknown tokens", (done) => {
        checkInMockDb.setUpValidToken({ grace: 15 });
        checkInService.checkIn(7, "wrong-token", (err) => {
            expect(err.status).toBe(404);
            expect(checkInMockDb.createdAttendance).toBeNull();
            done();
        });
    });

    test("rejects scans on a different day than the meeting", (done) => {
        checkInMockDb.setUpValidToken({ grace: 15, meetingDate: "2000-01-01" });
        checkInService.checkIn(7, "tok", (err) => {
            expect(err.status).toBe(410);
            done();
        });
    });

    test("falls back to a 15-minute grace when the setting is missing", (done) => {
        checkInMockDb.setUpValidToken({ grace: null, startTime: "23:59" });
        checkInService.checkIn(7, "tok", (err, result) => {
            expect(err).toBeNull();
            expect(result.status).toBe("Present");
            done();
        });
    });

    test("meetings without a start_time always count as Present", (done) => {
        checkInMockDb.setUpValidToken({ grace: 0, startTime: null });
        checkInService.checkIn(7, "tok", (err, result) => {
            expect(err).toBeNull();
            expect(result.status).toBe("Present");
            done();
        });
    });

    test("re-scan returns the existing record instead of overwriting it", (done) => {
        checkInMockDb.setUpValidToken({ grace: 0, startTime: "00:00" });
        // Member already checked in Present (e.g. within the grace window)
        checkInMockDb.existingAttendance = {
            attendance_id: 9,
            status: "Present",
            check_in_time: "08:00",
            remarks: "QR check-in"
        };
        checkInService.checkIn(7, "tok", (err, result) => {
            expect(err).toBeNull();
            expect(result.already_checked_in).toBe(true);
            expect(result.status).toBe("Present");
            // No new attendance row created; no new points awarded
            expect(checkInMockDb.createdAttendance).toBeNull();
            expect(checkInMockDb.awardCalls).toHaveLength(0);
            done();
        });
    });
});