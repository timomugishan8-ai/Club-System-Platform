const db = require("../config/db");
const Notification = require("../models/Notification");
const { sendEmail } = require("./emailService");

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
                        sendEmail(
                            member.email,
                            title,
                            `Hi ${member.first_name},\n\n${body}\n\n— Data Science Chapter`,
                            `<p>Hi ${member.first_name},</p><p>${body}</p><p>— Data Science Chapter</p>`
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

                Notification.createMany(ids, type, title, body, () => {
                    db.query(
                        "SELECT email, first_name FROM members WHERE approval_status = 'Approved' AND is_active = TRUE AND notify_email = TRUE",
                        (err, members) => {
                            if (err || members.length === 0) return resolve(ids.length);

                            let sent = 0;
                            const finish = () => {
                                sent++;
                                if (sent === members.length) resolve(ids.length);
                            };
                            members.forEach((m) => {
                                sendEmail(
                                    m.email,
                                    title,
                                    `Hi ${m.first_name},\n\n${body}\n\n— Data Science Chapter`,
                                    `<p>Hi ${m.first_name},</p><p>${body}</p><p>— Data Science Chapter</p>`
                                ).then(finish).catch(finish);
                            });
                        }
                    );
                });
            }
        );
    });
};

module.exports = { notifyMember, notifyAllMembers };