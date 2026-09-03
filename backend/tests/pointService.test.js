jest.mock("../config/db", () => {
    const { mockDb } = require("./mockDb");
    return mockDb;
});

jest.mock("../services/badgeService", () => ({
    evaluateBadges: jest.fn((memberId, callback) => callback(null)),
    evaluateMember: jest.fn()
}));

jest.mock("../models/Participation", () => {
    const { mockDb } = require("./mockDb");
    return {
        create: (data, callback) => {
            mockDb.insertedParticipation.push(data);
            callback(null, { insertId: mockDb.insertedParticipation.length });
        }
    };
});

const { mockDb } = require("./mockDb");
const badgeService = require("../services/badgeService");

const loadService = () => require("../services/pointService");

const DAY = 24 * 60 * 60 * 1000;

const makeWeeklyRows = (count, startDaysAgo = 7) => {
    const rows = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
        const d = new Date(today.getTime() - (startDaysAgo + i * 7) * DAY);
        rows.push({ meeting_date: d, status: "Present" });
    }
    return rows;
};

beforeEach(() => {
    mockDb.reset();
    jest.clearAllMocks();
});

describe("pointService", () => {
    describe("awardAttendancePoints", () => {
        test("awards 2 points for Present and creates participation record", (done) => {
            const pointService = loadService();
            pointService.awardAttendancePoints(1, 10, "Present", (err) => {
                expect(err).toBeNull();
                expect(mockDb.insertedParticipation).toHaveLength(1);
                const insert = mockDb.insertedParticipation[0];
                expect(insert.points).toBe(2);
                expect(insert.activity).toBe("Attendance Bonus");
                expect(insert.pillar).toBe("Attendance & Participation");
                expect(insert.meeting_id).toBe(1);
                expect(insert.member_id).toBe(10);
                expect(badgeService.evaluateBadges).toHaveBeenCalledWith(10, expect.any(Function));
                done();
            });
        });

        test("awards 1 point for Late", (done) => {
            const pointService = loadService();
            pointService.awardAttendancePoints(1, 10, "Late", () => {
                const insert = mockDb.insertedParticipation[0];
                expect(insert.points).toBe(1);
                expect(insert.activity).toBe("Late Attendance");
                done();
            });
        });

        test("awards -2 points for Absent", (done) => {
            const pointService = loadService();
            pointService.awardAttendancePoints(1, 10, "Absent", () => {
                const insert = mockDb.insertedParticipation[0];
                expect(insert.points).toBe(-2);
                expect(insert.activity).toBe("Absent Penalty");
                done();
            });
        });

        test("does nothing for unknown status", (done) => {
            const pointService = loadService();
            pointService.awardAttendancePoints(1, 10, "Maybe", (err) => {
                expect(err).toBeNull();
                expect(mockDb.insertedParticipation).toHaveLength(0);
                done();
            });
        });

        test("does not duplicate points if already awarded", (done) => {
            mockDb.hasExistingAttendanceActivity = true;
            const pointService = loadService();
            pointService.awardAttendancePoints(1, 10, "Present", (err) => {
                expect(err).toBeNull();
                expect(mockDb.insertedParticipation).toHaveLength(0);
                done();
            });
        });

        test("skips admins entirely (neutral account)", (done) => {
            mockDb.memberIsAdmin = true;
            const pointService = loadService();
            pointService.awardAttendancePoints(1, 1, "Present", (err) => {
                expect(err).toBeNull();
                expect(mockDb.insertedParticipation).toHaveLength(0);
                pointService.awardGitHubPoints(1, { pr_count: 5 }, (err2) => {
                    expect(err2).toBeNull();
                    expect(mockDb.insertedParticipation).toHaveLength(0);
                    expect(badgeService.evaluateBadges).not.toHaveBeenCalled();
                    done();
                });
            });
        });
    });

    describe("awardAttendancePointsBulk", () => {
        test("calls back once after all records processed", (done) => {
            const pointService = loadService();
            const records = [
                { member_id: 1, status: "Present" },
                { member_id: 2, status: "Absent" },
                { member_id: 3, status: "Present" }
            ];
            let calls = 0;
            pointService.awardAttendancePointsBulk(1, records, () => {
                calls++;
                expect(calls).toBe(1);
                expect(mockDb.insertedParticipation).toHaveLength(3);
                done();
            });
        });

        test("empty records calls back immediately", (done) => {
            const pointService = loadService();
            pointService.awardAttendancePointsBulk(1, [], (err) => {
                expect(err).toBeNull();
                expect(mockDb.insertedParticipation).toHaveLength(0);
                done();
            });
        });
    });

    describe("awardStreakBonus", () => {
        test("awards 4-week streak when 4 weekly attendances exist", (done) => {
            mockDb.attendanceRows = makeWeeklyRows(4);
            const pointService = loadService();
            pointService.awardStreakBonus(10, () => {
                const insert = mockDb.insertedParticipation[0];
                expect(insert.points).toBe(10);
                expect(insert.activity).toBe("Attendance Streak (4w)");
                done();
            });
        });

        test("awards 8-week streak when 8 weekly attendances exist", (done) => {
            mockDb.attendanceRows = makeWeeklyRows(8);
            const pointService = loadService();
            pointService.awardStreakBonus(10, () => {
                const activities = mockDb.insertedParticipation.map((p) => p.activity);
                expect(activities).toEqual(
                    expect.arrayContaining(["Attendance Streak (4w)", "Attendance Streak (8w)"])
                );
                done();
            });
        });

        test("no award when fewer than 4 attendances", (done) => {
            mockDb.attendanceRows = makeWeeklyRows(2);
            const pointService = loadService();
            pointService.awardStreakBonus(10, () => {
                expect(mockDb.insertedParticipation).toHaveLength(0);
                done();
            });
        });
    });

    describe("awardProjectJoined", () => {
        test("awards 10 points first time only", (done) => {
            const pointService = loadService();
            pointService.awardProjectJoined(10, 1, () => {
                expect(mockDb.insertedParticipation[0].points).toBe(10);
                mockDb.hasExistingProjectJoined = true;
                pointService.awardProjectJoined(10, 1, () => {
                    expect(mockDb.insertedParticipation).toHaveLength(1);
                    done();
                });
            });
        });
    });

    describe("awardProjectCompleted", () => {
        test("awards 40 points once per project", (done) => {
            const pointService = loadService();
            pointService.awardProjectCompleted(10, 1, 5, () => {
                expect(mockDb.insertedParticipation[0].points).toBe(40);
                expect(mockDb.insertedParticipation[0].remarks).toContain("project:5");
                mockDb.hasExistingProjectCompleted = true;
                pointService.awardProjectCompleted(10, 1, 5, () => {
                    expect(mockDb.insertedParticipation).toHaveLength(1);
                    done();
                });
            });
        });
    });

    describe("awardGitHubPoints", () => {
        test("awards 2 points per PR", (done) => {
            const pointService = loadService();
            pointService.awardGitHubPoints(
                10,
                { pr_count: 3, commit_count: 5, issue_count: 2, repo_count: 1, star_count: 0 },
                () => {
                    expect(mockDb.insertedParticipation[0].points).toBe(6);
                    expect(mockDb.insertedParticipation[0].activity).toBe("GitHub PR Merged");
                    done();
                }
            );
        });

        test("tops up points when PR count grows since last refresh", (done) => {
            mockDb.existingGitHubPoints = 6; // 3 PRs already awarded
            const pointService = loadService();
            pointService.awardGitHubPoints(10, { pr_count: 5 }, () => {
                expect(mockDb.insertedParticipation).toHaveLength(1);
                expect(mockDb.insertedParticipation[0].points).toBe(4);
                expect(badgeService.evaluateBadges).toHaveBeenCalledWith(10, expect.any(Function));
                done();
            });
        });

        test("awards nothing when PR count has not grown", (done) => {
            mockDb.existingGitHubPoints = 6; // 3 PRs already awarded
            const pointService = loadService();
            pointService.awardGitHubPoints(10, { pr_count: 3 }, () => {
                expect(mockDb.insertedParticipation).toHaveLength(0);
                expect(badgeService.evaluateBadges).toHaveBeenCalled();
                done();
            });
        });

        test("no PRs means no participation record but badges still evaluated", (done) => {
            const pointService = loadService();
            pointService.awardGitHubPoints(10, { pr_count: 0 }, () => {
                expect(mockDb.insertedParticipation).toHaveLength(0);
                expect(badgeService.evaluateBadges).toHaveBeenCalled();
                done();
            });
        });
    });

    describe("awardArticlePublished", () => {
        test("awards 25 points for published article", (done) => {
            const pointService = loadService();
            pointService.awardArticlePublished(10, 7, () => {
                const insert = mockDb.insertedParticipation[0];
                expect(insert.points).toBe(25);
                expect(insert.pillar).toBe("Technical Skills");
                expect(insert.remarks).toContain("article:7");
                done();
            });
        });
    });

    describe("awardArticleLike", () => {
        test("awards points equal to like count capped at 50", (done) => {
            mockDb.articleLikeCount = 60;
            const pointService = loadService();
            pointService.awardArticleLike(10, 3, () => {
                const insert = mockDb.insertedParticipation[0];
                expect(insert.points).toBe(50);
                expect(insert.pillar).toBe("Community Contribution");
                done();
            });
        });

        test("awards only remaining points when some already awarded", (done) => {
            mockDb.articleLikeCount = 30;
            mockDb.existingLikePoints = 20;
            const pointService = loadService();
            pointService.awardArticleLike(10, 3, () => {
                expect(mockDb.insertedParticipation[0].points).toBe(10);
                done();
            });
        });

        test("no points when cap already reached", (done) => {
            mockDb.existingLikePoints = 50;
            const pointService = loadService();
            pointService.awardArticleLike(10, 3, () => {
                expect(mockDb.insertedParticipation).toHaveLength(0);
                done();
            });
        });
    });
});