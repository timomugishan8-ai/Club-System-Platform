const db = require("../config/db");

const Article = {
    create: (data, callback) => {
        const sql = `
            INSERT INTO articles
                (author_id, title, summary, category, file_path, file_size, file_type, cover_image, reading_time, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.author_id,
            data.title,
            data.summary || null,
            data.category || null,
            data.file_path,
            data.file_size || null,
            data.file_type || null,
            data.cover_image || null,
            data.reading_time || 0,
            data.status || "Draft"
        ];
        db.query(sql, params, callback);
    },

    setTags: (articleId, tags, callback) => {
        db.query("DELETE FROM article_tags WHERE article_id = ?", [articleId], (err) => {
            if (err) return callback(err);
            if (!tags || tags.length === 0) return callback(null);
            const values = tags.map((t) => [articleId, t]);
            db.query(
                "INSERT INTO article_tags (article_id, tag) VALUES ?",
                [values],
                callback
            );
        });
    },

    findPublished: (callback) => {
        const sql = `
            SELECT
                a.article_id, a.title, a.summary, a.category, a.cover_image,
                a.reading_time, a.file_path, a.file_type, a.published_at,
                CONCAT(m.first_name, ' ', m.last_name) AS author_name,
                m.avatar_url AS author_avatar,
                (SELECT COUNT(*) FROM article_likes al WHERE al.article_id = a.article_id) AS like_count,
                (SELECT COUNT(*) FROM article_comments ac WHERE ac.article_id = a.article_id) AS comment_count
            FROM articles a
            JOIN members m ON a.author_id = m.member_id
            WHERE a.status = 'Published'
            ORDER BY a.published_at DESC
        `;
        db.query(sql, callback);
    },

    findByAuthor: (authorId, callback) => {
        const sql = `
            SELECT
                a.article_id, a.title, a.summary, a.category, a.cover_image,
                a.reading_time, a.file_path, a.file_type, a.status,
                a.created_at, a.updated_at, a.review_note, a.published_at,
                (SELECT COUNT(*) FROM article_likes al WHERE al.article_id = a.article_id) AS like_count,
                (SELECT COUNT(*) FROM article_comments ac WHERE ac.article_id = a.article_id) AS comment_count
            FROM articles a
            WHERE a.author_id = ?
            ORDER BY a.updated_at DESC
        `;
        db.query(sql, [authorId], callback);
    },

    findSubmitted: (callback) => {
        const sql = `
            SELECT
                a.article_id, a.title, a.summary, a.category, a.cover_image,
                a.reading_time, a.file_path, a.file_type, a.submitted_at,
                a.created_at,
                CONCAT(m.first_name, ' ', m.last_name) AS author_name,
                m.avatar_url AS author_avatar, m.member_id AS author_id
            FROM articles a
            JOIN members m ON a.author_id = m.member_id
            WHERE a.status = 'Submitted'
            ORDER BY a.created_at ASC
        `;
        db.query(sql, callback);
    },

    findById: (id, callback) => {
        const sql = `
            SELECT
                a.*,
                CONCAT(m.first_name, ' ', m.last_name) AS author_name,
                m.avatar_url AS author_avatar, m.member_id AS author_id
            FROM articles a
            JOIN members m ON a.author_id = m.member_id
            WHERE a.article_id = ?
        `;
        db.query(sql, [id], callback);
    },

    getTags: (articleId, callback) => {
        db.query(
            "SELECT tag FROM article_tags WHERE article_id = ?",
            [articleId],
            callback
        );
    },

    update: (id, data, callback) => {
        const sql = `
            UPDATE articles
            SET title = ?, summary = ?, category = ?, cover_image = ?, reading_time = ?
            WHERE article_id = ?
        `;
        const params = [
            data.title,
            data.summary || null,
            data.category || null,
            data.cover_image || null,
            data.reading_time || 0,
            id
        ];
        db.query(sql, params, callback);
    },

    updateStatus: (id, status, reviewerId, reviewNote, callback) => {
        const sql = `
            UPDATE articles
            SET status = ?,
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP,
                review_note = ?,
                published_at = CASE WHEN ? = 'Published' THEN CURRENT_TIMESTAMP ELSE published_at END
            WHERE article_id = ?
        `;
        db.query(sql, [status, reviewerId, reviewNote || null, status, id], callback);
    },

    submit: (id, callback) => {
        db.query(
            "UPDATE articles SET status = 'Submitted' WHERE article_id = ?",
            [id],
            callback
        );
    },

    delete: (id, callback) => {
        db.query("DELETE FROM articles WHERE article_id = ?", [id], callback);
    },

    toggleLike: (articleId, memberId, callback) => {
        const check = "SELECT like_id FROM article_likes WHERE article_id = ? AND member_id = ?";
        db.query(check, [articleId, memberId], (err, results) => {
            if (err) return callback(err);
            if (results.length > 0) {
                db.query(
                    "DELETE FROM article_likes WHERE article_id = ? AND member_id = ?",
                    [articleId, memberId],
                    (err) => callback(err, { liked: false })
                );
            } else {
                db.query(
                    "INSERT INTO article_likes (article_id, member_id) VALUES (?, ?)",
                    [articleId, memberId],
                    (err) => callback(err, { liked: true })
                );
            }
        });
    },

    hasLiked: (articleId, memberId, callback) => {
        db.query(
            "SELECT like_id FROM article_likes WHERE article_id = ? AND member_id = ?",
            [articleId, memberId],
            (err, results) => callback(err, results.length > 0)
        );
    },

    getComments: (articleId, callback) => {
        const sql = `
            SELECT
                c.comment_id, c.body, c.created_at,
                m.member_id, m.first_name, m.last_name, m.avatar_url
            FROM article_comments c
            JOIN members m ON c.member_id = m.member_id
            WHERE c.article_id = ?
            ORDER BY c.created_at DESC
        `;
        db.query(sql, [articleId], callback);
    },

    addComment: (articleId, memberId, body, callback) => {
        db.query(
            "INSERT INTO article_comments (article_id, member_id, body) VALUES (?, ?, ?)",
            [articleId, memberId, body],
            callback
        );
    },

    deleteComment: (commentId, memberId, callback) => {
        db.query(
            "DELETE FROM article_comments WHERE comment_id = ? AND member_id = ?",
            [commentId, memberId],
            callback
        );
    }
};

module.exports = Article;