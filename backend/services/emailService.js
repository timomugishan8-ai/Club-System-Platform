const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null;
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: (parseInt(process.env.SMTP_PORT, 10) || 587) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    return transporter;
};

const sendEmail = (to, subject, text, html) => {
    const t = getTransporter();
    if (!t) {
        console.log(`[email skipped — SMTP not configured] To: ${to} | Subject: ${subject}`);
        return Promise.resolve({ skipped: true });
    }

    return new Promise((resolve, reject) => {
        t.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            text,
            html
        }, (err, info) => {
            if (err) return reject(err);
            resolve(info);
        });
    });
};

module.exports = { sendEmail };