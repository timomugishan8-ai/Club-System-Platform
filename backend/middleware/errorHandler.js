const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    console.error("❌ Error:", err.message || err);

    if (err && err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Duplicate entry." });
    }

    if (err && err.code === "ER_NO_REFERENCED_ROW") {
        return res.status(400).json({ message: "Referenced record does not exist." });
    }

    const status = err.status || 500;
    const message = err.expose ? err.message : "Internal server error.";

    res.status(status).json({ message });
};

module.exports = errorHandler;