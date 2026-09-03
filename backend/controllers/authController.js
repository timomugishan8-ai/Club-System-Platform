const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Member = require("../models/Member");
const ResetToken = require("../models/ResetToken");
const { isNonEmptyString, generateToken, hashToken } = require("../utils/helpers");

const register = async (req, res) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            student_number,
            gender,
            phone,
            course,
            year_of_study,
            github_handle,
            bio,
            notify_email,
            notify_inapp
        } = req.body;

        if (!isNonEmptyString(email) || !isNonEmptyString(password) ||
            !isNonEmptyString(first_name) || !isNonEmptyString(last_name)) {
            return res.status(400).json({
                message: "email, password, first_name and last_name are required."
            });
        }

        // Accept a bare handle ("octocat", "@octocat") or a full profile URL
        // ("https://github.com/octocat"); store the normalized handle.
        let handle = null;
        if (github_handle) {
            handle = String(github_handle).trim().replace(/^@/, "");
            const urlMatch = handle.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/?#\s]+)/i);
            if (urlMatch) handle = urlMatch[1];
            if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(handle)) {
                return res.status(400).json({
                    message: "Invalid GitHub handle. Enter a handle (e.g. octocat) or your profile URL (e.g. https://github.com/octocat)."
                });
            }
            handle = handle.toLowerCase();
        }

        Member.findByEmail(email, async (err, results) => {
            if (err) return res.status(500).json({ message: "Registration failed." });

            if (results.length > 0) {
                return res.status(409).json({ message: "Email already exists." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            Member.create({
                email,
                password_hash: hashedPassword,
                first_name,
                last_name,
                student_number,
                gender,
                phone,
                course,
                year_of_study,
                github_handle: handle,
                bio: bio ? String(bio).slice(0, 1000) : null,
                notify_email,
                notify_inapp,
                join_date: new Date().toISOString().slice(0, 10)
            }, (err) => {
                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({
                            message: "Email or student number already exists."
                        });
                    }
                    return res.status(500).json({ message: "Registration failed." });
                }

                res.status(201).json({
                    message: "Registration received. An admin must approve your account before you can log in."
                });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "Registration failed." });
    }
};

const login = (req, res) => {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
        return res.status(400).json({ message: "email and password are required." });
    }

    Member.findByEmail(email, async (err, results) => {
        if (err) return res.status(500).json({ message: "Login failed." });

        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const user = results[0];

        if (user.approval_status === "Pending") {
            return res.status(403).json({
                message: "Your account is pending admin approval."
            });
        }

        if (user.approval_status === "Rejected") {
            return res.status(403).json({
                message: "Your account has been rejected. Contact an administrator."
            });
        }

        if (!user.is_active) {
            return res.status(403).json({
                message: "Your account has been deactivated. Contact an administrator."
            });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign(
            {
                id: user.member_id,
                role_id: user.role_id,
                role_name: user.role_name
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful.",
            token,
            user: {
                member_id: user.member_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role_name: user.role_name,
                theme: user.theme
            }
        });
    });
};

const forgotPassword = (req, res) => {
    const { email } = req.body;

    if (!isNonEmptyString(email)) {
        return res.status(400).json({ message: "email is required." });
    }

    Member.findByEmail(email, (err, results) => {
        if (err) return res.status(500).json({ message: "Request failed." });

        if (results.length === 0) {
            return res.json({
                message: "If that email exists, a reset link has been sent."
            });
        }

        const member = results[0];
        const rawToken = generateToken();
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

        ResetToken.create(member.member_id, tokenHash, expiresAt, (err) => {
            if (err) return res.status(500).json({ message: "Request failed." });
            console.log(`[reset link — email sending TBD] /reset-password?token=${rawToken}`);
            res.json({
                message: "If that email exists, a reset link has been sent."
            });
        });
    });
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;

    if (!isNonEmptyString(token) || !isNonEmptyString(password)) {
        return res.status(400).json({ message: "token and password are required." });
    }

    const tokenHash = hashToken(token);

    ResetToken.findValid(tokenHash, (err, results) => {
        if (err) return res.status(500).json({ message: "Reset failed." });
        if (results.length === 0) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }

        const reset = results[0];

        ResetToken.markUsed(reset.token_id, async (err) => {
            if (err) return res.status(500).json({ message: "Reset failed." });

            const hashedPassword = await bcrypt.hash(password, 10);

            Member.updatePassword(reset.member_id, hashedPassword, (err) => {
                if (err) return res.status(500).json({ message: "Reset failed." });
                res.json({ message: "Password reset successful. You can now log in." });
            });
        });
    });
};

module.exports = { register, login, forgotPassword, resetPassword };