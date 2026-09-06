// Branded HTML email wrapper: every transactional email gets a consistent
// header/footer. Keeps the chapter look across Gmail/Outlook clients.
const wrapEmail = (greeting, bodyHtml) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; background:#0A0D14; padding:24px 12px;">
  <div style="max-width:560px; margin:0 auto; background:#131826; border:1px solid #233048; border-radius:16px; overflow:hidden;">
    <div style="background:linear-gradient(135deg, #2C4A6E, #5B8AB8); padding:18px 24px;">
      <div style="color:#FFFFFF; font-size:15px; font-weight:700; letter-spacing:2px;">DATA SCIENCE</div>
      <div style="color:#DCE6F2; font-size:11px; font-weight:600; letter-spacing:2px;">UCU CHAPTER</div>
    </div>
    <div style="padding:24px; color:#E9ECF2; font-size:14px; line-height:1.6;">
      <p style="margin:0 0 12px;">${greeting},</p>
      <div style="margin:0 0 16px;">${bodyHtml}</div>
      <p style="margin:0; color:#7E879B; font-size:12px;">— Data Science Chapter, UCU</p>
    </div>
    <div style="border-top:1px solid #233048; padding:12px 24px; color:#7E879B; font-size:11px;">
      You're receiving this because you're a member of the Data Science Chapter.
      Manage email preferences in the platform's Settings page.
    </div>
  </div>
</div>
`;

const escapeHtml = (s) => String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// body is plain text from admin input — escape it and convert newlines
const buildEmail = (firstName, body) => {
    const paragraphs = escapeHtml(body)
        .split(/\n{2,}/)
        .map((p) => `<p style="margin:0 0 10px;">${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
    return {
        text: `Hi ${firstName},\n\n${body}\n\n— Data Science Chapter`,
        html: wrapEmail(`Hi ${escapeHtml(firstName)}`, paragraphs),
    };
};

module.exports = { wrapEmail, buildEmail };