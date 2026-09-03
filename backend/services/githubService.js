const db = require("../config/db");
const GitHubContribution = require("../models/GitHubContribution");

const GITHUB_API = "https://api.github.com";

const headers = () => {
    const h = {
        Accept: "application/vnd.github+json",
        // GitHub API requires a User-Agent; requests without one are refused.
        "User-Agent": "ds-chapter-tracker",
    };
    if (process.env.GITHUB_TOKEN) {
        h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    return h;
};

const ghFetch = async (url, retries = 2) => {
    try {
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
    } catch (err) {
        // Transient network/socket errors: retry, then surface the failure.
        if (
            retries > 0 &&
            err &&
            (err.cause?.code === "ECONNRESET" ||
                err.cause?.code === "UND_ERR_SOCKET" ||
                /fetch failed|socket hang up/i.test(String(err.message)))
        ) {
            await new Promise((r) => setTimeout(r, 400));
            return ghFetch(url, retries - 1);
        }
        throw err;
    }
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
    const prKeys = new Set();
    const issueKeys = new Set();

    for (const event of events) {
        const payload = event.payload || {};
        if (event.type === "PushEvent") {
            // payload.commits is capped at 20 per push; payload.size carries the true total.
            commitCount += payload.size || (payload.commits ? payload.commits.length : 0);
        } else if (event.type === "PullRequestEvent") {
            // Deduplicate: one PR fires many events (opened, closed, synchronized, ...).
            const pr = payload.pull_request;
            if (pr) prKeys.add(`${event.repo ? event.repo.id : "r"}:${pr.number}`);
        } else if (event.type === "IssuesEvent") {
            const issue = payload.issue;
            if (issue) issueKeys.add(`${event.repo ? event.repo.id : "r"}:${issue.number}`);
        }
    }

    const prCount = prKeys.size;
    const issueCount = issueKeys.size;

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
    return map;
};

// GitHub GraphQL: contributionsCollection returns a full year of daily
// contribution counts (commits, PRs, issues across all public repos) —
// history the REST events API cannot provide. Requires a token.
const fetchContributionCalendar = async (handle) => {
    if (!process.env.GITHUB_TOKEN) return null;

    const query = `
        query($login: String!) {
            user(login: $login) {
                contributionsCollection {
                    contributionCalendar {
                        totalContributions
                        weeks {
                            contributionDays {
                                date
                                contributionCount
                            }
                        }
                    }
                    totalCommitContributions
                    totalPullRequestContributions
                    totalIssueContributions
                }
            }
        }
    `;

    try {
        const res = await fetch(`${GITHUB_API}/graphql`, {
            method: "POST",
            headers: {
                ...headers(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query, variables: { login: handle } })
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.errors || !data.data?.user?.contributionsCollection) return null;

        const cc = data.data.user.contributionsCollection;
        const calendar = cc.contributionCalendar;
        const daily = {};
        for (const week of calendar.weeks || []) {
            for (const day of week.contributionDays || []) {
                if (!day.date) continue;
                daily[day.date] = (daily[day.date] || 0) + (day.contributionCount || 0);
            }
        }
        return {
            daily,
            totals: {
                commit_count: calendar.totalContributions
                    ? cc.totalCommitContributions || 0
                    : 0,
                pr_count: cc.totalPullRequestContributions || 0,
                issue_count: cc.totalIssueContributions || 0,
                contributions_total: calendar.totalContributions || 0
            }
        };
    } catch {
        // GraphQL failure must never break the REST-based refresh.
        return null;
    }
};

const refreshForMember = (memberId, githubHandle) => {
    return new Promise(async (resolve, reject) => {
        if (!githubHandle) {
            return reject(new Error("No GitHub handle set for this member."));
        }

        try {
            // Verify the handle exists on GitHub so a typo doesn't silently
            // wipe existing stats with zeros (/repos & /events return 404).
            const user = await ghFetch(`${GITHUB_API}/users/${githubHandle}`);
            if (!user) {
                return reject(new Error(
                    `GitHub user '${githubHandle}' not found. Check the handle or profile link saved in your profile settings.`
                ));
            }

            const [repos, events, ghYear] = await Promise.all([
                fetchAllRepos(githubHandle),
                fetchUserEvents(githubHandle),
                fetchContributionCalendar(githubHandle)
            ]);

            const stats = aggregateStats(repos, events);

            // GraphQL totals cover the past year across all repos — far more
            // accurate than REST events (~90 days), so they win when present.
            if (ghYear) {
                stats.commit_count = ghYear.totals.commit_count;
                stats.pr_count = ghYear.totals.pr_count;
                stats.issue_count = ghYear.totals.issue_count;
            }

            // Merge REST events (~90 days) with the GraphQL year calendar so
            // the heatmap covers the full past year when a token is configured.
            const dailyMap = { ...buildDailyActivity(events), ...(ghYear ? ghYear.daily : {}) };
            const daily = Object.entries(dailyMap)
                .map(([date, count]) => ({ date, count }))
                .filter((d) => d.count > 0);

            const repoRows = repos.map((r) => ({
                github_repo_id: r.id,
                name: r.name,
                full_name: r.full_name,
                description: r.description,
                html_url: r.html_url,
                language: r.language,
                star_count: r.stargazers_count,
                fork_count: r.forks_count,
                is_fork: !!r.fork,
                pushed_at: r.pushed_at ? r.pushed_at.replace("T", " ").replace("Z", "") : null
            }));

            GitHubContribution.upsertSummary(memberId, stats, (err) => {
                if (err) return reject(err);

                GitHubContribution.replaceDailyActivity(memberId, daily, (err) => {
                    if (err) return reject(err);

                    GitHubContribution.replaceRepositories(memberId, repoRows, (err) => {
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
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Refresh every member that has a GitHub handle linked. Used by the nightly
// scheduler and callable from an admin trigger. Serialized to stay under the
// GitHub rate limit (60 req/hr unauthenticated, 5000 with a token).
const refreshAllMembers = async ({ onResult } = {}) => {
    const members = await new Promise((resolve, reject) => {
        db.query(
            "SELECT member_id, github_handle FROM members WHERE github_handle IS NOT NULL AND github_handle != ''",
            (err, rows) => (err ? reject(err) : resolve(rows))
        );
    });

    const results = { refreshed: 0, failed: 0, skipped: 0, errors: [] };

    for (const member of members) {
        try {
            await refreshForMember(member.member_id, member.github_handle);
            results.refreshed++;
            if (onResult) onResult(null, member);
        } catch (error) {
            results.failed++;
            results.errors.push({ member_id: member.member_id, message: error.message });
            if (onResult) onResult(error, member);
        }
        // Small delay between members to spread API calls out.
        await new Promise((r) => setTimeout(r, 250));
    }

    return results;
};

// Nightly scheduler: runs once a day at the configured hour (default 03:00).
// Interval-based check so a server restart simply re-arms the timer.
const startNightlyRefresh = ({ hour = 3 } = {}) => {
    const hasRunToday = () => {
        const run = new Date();
        run.setHours(hour, 0, 0, 0);
        const last = lastRunAt ? new Date(lastRunAt) : null;
        return last && last >= run;
    };

    let lastRunAt = null;
    let running = false;

    const tick = async () => {
        const now = new Date();
        if (now.getHours() !== hour || running || hasRunToday()) return;
        running = true;
        lastRunAt = now.toISOString();
        try {
            const results = await refreshAllMembers();
            console.log(
                `[github] nightly refresh: ${results.refreshed} refreshed, ` +
                `${results.failed} failed, ${results.skipped} skipped`
            );
        } catch (error) {
            console.error("[github] nightly refresh failed:", error.message);
        } finally {
            running = false;
        }
    };

    const timer = setInterval(tick, 15 * 60 * 1000); // check every 15 min
    timer.unref(); // don't hold the process open just for this

    return { stop: () => clearInterval(timer) };
};

module.exports = { refreshForMember, refreshAllMembers, startNightlyRefresh };