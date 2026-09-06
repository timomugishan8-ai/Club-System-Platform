// Human-readable catalog for every badge rule: what it takes, how to get
// there, and which live counters drive its progress display. Keyed by the
// rule_key stored in the badges table.
const BADGE_CATALOG = {
    python_explorer: {
        criteria: "Complete 1 Python project",
        how_to_earn: [
            "Create or join a project whose title, description, or repo name mentions Python",
            "Work on it until its status becomes Completed",
        ],
        progress_metric: "python_projects",
    },
    data_analyst: {
        criteria: "Give 1 presentation",
        how_to_earn: [
            "Present at a chapter meeting (talk, demo, or dataset walkthrough)",
            "A leader records your Presentation in the participation log",
        ],
        progress_metric: "presentations",
    },
    git_master: {
        criteria: "Reach 10 GitHub commits",
        how_to_earn: [
            "Link your GitHub handle in Profile → Settings",
            "Push commits regularly — your total updates at each GitHub refresh",
        ],
        progress_metric: "commits",
    },
    consistency_star: {
        criteria: "Attend 4 meetings in a row, one week apart",
        how_to_earn: [
            "Show up (Present or Late) 4 weeks consecutively",
            "Missing a week breaks the chain — attendance is recorded via QR check-in or by a leader",
        ],
        progress_metric: "attendance_streak",
    },
    git_champion: {
        criteria: "Reach 50 GitHub commits AND 5 merged pull requests",
        how_to_earn: [
            "Push at least 50 commits across your repos",
            "Open pull requests and get them merged (a PR only counts once it is merged)",
        ],
        progress_metric: "champion_commits_prs",
    },
    community_builder: {
        criteria: "Answer 5 questions in meetings",
        how_to_earn: [
            "Help fellow members by answering their questions during sessions",
            "A leader records each 'Answered Question' in the participation log",
        ],
        progress_metric: "answered_questions",
    },
    r_rookie: {
        criteria: "Complete 1 R project",
        how_to_earn: [
            "Create or join a project whose title, description, or repo name mentions R",
            "Work on it until its status becomes Completed",
        ],
        progress_metric: "r_projects",
    },
    r_master: {
        criteria: "Complete 3 R projects",
        how_to_earn: [
            "Same as R Rookie, but finish three separate R projects",
            "Projects must be marked Completed to count",
        ],
        progress_metric: "r_projects",
    },
    viz_guru: {
        criteria: "Give 3 presentations",
        how_to_earn: [
            "Present three times at chapter meetings",
            "Presentations are recorded in the participation log by leaders",
        ],
        progress_metric: "presentations",
    },
    model_builder: {
        criteria: "Facilitate 1 workshop",
        how_to_earn: [
            "Run a hands-on workshop for the chapter (e.g. intro to ML, git basics)",
            "A leader records your 'Workshop Facilitator' participation",
        ],
        progress_metric: "workshops",
    },
};

module.exports = BADGE_CATALOG;