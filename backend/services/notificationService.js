const db = require("../config/db");
const Notification = require("../models/Notification");
const { sendEmail } = require("./emailService");
const { buildEmail } = require("./emailTemplate");

const notifyMember = (memberId, type, title, body) => {
    return new Promise((resolve) => {
        Notification.create(memberId, type, title, body, (err, result) => {
            if (err) return resolve(null);
            const notificationId = result.insertId;

            db.query(
                "SELECT email, notify_email, first_name FROM members WHERE member_id = ?",
                [memberId],
                (err, results) => {
                    if (err || results.length === 0) return resolve(notificationId);
                    const member = results[0];

                    if (member.notify_email) {
                        const { text, html } = buildEmail(member.first_name, body);
                        sendEmail(
                            member.email,
                            title,
                            text,
                            html
                        ).then(() => {
                            Notification.markEmailSent(notificationId, () => resolve(notificationId));
                        }).catch(() => resolve(notificationId));
                    } else {
                        resolve(notificationId);
                    }
                }
            );
        });
    });
};

const notifyAllMembers = (type, title, body) => {
    return new Promise((resolve) => {
        db.query(
            "SELECT member_id FROM members WHERE approval_status = 'Approved' AND is_active = TRUE AND notify_inapp = TRUE",
            (err, results) => {
                if (err || results.length === 0) return resolve(0);
                const ids = results.map((r) => r.member_id);

                Notification.createMany(ids, type, title, body, (err, result) => {
                    const insertIds = (result && result.insertIds) || [];
                    db.query(
                        "SELECT email, first_name FROM members WHERE approval_status = 'Approved' AND is_active = TRUE AND notify_email = TRUE",
                        (err, members) => {
                            if (err || members.length === 0) return resolve(ids.length);

                            // Map emailed members back to their notification
                            // rows (same query order as the id selection)
                            db.query(
                                "SELECT member_id FROM members WHERE approval_status = 'Approved' AND is_active = TRUE AND notify_inapp = TRUE",
                                (err, inappRows) => {
                                    const inappIds = (inappRows || []).map((r) => r.member_id);
                                    const idByEmail = {};
                                    inappIds.forEach((mid, i) => {
                                        if (insertIds[i] != null) idByEmail[mid] = insertIds[i];
                                    });

                                    let sent = 0;
                                    const finish = () => {
                                        sent++;
                                        if (sent === members.length) resolve(ids.length);
                                    };
                                    members.forEach((m) => {
                                        const { text, html } = buildEmail(m.first_name, body);
                                        // member_id isn't selected in the email
                                        // query; re-fetch to map to notification id
                                        db.query(
                                            "SELECT member_id FROM members WHERE email = ? LIMIT 1",
                                            [m.email],
                                            (err, mRows) => {
                                                const memberId = mRows && mRows[0] ? mRows[0].member_id : null;
                                                const notificationId = memberId != null ? idByEmail[memberId] : null;
                                                sendEmail(
                                                    m.email,
                                                    title,
                                                    text,
                                                    html
                                                ).then(() => {
                                                    console.log(`[email sent] to=${m.email} subject="${title}"`);
                                                    if (notificationId != null) {
                                                        Notification.markEmailSent(notificationId, finish);
                                                    } else {
                                                        finish();
                                                    }
                                                }).catch((e) => {
                                                    console.error(`[email FAILED] to=${m.email}: ${e.message}`);
                                                    finish();
                                                });
                                            }
                                        );
                                    });
                                }
                            );
                        }
                    );
                });
            }
        );
    });
};

module.exports = { notifyMember, notifyAllMembers };