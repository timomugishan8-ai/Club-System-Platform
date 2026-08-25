const db = require("../config/db");
const Participation = require("../models/Participation");
const badgeService = require("./badgeService");

const ATTENDANCE_ACTIVITY = {
    Present: { name: "Attendance Bonus", points: 2, pillar: "Attendance & Participation" },
    Late: { name: "Late Attendance", points: 1, pillar: "Attendance & Participation" },
    Absent: { name: "Absent Penalty", points: -2, pillar: "Attendance & Participation" }
};

const RESERVED_ATTENDANCE_ACTIVITIES = [
    "Attendance Bonus",
    "Late Attendance",
    "Absent Penalty"
];

const pointService = {
    awardAttendancePoints: (meetingId, memberId, status, callback) => {
        const rule = ATTENDANCE_ACTIVITY[status];
        if (!rule) {
            return callback(null);
        }

        const checkSql = `
            SELECT participation_id FROM participation
            WHERE meeting_id = ? AND member_id = ?
                AND activity IN (?, ?, ?)
            LIMIT 1
        `;
        db.query(
            checkSql,
            [meetingId, memberId, ...RESERVED_ATTENDANCE_ACTIVITIES],
            (err, rows) => {
                if (err) return callback(err);
                if (rows.length > 0) return callback(null);

                Participation.create({
                    meeting_id: meetingId,
                    member_id: memberId,
                    activity: rule.name,
                    points: rule.points,
                    pillar: rule.pillar,
                    remarks: "Auto-awarded from attendance"
                }, (err) => {
                    if (err) return callback(err);
                    badgeService.evaluateBadges(memberId, callback);
                });
            }
        );
    },

    awardAttendancePointsBulk: (meetingId, records, callback) => {
        if (!records || records.length === 0) {
            return callback(null);
        }

        let pending = records.length;
        if (pending === 0) return callback(null);

        let hadError = false;
        records.forEach((r) => {
            pointService.awardAttendancePoints(meetingId, r.member_id, r.status, (err) => {
                if (err && !hadError) {
                    hadError = true;
                    return callback(err);
                }
                pending--;
                if (pending === 0 && !hadError) callback(null);
            });
        });
    },

    awardStreakBonus: (memberId, callback) => {
        const sql = `
            SELECT meeting_date, status
            FROM attendance a
            JOIN meetings m ON a.meeting_id = m.meeting_id
            WHERE a.member_id = ?
                AND a.status IN ('Present', 'Late')
            ORDER BY m.meeting_date DESC
        `;
        db.query(sql, [memberId], (err, rows) => {
            if (err) return callback(err);
            if (rows.length === 0) return callback(null);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let streak = 0;
            for (const row of rows) {
                const d = new Date(row.meeting_date);
                d.setHours(0, 0, 0, 0);
                const diffDays = Math.round((today - d) / (1000 * 60 * 60 * 24));
                if (diffDays <= streak * 7 + 7) {
                    streak++;
                } else {
                    break;
                }
            }

            const streaks = [
                { weeks: 4, name: "Attendance Streak (4w)", points: 10 },
                { weeks: 8, name: "Attendance Streak (8w)", points: 25 },
                { weeks: 12, name: "Attendance Streak (12w)", points: 50 }
            ];

            let awarded = 0;
            let pendingStreaks = streaks.length;
            if (pendingStreaks === 0) return callback(null);

            streaks.forEach((s) => {
                if (streak >= s.weeks) {
                    const checkSql = `
                        SELECT participation_id FROM participation
                        WHERE member_id = ? AND activity = ?
                        LIMIT 1
                    `;
                    db.query(checkSql, [memberId, s.name], (err, existing) => {
                        pendingStreaks--;
                        if (err || existing.length > 0) {
                            if (pendingStreaks === 0 && awarded === 0) return callback(null);
                            return;
                        }

                        const lastMeetingSql = `
                            SELECT meeting_id FROM meetings
                            ORDER BY meeting_date DESC LIMIT 1
                        `;
                        db.query(lastMeetingSql, (err, meetings) => {
                            if (err || meetings.length === 0) return;
                            Participation.create({
                                meeting_id: meetings[0].meeting_id,
                                member_id: memberId,
                                activity: s.name,
                                points: s.points,
                                pillar: "Attendance & Participation",
                                remarks: "Auto-awarded streak bonus"
                            }, () => {
                                awarded++;
                                if (pendingStreaks === 0) callback(null);
                            });
                        });
                    });
                } else {
                    pendingStreaks--;
                    if (pendingStreaks === 0 && awarded === 0) callback(null);
                }
            });
        });
    },

    awardProjectJoined: (memberId, meetingId, callback) => {
        const checkSql = `
            SELECT participation_id FROM participation
            WHERE member_id = ? AND activity = 'Project Joined'
            LIMIT 1
        `;
        db.query(checkSql, [memberId], (err, rows) => {
            if (err) return callback(err);
            if (rows.length > 0) return callback(null);

            Participation.create({
                meeting_id: meetingId,
                member_id: memberId,
                activity: "Project Joined",
                points: 10,
                pillar: "Projects & GitHub",
                remarks: "Auto-awarded for joining a project"
            }, (err) => {
                if (err) return callback(err);
                badgeService.evaluateBadges(memberId, callback);
            });
        });
    },

    awardProjectCompleted: (memberId, meetingId, projectId, callback) => {
        const checkSql = `
            SELECT participation_id FROM participation
            WHERE member_id = ? AND activity = 'Project Completed'
                AND remarks LIKE ?
            LIMIT 1
        `;
        db.query(checkSql, [memberId, `%project:${projectId}%`], (err, rows) => {
            if (err) return callback(err);
            if (rows.length > 0) return callback(null);

            Participation.create({
                meeting_id: meetingId,
                member_id: memberId,
                activity: "Project Completed",
                points: 40,
                pillar: "Projects & GitHub",
                remarks: `Auto-awarded for completing project (project:${projectId})`
            }, (err) => {
                if (err) return callback(err);
                badgeService.evaluateBadges(memberId, callback);
            });
        });
    },

    awardGitHubPoints: (memberId, stats, callback) => {
        const { commit_count, pr_count, issue_count, repo_count, star_count } = stats;
        const githubPoints = (commit_count || 0) + (pr_count || 0) * 2 + (issue_count || 0);

        const sql = `
            SELECT participation_id FROM participation
            WHERE member_id = ? AND activity = 'GitHub PR Merged'
            LIMIT 1
        `;
        db.query(sql, [memberId], (err, rows) => {
            if (err) return callback(err);
            if (rows.length > 0) return callback(null);

            const lastMeetingSql = "SELECT meeting_id FROM meetings ORDER BY meeting_date DESC LIMIT 1";
            db.query(lastMeetingSql, (err, meetings) => {
                if (err || meetings.length === 0) return callback(null);

                const totalPrPoints = (pr_count || 0) * 2;
                if (totalPrPoints > 0) {
                    Participation.create({
                        meeting_id: meetings[0].meeting_id,
                        member_id: memberId,
                        activity: "GitHub PR Merged",
                        points: totalPrPoints,
                        pillar: "Projects & GitHub",
                        remarks: "Auto-awarded from GitHub refresh"
                    }, () => {
                        badgeService.evaluateBadges(memberId, callback);
                    });
                } else {
                    badgeService.evaluateBadges(memberId, callback);
                }
            });
        });
    },

    awardArticlePublished: (authorId, articleId, callback) => {
        const lastMeetingSql = "SELECT meeting_id FROM meetings ORDER BY meeting_date DESC LIMIT 1";
        db.query(lastMeetingSql, (err, meetings) => {
            if (err || meetings.length === 0) return callback(err || new Error("No meeting found"));

            Participation.create({
                meeting_id: meetings[0].meeting_id,
                member_id: authorId,
                activity: "Article Published",
                points: 25,
                pillar: "Technical Skills",
                remarks: `Auto-awarded for publishing article (article:${articleId})`
            }, (err) => {
                if (err) return callback(err);
                badgeService.evaluateBadges(authorId, callback);
            });
        });
    },

    awardArticleLike: (authorId, articleId, callback) => {
        const checkSql = `
            SELECT COALESCE(SUM(points), 0) AS current_points
            FROM participation
            WHERE member_id = ? AND activity = 'Article Like'
                AND remarks LIKE ?
        `;
        db.query(checkSql, [authorId, `%article:${articleId}%`], (err, rows) => {
            if (err) return callback(err);
            const currentPoints = rows[0].current_points || 0;
            if (currentPoints >= 50) return callback(null);

            const likeCountSql = "SELECT COUNT(*) AS n FROM article_likes WHERE article_id = ?";
            db.query(likeCountSql, [articleId], (err, likeRows) => {
                if (err) return callback(err);
                const likeCount = likeRows[0].n || 0;
                const newPoints = Math.min(likeCount, 50) - currentPoints;
                if (newPoints <= 0) return callback(null);

                const lastMeetingSql = "SELECT meeting_id FROM meetings ORDER BY meeting_date DESC LIMIT 1";
                db.query(lastMeetingSql, (err, meetings) => {
                    if (err || meetings.length === 0) return callback(null);

                    Participation.create({
                        meeting_id: meetings[0].meeting_id,
                        member_id: authorId,
                        activity: "Article Like",
                        points: newPoints,
                        pillar: "Community Contribution",
                        remarks: `Auto-awarded for article likes (article:${articleId})`
                    }, callback);
                });
            });
        });
    }
};

module.exports = pointService;