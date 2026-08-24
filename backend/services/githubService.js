const db = require("../config/db");
const GitHubContribution = require("../models/GitHubContribution");

const GITHUB_API = "https://api.github.com";

const headers = () => {
    const h = { Accept: "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) {
        h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    return h;
};

const ghFetch = async (url) => {
    const res = await fetch(url, { headers: headers() });
    if (res.status === 404) return null;
    if (res.status === 403) {
        const remaining = res.headers.get("x-ratelimit-remaining");
        if (remaining === "0") {
            throw new Error("GitHub API rate limit exceeded.");
        }
    }
    if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
    }
    return res.json();
};

const fetchAllRepos = async (handle) => {
    const repos = [];
    let page = 1;
    while (page <= 10) {
        const batch = await ghFetch(
            `${GITHUB_API}/users/${handle}/repos?per_page=100&page=${page}&type=owner`
        );
        if (!batch || batch.length === 0) break;
        repos.push(...batch);
        if (batch.length < 100) break;
        page++;
    }
    return repos;
};

const fetchUserEvents = async (handle) => {
    const events = [];
    let page = 1;
    while (page <= 10) {
        const batch = await ghFetch(
            `${GITHUB_API}/users/${handle}/events?per_page=100&page=${page}`
        );
        if (!batch || batch.length === 0) break;
        events.push(...batch);
        if (batch.length < 100) break;
        page++;
    }
    return events;
};

const aggregateStats = (repos, events) => {
    let commitCount = 0;
    let prCount = 0;
    let issueCount = 0;

    for (const event of events) {
        if (event.type === "PushEvent") {
            commitCount += (event.payload && event.payload.commits)
                ? event.payload.commits.length
                : 0;
        } else if (event.type === "PullRequestEvent") {
            prCount += 1;
        } else if (event.type === "IssuesEvent") {
            issueCount += 1;
        }
    }

    const repoCount = repos.length;
    const starCount = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);

    return {
        repo_count: repoCount,
        commit_count: commitCount,
        pr_count: prCount,
        issue_count: issueCount,
        star_count: starCount,
        streak_days: 0
    };
};

const buildDailyActivity = (events) => {
    const map = {};
    for (const event of events) {
        const date = (event.created_at || "").slice(0, 10);
        if (!date) continue;
        map[date] = (map[date] || 0) + 1;
    }
    return Object.entries(map).map(([date, count]) => ({ date, count }));
};

const refreshForMember = (memberId, githubHandle) => {
    return new Promise(async (resolve, reject) => {
        if (!githubHandle) {
            return reject(new Error("No GitHub handle set for this member."));
        }

        try {
            const [repos, events] = await Promise.all([
                fetchAllRepos(githubHandle),
                fetchUserEvents(githubHandle)
            ]);

            const stats = aggregateStats(repos, events);
            const daily = buildDailyActivity(events);

            GitHubContribution.upsertSummary(memberId, stats, (err) => {
                if (err) return reject(err);

                GitHubContribution.replaceDailyActivity(memberId, daily, (err) => {
                    if (err) return reject(err);

                    GitHubContribution.getStreak(memberId, (err, streak) => {
                        if (err) return reject(err);

                        const finalStats = { ...stats, streak_days: streak };
                        GitHubContribution.upsertSummary(memberId, finalStats, (err) => {
                            if (err) return reject(err);
                            resolve(finalStats);
                        });
                    });
                });
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { refreshForMember };