const db = require("../config/db");

// Default semester window: current month minus 3 (e.g. Aug 31 -> May 1) through today
const defaultRange = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth() - 3, 1);
    const iso = (d) => d.toISOString().slice(0, 10);
    return { start: iso(start), end: iso(end) + " 23:59:59" };
};

const getSemesterReport = (req, res) => {
    const { start, end } = { ...defaultRange(), ...req.query };
    const params = [start, end];

    const report = { period: { start, end } };
    let pending = 9;
    let responded = false;
    const done = () => {
        pending--;
        if (pending === 0 && !responded) res.json({ report });
    };
    const fail = (msg) => {
        if (!responded) {
            responded = true;
            res.status(500).json({ message: msg });
        }
    };

    // 1. Membership summary
    db.query(`
        SELECT
            (SELECT COUNT(*) FROM members WHERE approval_status = 'Approved' AND is_active = TRUE AND role_id != 1) AS active_members,
            (SELECT COUNT(*) FROM members WHERE approval_status = 'Pending') AS pending_members,
            (SELECT COUNT(*) FROM members
             WHERE approval_status = 'Approved' AND created_at BETWEEN ? AND ?) AS new_members,
            (SELECT COUNT(*) FROM members
             WHERE approval_status = 'Rejected' AND created_at BETWEEN ? AND ?) AS rejected
    `, [start, end, start, end], (err, r) => {
        if (err) return fail("Failed to load membership.");
        report.membership = (r && r[0]) || {};
        done();
    });

    // 2. Meetings + attendance
    db.query(`
        SELECT
            (SELECT COUNT(*) FROM meetings WHERE meeting_date BETWEEN ? AND ?) AS meetings_held,
            (SELECT COALESCE(ROUND(AVG(rate), 1), 0) FROM (
                SELECT (SUM(a.status IN ('Present','Late')) / COUNT(a.attendance_id)) * 100 AS rate
                FROM attendance a
                JOIN meetings m2 ON a.meeting_id = m2.meeting_id
                WHERE m2.meeting_date BETWEEN ? AND ?
                GROUP BY m2.meeting_id
            ) t) AS avg_attendance_rate,
            (SELECT COUNT(*) FROM attendance a
             JOIN meetings m2 ON a.meeting_id = m2.meeting_id
             WHERE m2.meeting_date BETWEEN ? AND ?) AS total_records,
            (SELECT COALESCE(SUM(a.status = 'Present'), 0) FROM attendance a
             JOIN meetings m2 ON a.meeting_id = m2.meeting_id
             WHERE m2.meeting_date BETWEEN ? AND ?) AS present,
            (SELECT COALESCE(SUM(a.status = 'Late'), 0) FROM attendance a
             JOIN meetings m2 ON a.meeting_id = m2.meeting_id
             WHERE m2.meeting_date BETWEEN ? AND ?) AS late,
            (SELECT COALESCE(SUM(a.status = 'Absent'), 0) FROM attendance a
             JOIN meetings m2 ON a.meeting_id = m2.meeting_id
             WHERE m2.meeting_date BETWEEN ? AND ?) AS absent,
            (SELECT COALESCE(SUM(a.status = 'Excused'), 0) FROM attendance a
             JOIN meetings m2 ON a.meeting_id = m2.meeting_id
             WHERE m2.meeting_date BETWEEN ? AND ?) AS excused
    `, [start, end, start, end, start, end, start, end, start, end, start, end, start, end],
    (err, r) => {
        if (err) return fail("Failed to load meetings stats.");
        report.meetings = (r && r[0]) || {};
        done();
    });

    // 3. Participation / points summary
    db.query(`
        SELECT
            COALESCE(SUM(points), 0) AS total_points,
            COUNT(*) AS participation_records,
            COUNT(DISTINCT member_id) AS active_participants
        FROM participation
        WHERE recorded_at BETWEEN ? AND ?
    `, params, (err, r) => {
        if (err) return fail("Failed to load participation stats.");
        report.participation = (r && r[0]) || {};
        done();
    });

    // 4. Points by pillar
    db.query(`
        SELECT pillar, COALESCE(SUM(points), 0) AS points, COUNT(*) AS records
        FROM participation
        WHERE recorded_at BETWEEN ? AND ?
        GROUP BY pillar
        ORDER BY COALESCE(SUM(points), 0) DESC
    `, params, (err, r) => {
        if (err) return fail("Failed to load pillar stats.");
        report.points_by_pillar = r || [];
        done();
    });

    // 5. Top activities
    db.query(`
        SELECT activity, COALESCE(SUM(points), 0) AS total_points, COUNT(*) AS records
        FROM participation
        WHERE recorded_at BETWEEN ? AND ?
        GROUP BY activity
        ORDER BY COALESCE(SUM(points), 0) DESC
        LIMIT 10
    `, params, (err, r) => {
        if (err) return fail("Failed to load activity stats.");
        report.top_activities = r || [];
        done();
    });

    // 6. Events summary
    db.query(`
        SELECT
            (SELECT COUNT(*) FROM events WHERE event_date BETWEEN ? AND ?) AS events_held,
            (SELECT COUNT(*) FROM event_registrations er
             JOIN events e ON er.event_id = e.event_id
             WHERE e.event_date BETWEEN ? AND ?) AS event_registrations
    `, [start, end, start, end], (err, r) => {
        if (err) return fail("Failed to load events stats.");
        report.events = (r && r[0]) || {};
        done();
    });

    // 7. Projects summary
    db.query(`
        SELECT
            COUNT(*) AS total_projects,
            COALESCE(SUM(status = 'Completed'), 0) AS completed,
            COALESCE(SUM(status = 'In Progress'), 0) AS in_progress,
            COALESCE(SUM(status = 'Planning'), 0) AS planning
        FROM projects
        WHERE start_date BETWEEN ? AND ?
    `, params, (err, r) => {
        if (err) return fail("Failed to load projects stats.");
        report.projects = (r && r[0]) || {};
        done();
    });

    // 8. GitHub engagement
    db.query(`
        SELECT
            COUNT(DISTINCT gc.member_id) AS members_with_github,
            COALESCE(SUM(gc.commit_count), 0) AS commits,
            COALESCE(SUM(gc.pr_count), 0) AS pull_requests,
            COALESCE(SUM(gc.issue_count), 0) AS issues,
            COALESCE(SUM(gc.repo_count), 0) AS repos,
            COALESCE(SUM(gc.star_count), 0) AS stars
        FROM github_contributions gc
        JOIN members m ON gc.member_id = m.member_id
        WHERE m.approval_status = 'Approved' AND m.role_id != 1
    `, (err, r) => {
        if (err) return fail("Failed to load GitHub stats.");
        report.github = (r && r[0]) || {};
        done();
    });

    // 9. Top contributors (semester points)
    db.query(`
        SELECT
            m.member_id, m.first_name, m.last_name,
            COALESCE(SUM(p.points), 0) AS points,
            COUNT(p.participation_id) AS activities
        FROM members m
        LEFT JOIN participation p
            ON p.member_id = m.member_id AND p.recorded_at BETWEEN ? AND ?
        WHERE m.approval_status = 'Approved' AND m.is_active = TRUE AND m.role_id != 1
        GROUP BY m.member_id
        ORDER BY COALESCE(SUM(p.points), 0) DESC
        LIMIT 10
    `, params, (err, r) => {
        if (err) return fail("Failed to load top contributors.");
        report.top_contributors = r || [];
        done();
    });
};

