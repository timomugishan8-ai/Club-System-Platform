// Test double for githubService: minimal db + contribution model stubs so
// the module can load and aggregateStats can be exercised.
const githubMockDb = {
    upserts: [],
    daily: [],
    repos: [],
    streak: 0,

    reset() {
        this.upserts = [];
        this.daily = [];
        this.repos = [];
        this.streak = 0;
    },

    contributionModel: {
        upsertSummary: (memberId, stats, callback) => {
            githubMockDb.upserts.push(stats);
            callback(null);
        },
        replaceDailyActivity: (memberId, rows, callback) => {
            githubMockDb.daily = rows;
            callback(null);
        },
        replaceRepositories: (memberId, rows, callback) => {
            githubMockDb.repos = rows;
            callback(null);
        },
        getStreak: (memberId, callback) => callback(null, githubMockDb.streak)
    }
};

githubMockDb.query = (sql, params, callback) => {
    if (typeof params === "function") {
        callback = params;
    }
    if (String(sql).toLowerCase().includes("github_handle")) {
        return callback(null, []);
    }
    return callback(new Error(`Unexpected SQL in test: ${String(sql).replace(/\s+/g, " ").trim()}`));
};

module.exports = { githubMockDb };