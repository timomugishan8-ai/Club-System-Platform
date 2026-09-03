const Project = require("../models/Project");
const pointService = require("../services/pointService");
const badgeService = require("../services/badgeService");
const db = require("../config/db");

const list = (req, res) => {
    Project.findAll((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load projects." });
        res.json({ projects: results });
    });
};

const getMine = (req, res) => {
    Project.findByMember(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load projects." });
        res.json({ projects: results });
    });
};

// Projects a specific member participates in (for admin member views)
const getByMember = (req, res) => {
    Project.findByMember(req.params.memberId, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load projects." });
        res.json({ projects: results });
    });
};

// One call: every approved member with their GitHub repos (cached) and club
// project assignments. Powers the per-member "GitHub Projects" section
// without N+1 requests from the frontend.
const getOverviewByMember = (req, res) => {
    const db = require("../config/db");

    const membersSql = `
        SELECT member_id, first_name, last_name, github_handle
        FROM members
        WHERE approval_status = 'Approved' AND is_active = TRUE AND role_id != 1
        ORDER BY first_name, last_name
    `;
    const reposSql = `
        SELECT member_id, github_repo_id, name, full_name, description, html_url,
               language, star_count, fork_count, is_fork, pushed_at
        FROM github_repositories
        ORDER BY pushed_at DESC
    `;
    const assignedSql = `
        SELECT pm.member_id, p.project_id, p.title, p.description, p.repo_url,
               p.status, pm.role
        FROM project_members pm
        JOIN projects p ON pm.project_id = p.project_id
    `;
    const createdSql = `
        SELECT created_by AS member_id, project_id, title, description, repo_url,
               status, 'Creator' AS role
        FROM projects
    `;

    db.query(membersSql, (err, members) => {
        if (err) return res.status(500).json({ message: "Failed to load members." });
        db.query(reposSql, (err, repos) => {
            if (err) return res.status(500).json({ message: "Failed to load repositories." });
            db.query(assignedSql, (err, assigned) => {
                if (err) return res.status(500).json({ message: "Failed to load assignments." });
                db.query(createdSql, (err, created) => {
                    if (err) return res.status(500).json({ message: "Failed to load projects." });

                    const map = {};
                    for (const m of members || []) {
                        map[m.member_id] = {
                            member_id: m.member_id,
                            first_name: m.first_name,
                            last_name: m.last_name,
                            github_handle: m.github_handle,
                            repositories: [],
                            projects: [],
                        };
                    }
                    for (const r of repos || []) {
                        if (map[r.member_id]) {
                            map[r.member_id].repositories.push({
                                github_repo_id: r.github_repo_id,
                                name: r.name,
                                full_name: r.full_name,
                                description: r.description,
                                html_url: r.html_url,
                                language: r.language,
                                star_count: r.star_count,
                                fork_count: r.fork_count,
                                is_fork: !!r.is_fork,
                                pushed_at: r.pushed_at,
                            });
                        }
                    }
                    const addProject = (row, kind) => {
                        if (!map[row.member_id]) return;
                        map[row.member_id].projects.push({
                            kind,
                            project_id: row.project_id,
                            title: row.title,
                            description: row.description,
                            repo_url: row.repo_url,
                            status: row.status,
                            role: row.role,
                        });
                    };
                    (assigned || []).forEach((r) => addProject(r, r.role));
                    (created || []).forEach((r) => addProject(r, 'Creator'));

                    res.json({ members: Object.values(map) });
                });
            });
        });
    });
};

const getById = (req, res) => {
    Project.findById(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load project." });
        if (results.length === 0) return res.status(404).json({ message: "Project not found." });
        res.json({ project: results[0] });
    });
};

const create = (req, res) => {
    const { title, description, repo_url, status, start_date, end_date } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required." });
    }

    Project.create({
        title, description, repo_url, status, start_date, end_date,
        created_by: req.user.id
    }, (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to create project." });
        res.status(201).json({ message: "Project created.", project_id: result.insertId });
    });
};

