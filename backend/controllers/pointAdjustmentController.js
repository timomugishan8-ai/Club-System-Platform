const PointAdjustment = require("../models/PointAdjustment");
const badgeService = require("../services/badgeService");

const PILLAR_ACTIVITIES = {
    "Attendance & Participation": [
        "Attendance Bonus", "Late Attendance", "Absent Penalty",
        "Asked Question", "Answered Question",
        "Attendance Streak (4w)", "Attendance Streak (8w)", "Attendance Streak (12w)"
    ],
    "Technical Skills": [
        "Presentation", "Workshop Facilitator", "In-Session Exercise",
        "Learning Module", "Article Published"
    ],
    "Projects & GitHub": [
        "Project Joined", "Project Completed",
        "GitHub PR Merged", "GitHub Issue Closed", "GitHub Repo Stars"
    ],
    "Community Contribution": [
        "Helped Solve Problem", "Shared Resources", "Volunteered",
        "Mentored Junior", "Organized Event", "Recruited Member",
        "Competition Winner", "Article Like"
    ],
    "Professional Growth": [
        "External Event", "Certification", "Internship",
        "Research Published", "Landed DS Role"
    ]
};

const DEFAULT_POINTS = {
    "Helped Solve Problem": 8,
    "Shared Resources": 5,
    "Volunteered": 15,
    "Mentored Junior": 20,
    "Organized Event": 25,
    "Recruited Member": 15,
    "Competition Winner": 50,
    "External Event": 15,
    "Certification": 50,
    "Internship": 75,
    "Research Published": 60,
    "Landed DS Role": 100,
    "Presentation": 20,
    "Workshop Facilitator": 30,
    "In-Session Exercise": 8,
    "Learning Module": 15,
    "Asked Question": 5,
    "Answered Question": 10
};

const create = (req, res) => {
    const { member_id, pillar, activity, points, remarks } = req.body;

    if (!member_id || !pillar || !activity) {
        return res.status(400).json({
            message: "member_id, pillar and activity are required."
        });
    }

    const validActivities = PILLAR_ACTIVITIES[pillar];
    if (!validActivities) {
        return res.status(400).json({ message: "Invalid pillar." });
    }
    if (!validActivities.includes(activity)) {
        return res.status(400).json({
            message: `Activity '${activity}' does not belong to pillar '${pillar}'.`
        });
    }

    const finalPoints = points != null ? points : (DEFAULT_POINTS[activity] || 0);

    PointAdjustment.create({
        member_id,
        pillar,
        activity,
        points: finalPoints,
        remarks,
        awarded_by: req.user.id
    }, (err) => {
        if (err) return res.status(500).json({ message: "Failed to record point adjustment." });
        badgeService.evaluateBadges(member_id, () => {
            res.status(201).json({ message: "Points awarded." });
        });
    });
};

const getByMember = (req, res) => {
    const memberId = req.params.memberId === "me" ? req.user.id : req.params.memberId;
    PointAdjustment.findByMember(memberId, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load point adjustments." });
        res.json({ adjustments: results });
    });
};

const remove = (req, res) => {
    PointAdjustment.delete(req.params.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete point adjustment." });
        res.json({ message: "Point adjustment deleted." });
    });
};

const getActivities = (req, res) => {
    res.json({ pillars: PILLAR_ACTIVITIES, default_points: DEFAULT_POINTS });
};

module.exports = { create, getByMember, remove, getActivities };