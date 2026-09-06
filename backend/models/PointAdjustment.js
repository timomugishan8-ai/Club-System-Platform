const db = require("../config/db");

const PointAdjustment = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO point_adjustments (member_id, pillar, activity, points, remarks, awarded_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.member_id,
            data.pillar,
            data.activity,
            data.points,
            data.remarks || null,
            data.awarded_by
        ];
        db.query(sql, params, callback);
    },

    findByMember: (memberId, callback) => {
        const sql = `
            SELECT
                pa.adjustment_id, pa.pillar, pa.activity, pa.points,
                pa.remarks, pa.awarded_at,
                CONCAT(m.first_name, ' ', m.last_name) AS awarded_by_name
            FROM point_adjustments pa
            LEFT JOIN members m ON pa.awarded_by = m.member_id
            WHERE pa.member_id = ?
            ORDER BY pa.awarded_at DESC
        `;
        db.query(sql, [memberId], callback);
    },

    delete: (adjustmentId, callback) => {
        db.query(
            "DELETE FROM point_adjustments WHERE adjustment_id = ?",
            [adjustmentId],
            callback
        );
    },

    getMemberPillarPoints: (memberId, callback) => {
        const sql = `
            SELECT
                pillar,
                COALESCE(SUM(points), 0) AS pillar_points
            FROM (
                SELECT pillar, points FROM participation WHERE member_id = ?
                UNION ALL
                SELECT pillar, points FROM point_adjustments WHERE member_id = ?
            ) combined
            GROUP BY pillar
        `;
        db.query(sql, [memberId, memberId], callback);
    },

    // Full per-activity point breakdown across both point sources
    // (auto-awarded participation + manual adjustments), grouped by pillar.
    getMemberActivityBreakdown: (memberId, callback) => {
        const sql = `
            SELECT
                pillar,
                activity,
                COALESCE(SUM(points), 0) AS total_points,
                COUNT(*) AS times_awarded
            FROM (
                SELECT pillar, activity, points FROM participation WHERE member_id = ?
                UNION ALL
                SELECT pillar, activity, points FROM point_adjustments WHERE member_id = ?
            ) combined
            GROUP BY pillar, activity
            ORDER BY pillar, total_points DESC
        `;
        db.query(sql, [memberId, memberId], callback);
    }
};

module.exports = PointAdjustment;