// CSV export: member-by-member semester breakdown
const exportMembersCsv = (req, res) => {
    const { start, end } = { ...defaultRange(), ...req.query };

    db.query(`
        SELECT
            m.member_id AS member_id,
            CONCAT(m.first_name, ' ', m.last_name) AS name,
            m.email,
            m.course,
            m.year_of_study,
            COALESCE(c.committee_name, 'Unassigned') AS committee,
            COUNT(DISTINCT a.attendance_id) AS attendance_count,
            ROUND(
                COALESCE(SUM(DISTINCT a.status IN ('Present','Late')) /
                    NULLIF(COUNT(DISTINCT a.attendance_id), 0) * 100, 0), 1
            ) AS attendance_rate,
            (SELECT COUNT(*) FROM participation p
              WHERE p.member_id = m.member_id AND p.recorded_at BETWEEN ? AND ?) AS participation_records,
            (SELECT COALESCE(SUM(p.points), 0) FROM participation p
             WHERE p.member_id = m.member_id AND p.recorded_at BETWEEN ? AND ?) AS participation_points,
            (SELECT COALESCE(SUM(pa.points), 0) FROM point_adjustments pa
              WHERE pa.member_id = m.member_id AND pa.awarded_at BETWEEN ? AND ?) AS adjustment_points,
            (SELECT COUNT(*) FROM member_badges mb WHERE mb.member_id = m.member_id) AS badges,
            COALESCE(MAX(gc.commit_count), 0) AS commits,
            COALESCE(MAX(gc.pr_count), 0) AS pull_requests,
            COALESCE(MAX(gc.issue_count), 0) AS issues
        FROM members m
        LEFT JOIN committees c ON m.committee_id = c.committee_id
        LEFT JOIN attendance a ON a.member_id = m.member_id
        LEFT JOIN meetings mt ON a.meeting_id = mt.meeting_id
            AND mt.meeting_date BETWEEN ? AND ?
        LEFT JOIN github_contributions gc ON gc.member_id = m.member_id
        WHERE m.approval_status = 'Approved' AND m.is_active = TRUE AND m.role_id != 1
        GROUP BY m.member_id
        ORDER BY participation_points DESC
    `, [start, end, start, end, start, end, start, end],
    (err, rows) => {
        if (err) return res.status(500).json({ message: "Failed to export report." });

        const headers = [
            "Member ID", "Name", "Email", "Course", "Year",
            "Committee", "Attendance Count", "Attendance Rate (%)",
            "Participation Records", "Participation Points",
            "Adjustment Points", "Badges", "Commits", "Pull Requests", "Issues"
        ];
        const esc = (v) => {
            const s = v == null ? "" : String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = [headers.join(",")];
        for (const row of rows) {
            lines.push(headers.map((h, i) => esc(Object.values(row)[i])).join(","));
        }

        const filename = `semester-report_${start.slice(0, 10)}_to_${String(end).slice(0, 10)}.csv`;
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send("\uFEFF" + lines.join("\r\n"));
    });
};

module.exports = { getSemesterReport, exportMembersCsv };