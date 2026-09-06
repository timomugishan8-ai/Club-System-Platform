jest.mock("../config/db", () => {
    const { githubMockDb } = require("./mockGithubDb");
    return githubMockDb;
});

jest.mock("../models/GitHubContribution", () => {
    const { githubMockDb } = require("./mockGithubDb");
    return githubMockDb.contributionModel;
});

const { githubMockDb } = require("./mockGithubDb");

// Load aggregateStats through the service module without executing
// refresh logic (models/db are mocked above).
const loadService = () => require("../services/githubService");

beforeEach(() => {
    githubMockDb.reset();
});

describe("githubService aggregateStats (strict scoring)", () => {
    test("excludes forked repos from repo and star counts", () => {
        const service = loadService();
        const repos = [
            { fork: false, stargazers_count: 10 },
            { fork: false, stargazers_count: 5 },
            { fork: true, stargazers_count: 250 },
        ];
        const stats = service.aggregateStatsForTest(repos, []);
        expect(stats.repo_count).toBe(2);
        expect(stats.star_count).toBe(15);
    });

    test("counts only merged PRs, deduplicated", () => {
        const service = loadService();
        const repos = [];
        const events = [
            { type: "PullRequestEvent", repo: { id: 1 }, payload: { action: "opened", pull_request: { number: 7 } } },
            { type: "PullRequestEvent", repo: { id: 1 }, payload: { action: "closed", pull_request: { number: 7, merged: true } } },
            { type: "PullRequestEvent", repo: { id: 1 }, payload: { action: "closed", pull_request: { number: 8, merged: false } } },
        ];
        const stats = service.aggregateStatsForTest(repos, events);
        expect(stats.pr_count).toBe(1);
    });

    test("counts pushes and issues as before", () => {
        const service = loadService();
        const repos = [];
        const events = [
            { type: "PushEvent", payload: { size: 3 } },
            { type: "PushEvent", payload: { size: 2 } },
            { type: "IssuesEvent", repo: { id: 2 }, payload: { action: "opened", issue: { number: 4 } } },
        ];
        const stats = service.aggregateStatsForTest(repos, events);
        expect(stats.commit_count).toBe(5);
        expect(stats.issue_count).toBe(1);
    });
});