const update = (req, res) => {
    const { title, description, repo_url, status, start_date, end_date } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required." });
    }

    Project.findById(req.params.id, (err, before) => {
        if (err || before.length === 0) {
            return res.status(404).json({ message: "Project not found." });
        }

        const wasCompleted = before[0].status === "Completed";
        const willComplete = status === "Completed";

        Project.update(req.params.id, {
            title, description, repo_url, status, start_date, end_date
        }, (err) => {
            if (err) return res.status(500).json({ message: "Failed to update project." });

            if (!wasCompleted && willComplete) {
                const lastMeetingSql = "SELECT meeting_id FROM meetings ORDER BY meeting_date DESC LIMIT 1";
                db.query(lastMeetingSql, (err, meetings) => {
                    if (err || meetings.length === 0) {
                        return res.json({ message: "Project updated." });
                    }

                    Project.getMembers(req.params.id, (err, members) => {
                        if (err || !members.length) {
                            return res.json({ message: "Project updated." });
                        }

                        let pending = members.length;
                        if (pending === 0) return res.json({ message: "Project updated." });

                        members.forEach((m) => {
                            pointService.awardProjectCompleted(
                                m.member_id, meetings[0].meeting_id, req.params.id, () => {
                                    pending--;
                                    if (pending === 0) res.json({ message: "Project updated." });
                                });
                        });
                    });
                });
            } else {
                res.json({ message: "Project updated." });
            }
        });
    });
};

const remove = (req, res) => {
    Project.delete(req.params.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete project." });
        res.json({ message: "Project deleted." });
    });
};

const getMembers = (req, res) => {
    Project.getMembers(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load members." });
        res.json({ members: results });
    });
};

const addMember = (req, res) => {
    const { member_id, role } = req.body;
    if (!member_id) {
        return res.status(400).json({ message: "member_id is required." });
    }
    Project.addMember(req.params.id, member_id, role, (err) => {
        if (err) return res.status(500).json({ message: "Failed to add member." });

        const lastMeetingSql = "SELECT meeting_id FROM meetings ORDER BY meeting_date DESC LIMIT 1";
        db.query(lastMeetingSql, (err, meetings) => {
            if (err || meetings.length === 0) {
                return res.json({ message: "Member added to project." });
            }
            pointService.awardProjectJoined(member_id, meetings[0].meeting_id, () => {
                res.json({ message: "Member added to project." });
            });
        });
    });
};

const removeMember = (req, res) => {
    Project.removeMember(req.params.id, req.params.memberId, (err) => {
        if (err) return res.status(500).json({ message: "Failed to remove member." });
        res.json({ message: "Member removed from project." });
    });
};

// Reviewer feedback (Admin/Leader): comments to help members polish projects
const getComments = (req, res) => {
    Project.getComments(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load comments." });
        res.json({ comments: results });
    });
};

const addComment = (req, res) => {
    const { body } = req.body;
    if (!body || !String(body).trim()) {
        return res.status(400).json({ message: "Comment body is required." });
    }
    Project.addComment(req.params.id, req.user.id, String(body).trim(), (err) => {
        if (err) return res.status(500).json({ message: "Failed to add comment." });
        Project.getComments(req.params.id, (err, comments) => {
            if (err) return res.status(500).json({ message: "Failed to load comments." });
            res.status(201).json({ message: "Comment added.", comments });
        });
    });
};

const deleteComment = (req, res) => {
    Project.deleteComment(req.params.commentId, req.user.id, (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to delete comment." });
        if (!result || result.affectedRows === 0) {
            return res.status(404).json({ message: "Comment not found or not yours." });
        }
        res.json({ message: "Comment deleted." });
    });
};

module.exports = {
    list, getMine, getByMember, getOverviewByMember, getById, create, update, remove,
    getMembers, addMember, removeMember,
    getComments, addComment, deleteComment
};