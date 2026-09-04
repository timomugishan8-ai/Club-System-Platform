const db = require("../config/db");

// Global search across the main entities. Every query is parameterized;
// results are capped per group so the dropdown stays snappy.
const LIMIT = 5;

const like = (q) => `%${q}%`;

const runQuery = (sql, params) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
    });

const search = async (req, res) => {
    const q = String(req.query.q || "").trim();

    if (q.length < 2) {
        return res.json({ results: {} });
    }

    const term = like(q);
    const isAdmin = req.user.role_name === "Admin";

    try {
        const [members, projects, meetings, events, announcements, resources, articles] =
            await Promise.all([
                runQuery(
                    `
                    SELECT m.member_id, m.first_name, m.last_name, m.course, r.role_name
                    FROM members m
                    LEFT JOIN roles r ON m.role_id = r.role_id
                    WHERE m.approval_status = 'Approved'
                      AND (m.first_name LIKE ? OR m.last_name LIKE ?
                           OR CONCAT(m.first_name, ' ', m.last_name) LIKE ?
                           OR m.github_handle LIKE ?)
                    ORDER BY m.first_name, m.last_name
                    LIMIT ${LIMIT}
                    `,
                    [term, term, term, term]
                ),
                runQuery(
                    `
                    SELECT project_id, title, description, status
                    FROM projects
                    WHERE title LIKE ? OR description LIKE ?
                    ORDER BY title
                    LIMIT ${LIMIT}
                    `,
                    [term, term]
                ),
                runQuery(
                    `
                    SELECT meeting_id, title, topic, meeting_date
                    FROM meetings
                    WHERE title LIKE ? OR topic LIKE ? OR description LIKE ?
                    ORDER BY meeting_date DESC
                    LIMIT ${LIMIT}
                    `,
                    [term, term, term]
                ),
                runQuery(
                    `
                    SELECT event_id, title, description, event_date
                    FROM events
                    WHERE title LIKE ? OR description LIKE ? OR venue LIKE ?
                    ORDER BY event_date DESC
                    LIMIT ${LIMIT}
                    `,
                    [term, term, term]
                ),
                runQuery(
                    `
                    SELECT announcement_id, title, body, category
                    FROM announcements
                    WHERE title LIKE ? OR body LIKE ?
                    ORDER BY created_at DESC
                    LIMIT ${LIMIT}
                    `,
                    [term, term]
                ),
                runQuery(
                    `
                    SELECT resource_id, title, description, category
                    FROM resources
                    WHERE title LIKE ? OR description LIKE ?
                    ORDER BY title
                    LIMIT ${LIMIT}
                    `,
                    [term, term]
                ),
                isAdmin
                    ? runQuery(
                          `
                          SELECT article_id, title, summary, status
                          FROM articles
                          WHERE title LIKE ? OR summary LIKE ?
                          ORDER BY created_at DESC
                          LIMIT ${LIMIT}
                          `,
                          [term, term]
                      )
                    : runQuery(
                          `
                          SELECT article_id, title, summary, status
                          FROM articles
                          WHERE status = 'Published' AND (title LIKE ? OR summary LIKE ?)
                          ORDER BY published_at DESC
                          LIMIT ${LIMIT}
                          `,
                          [term, term]
                      ),
            ]);

        res.json({
            results: {
                members: members.map((m) => ({
                    id: m.member_id,
                    title: `${m.first_name} ${m.last_name}`,
                    subtitle: m.role_name || m.course || "Member",
                })),
                projects: projects.map((p) => ({
                    id: p.project_id,
                    title: p.title,
                    subtitle: p.status,
                })),
                meetings: meetings.map((m) => ({
                    id: m.meeting_id,
                    title: m.title,
                    subtitle: m.topic || m.meeting_date,
                })),
                events: events.map((e) => ({
                    id: e.event_id,
                    title: e.title,
                    subtitle: e.event_date,
                })),
                announcements: announcements.map((a) => ({
                    id: a.announcement_id,
                    title: a.title,
                    subtitle: a.category,
                })),
                resources: resources.map((r) => ({
                    id: r.resource_id,
                    title: r.title,
                    subtitle: r.category,
                })),
                articles: articles.map((a) => ({
                    id: a.article_id,
                    title: a.title,
                    subtitle: a.status,
                })),
            },
        });
    } catch (err) {
        console.error("Search failed:", err);
        res.status(500).json({ message: "Search failed." });
    }
};

module.exports = { search };