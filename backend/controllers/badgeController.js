const Badge = require("../models/Badge");
const BADGE_CATALOG = require("../services/badgeCatalog");

const getAllBadges = (req, res) => {
    Badge.findAll((err, badges) => {
        if (err) return res.status(500).json({ message: "Failed to load badges." });
        res.json({ badges });
    });
};

const getMyBadges = (req, res) => {
    Badge.findByMember(req.user.id, (err, badges) => {
        if (err) return res.status(500).json({ message: "Failed to load badges." });
        res.json({ badges });
    });
};

const getMemberBadges = (req, res) => {
    Badge.findByMember(req.params.memberId, (err, badges) => {
        if (err) return res.status(500).json({ message: "Failed to load badges." });
        res.json({ badges });
    });
};

const getMyBadgeCount = (req, res) => {
    Badge.countByMember(req.user.id, (err, count) => {
        if (err) return res.status(500).json({ message: "Failed to load badge count." });
        res.json({ badges_earned: count });
    });
};

// Progress display spec per metric: [current, target, label]
const METRIC_SPECS = {
    python_projects: { target: 1, label: "Python projects completed" },
    presentations: { target: 3, label: "Presentations given" },
    commits: { target: 10, label: "GitHub commits" },
    answered_questions: { target: 5, label: "Questions answered" },
    r_projects: { target: 3, label: "R projects completed" },
    workshops: { target: 1, label: "Workshops facilitated" },
};

// Per-badge requirement shape used by the catalog UI. For combined metrics
// (like git_champion) a list of requirements is returned.
const buildRequirement = (metric, current, overrideTarget, overrideLabel) => {
    const spec = METRIC_SPECS[metric] || { target: 1, label: metric };
    return {
        current: Math.min(current, overrideTarget || spec.target),
        target: overrideTarget || spec.target,
        label: overrideLabel || spec.label,
    };
};

const getBadgeCatalog = (req, res) => {
    Badge.findAll((err, badges) => {
        if (err) return res.status(500).json({ message: "Failed to load badges." });

        // Live progress for the requesting member (admins get zeros —
        // the admin account doesn't earn badges)
        Badge.getProgressMetrics(req.user.id, (err, metrics) => {
            if (err) return res.status(500).json({ message: "Failed to load badge progress." });
            Badge.getAttendanceStreak(req.user.id, (err, streak) => {
                const attendanceStreak = err ? 0 : (streak || 0);

                Badge.findByMember(req.user.id, (err, earnedRows) => {
                    if (err) return res.status(500).json({ message: "Failed to load badges." });
                    const earnedIds = new Set((earnedRows || []).map((b) => b.badge_id));

                    const catalog = badges.map((badge) => {
                        const cat = BADGE_CATALOG[badge.rule_key] || {};
                        const metric = cat.progress_metric;

                        let requirements = [];
                        if (metric === "champion_commits_prs") {
                            requirements = [
                                buildRequirement("commits", metrics.commits || 0, 50, "GitHub commits"),
                                buildRequirement("merged_prs", metrics.merged_prs || 0, 5, "Merged pull requests"),
                            ];
                        } else if (metric === "attendance_streak") {
                            requirements = [
                                buildRequirement("attendance_streak", attendanceStreak, 4, "Weekly attendance streak"),
                            ];
                        } else if (metric === "commits") {
                            requirements = [
                                buildRequirement("commits", metrics.commits || 0, 10),
                            ];
                        } else if (metric === "presentations") {
                            // data_analyst needs 1 presentation; viz_guru needs 3
                            requirements = [
                                buildRequirement("presentations", metrics.presentations || 0,
                                    badge.rule_key === "viz_guru" ? 3 : 1),
                            ];
                        } else if (metric === "r_projects") {
                            // r_rookie needs 1 R project; r_master needs 3
                            requirements = [
                                buildRequirement("r_projects", metrics.r_projects || 0,
                                    badge.rule_key === "r_master" ? 3 : 1),
                            ];
                        } else if (metric === "merged_prs") {
                            requirements = [
                                buildRequirement("merged_prs", metrics.merged_prs || 0, 5),
                            ];
                        } else if (metric) {
                            requirements = [
                                buildRequirement(metric, metrics[metric] || 0),
                            ];
                        }

                        return {
                            badge_id: badge.badge_id,
                            name: badge.name,
                            description: badge.description,
                            icon: badge.icon,
                            color: badge.color,
                            pillar: badge.pillar,
                            earned: earnedIds.has(badge.badge_id),
                            criteria: cat.criteria || badge.description,
                            how_to_earn: cat.how_to_earn || [],
                            requirements,
                        };
                    });

                    res.json({ badges: catalog });
                });
            });
        });
    });
};

module.exports = {
    getAllBadges,
    getMyBadges,
    getMemberBadges,
    getMyBadgeCount,
    getBadgeCatalog
};