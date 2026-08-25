const path = require("path");
const fs = require("fs");
const Article = require("../models/Article");
const pointService = require("../services/pointService");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "articles");
const IMAGE_DIR = path.join(__dirname, "..", "uploads", "articles", "covers");

const ensureDirs = () => {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR, { recursive: true });
};

const estimateReadingTime = (fileSize, fileType) => {
    if (fileType === "md" && fileSize) {
        const words = Math.max(Math.round(fileSize / 6), 1);
        return Math.max(1, Math.round(words / 200));
    }
    if (fileType === "docx" && fileSize) {
        const words = Math.max(Math.round(fileSize / 8), 1);
        return Math.max(1, Math.round(words / 200));
    }
    if (fileType === "pdf" && fileSize) {
        const pages = Math.max(Math.round(fileSize / 50000), 1);
        return Math.max(1, Math.round(pages * 2.5));
    }
    return 5;
};

const listPublished = (req, res) => {
    Article.findPublished((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load articles." });
        res.json({ articles: results });
    });
};

const listMine = (req, res) => {
    Article.findByAuthor(req.user.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load articles." });
        res.json({ articles: results });
    });
};

const getById = (req, res) => {
    Article.findById(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load article." });
        if (results.length === 0) return res.status(404).json({ message: "Article not found." });
        const article = results[0];

        if (article.status !== "Published" && article.author_id !== req.user.id &&
            req.user.role_name !== "Admin" && req.user.role_name !== "Leader") {
            return res.status(403).json({ message: "This article is not available." });
        }

        Article.getTags(req.params.id, (err, tags) => {
            Article.hasLiked(req.params.id, req.user.id, (err, liked) => {
                Article.getComments(req.params.id, (err, comments) => {
                    res.json({
                        article,
                        tags: (tags || []).map((t) => t.tag),
                        liked,
                        comments: comments || []
                    });
                });
            });
        });
    });
};

const create = (req, res) => {
    ensureDirs();

    if (!req.files || !req.files.file) {
        return res.status(400).json({ message: "Article file is required." });
    }

    const file = req.files.file[0];
    const coverImage = req.files.cover ? req.files.cover[0] : null;
    const { title, summary, category, tags } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required." });
    }

    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const fileType = ext;
    const filePath = `/uploads/articles/${file.filename}`;
    const coverPath = coverImage ? `/uploads/articles/covers/${coverImage.filename}` : null;
    const readingTime = estimateReadingTime(file.size, fileType);

    Article.create({
        author_id: req.user.id,
        title, summary, category,
        file_path: filePath,
        file_size: file.size,
        file_type: fileType,
        cover_image: coverPath,
        reading_time,
        status: "Draft"
    }, (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to create article." });

        const articleId = result.insertId;
        const tagList = tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim()).filter(Boolean)) : [];

        Article.setTags(articleId, tagList, (err) => {
            if (err) return res.status(500).json({ message: "Article created but tags failed." });
            res.status(201).json({ message: "Article created as draft.", article_id: articleId });
        });
    });
};

const update = (req, res) => {
    const { title, summary, category, tags } = req.body;

    Article.findById(req.params.id, (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: "Article not found." });
        }
        const article = results[0];
        if (article.author_id !== req.user.id) {
            return res.status(403).json({ message: "You can only edit your own articles." });
        }
        if (article.status === "Published" || article.status === "Submitted") {
            return res.status(400).json({ message: "Cannot edit a submitted or published article." });
        }

        Article.update(req.params.id, { title, summary, category, cover_image: article.cover_image, reading_time: article.reading_time }, (err) => {
            if (err) return res.status(500).json({ message: "Failed to update article." });

            const tagList = tags ? (Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim()).filter(Boolean)) : [];
            Article.setTags(req.params.id, tagList, (err) => {
                if (err) return res.status(500).json({ message: "Article updated but tags failed." });
                res.json({ message: "Article updated." });
            });
        });
    });
};

const submit = (req, res) => {
    Article.findById(req.params.id, (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: "Article not found." });
        }
        if (results[0].author_id !== req.user.id) {
            return res.status(403).json({ message: "You can only submit your own articles." });
        }
        if (results[0].status !== "Draft") {
            return res.status(400).json({ message: "Only draft articles can be submitted." });
        }

        Article.submit(req.params.id, (err) => {
            if (err) return res.status(500).json({ message: "Failed to submit article." });
            res.json({ message: "Article submitted for review." });
        });
    });
};

const listSubmitted = (req, res) => {
    Article.findSubmitted((err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load submitted articles." });
        res.json({ articles: results });
    });
};

const review = (req, res) => {
    const { status, review_note } = req.body;
    if (!["Approved", "Rejected", "Published"].includes(status)) {
        return res.status(400).json({ message: "status must be Approved, Rejected, or Published." });
    }

    Article.findById(req.params.id, (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: "Article not found." });
        }
        const article = results[0];
        const wasPublished = article.status === "Published";

        Article.updateStatus(req.params.id, status, req.user.id, review_note, (err) => {
            if (err) return res.status(500).json({ message: "Failed to review article." });

            if (status === "Published" && !wasPublished) {
                pointService.awardArticlePublished(article.author_id, req.params.id, () => {
                    res.json({ message: `Article ${status.toLowerCase()}.` });
                });
            } else {
                res.json({ message: `Article ${status.toLowerCase()}.` });
            }
        });
    });
};

const remove = (req, res) => {
    Article.findById(req.params.id, (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: "Article not found." });
        }
        const article = results[0];
        if (article.author_id !== req.user.id && req.user.role_name !== "Admin") {
            return res.status(403).json({ message: "You can only delete your own articles." });
        }

        Article.delete(req.params.id, (err) => {
            if (err) return res.status(500).json({ message: "Failed to delete article." });

            if (article.file_path) {
                const abs = path.join(__dirname, "..", "uploads", "articles", path.basename(article.file_path));
                fs.unlink(abs, () => {});
            }
            if (article.cover_image) {
                const absCover = path.join(IMAGE_DIR, path.basename(article.cover_image));
                fs.unlink(absCover, () => {});
            }

            res.json({ message: "Article deleted." });
        });
    });
};

const toggleLike = (req, res) => {
    Article.toggleLike(req.params.id, req.user.id, (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to toggle like." });

        if (result.liked) {
            Article.findById(req.params.id, (err, results) => {
                if (err || results.length === 0) return res.json(result);
                pointService.awardArticleLike(results[0].author_id, req.params.id, () => {
                    res.json(result);
                });
            });
        } else {
            res.json(result);
        }
    });
};

const getComments = (req, res) => {
    Article.getComments(req.params.id, (err, results) => {
        if (err) return res.status(500).json({ message: "Failed to load comments." });
        res.json({ comments: results });
    });
};

const addComment = (req, res) => {
    const { body } = req.body;
    if (!body || !body.trim()) {
        return res.status(400).json({ message: "body is required." });
    }
    Article.addComment(req.params.id, req.user.id, body.trim(), (err, result) => {
        if (err) return res.status(500).json({ message: "Failed to add comment." });
        res.status(201).json({ message: "Comment added.", comment_id: result.insertId });
    });
};

const deleteComment = (req, res) => {
    Article.deleteComment(req.params.commentId, req.user.id, (err) => {
        if (err) return res.status(500).json({ message: "Failed to delete comment." });
        res.json({ message: "Comment deleted." });
    });
};

module.exports = {
    listPublished, listMine, getById, create, update, submit,
    listSubmitted, review, remove,
    toggleLike, getComments, addComment, deleteComment
};