const mockDb = {
    insertedParticipation: [],
    hasExistingAttendanceActivity: false,
    hasExistingProjectJoined: false,
    hasExistingProjectCompleted: false,
    attendanceRows: [],
    articleLikeCount: 0,
    existingLikePoints: 0,
    existingGitHubPoints: 0,
    memberIsAdmin: false,

    reset() {
        this.insertedParticipation = [];
        this.hasExistingAttendanceActivity = false;
        this.hasExistingProjectJoined = false;
        this.hasExistingProjectCompleted = false;
        this.attendanceRows = [];
        this.articleLikeCount = 0;
        this.existingLikePoints = 0;
        this.existingGitHubPoints = 0;
        this.memberIsAdmin = false;
    },

    query(sql, params, callback) {
        if (typeof params === "function") {
            callback = params;
        }
        if (!callback) callback = () => {};
        const sqlLower = sql.toLowerCase();

        const isParticipationCheck =
            sqlLower.includes("from participation") &&
            sqlLower.includes("select participation_id");

        if (isParticipationCheck && sqlLower.includes("activity in")) {
            return callback(null, this.hasExistingAttendanceActivity ? [{ participation_id: 1 }] : []);
        }

        if (isParticipationCheck && sqlLower.includes("remarks like ?")) {
            if (sqlLower.includes("project completed")) {
                return callback(null, this.hasExistingProjectCompleted ? [{ participation_id: 1 }] : []);
            }
            if (sqlLower.includes("article like")) {
                return callback(null, [{ current_points: this.existingLikePoints }]);
            }
        }

        if (isParticipationCheck && sqlLower.includes("activity = 'github pr merged'")) {
            return callback(null, [{ awarded_points: this.existingGitHubPoints }]);
        }

        if (sqlLower.includes("coalesce(sum(points), 0)") && sqlLower.includes("github pr merged")) {
            return callback(null, [{ awarded_points: this.existingGitHubPoints }]);
        }

        if (isParticipationCheck && sqlLower.includes("activity = ?")) {
            return callback(null, []);
        }

        if (isParticipationCheck && sqlLower.includes("remarks like ?")) {
            if (sqlLower.includes("project completed")) {
                return callback(null, this.hasExistingProjectCompleted ? [{ participation_id: 1 }] : []);
            }
            if (sqlLower.includes("article like")) {
                return callback(null, [{ current_points: this.existingLikePoints }]);
            }
        }

        if (isParticipationCheck && sqlLower.includes("project joined")) {
            return callback(null, this.hasExistingProjectJoined ? [{ participation_id: 1 }] : []);
        }

        if (sqlLower.includes("coalesce(sum(points), 0)") && sqlLower.includes("article like")) {
            return callback(null, [{ current_points: this.existingLikePoints }]);
        }

        if (sqlLower.includes("select r.role_name from members")) {
            return callback(null, this.memberIsAdmin ? [{ role_name: "Admin" }] : [{ role_name: "Member" }]);
        }

        if (sqlLower.includes("from attendance") && sqlLower.includes("join meetings")) {
            return callback(null, this.attendanceRows);
        }

        if (sqlLower.includes("count(*) as n from article_likes")) {
            return callback(null, [{ n: this.articleLikeCount }]);
        }

        if (sqlLower.includes("select meeting_id from meetings")) {
            return callback(null, [{ meeting_id: 999 }]);
        }

        return callback(new Error(`Unexpected SQL in test: ${sql.replace(/\s+/g, " ").trim()}`));
    }
};

module.exports = { mockDb, resetMockDb: () => mockDb.reset() };