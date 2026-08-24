const crypto = require("crypto");

const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString("hex");
};

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

module.exports = { generateToken, hashToken, isNonEmptyString };