-- ============================================
-- Migration: QR check-in for meetings
-- Adds a per-meeting QR token table and a
-- configurable late-grace setting.
-- Run: mysql -u root -p ds_chapter_tracker < migration_qr_checkin.sql
-- ============================================

USE ds_chapter_tracker;

-- -------------------------------------------
-- QR tokens: one active token per meeting
-- -------------------------------------------
CREATE TABLE IF NOT EXISTS meeting_qr_tokens (
    qr_token_id  INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id   INT NOT NULL,
    token        CHAR(36) NOT NULL,          -- random UUID, embedded in QR code
    is_active    BOOLEAN DEFAULT TRUE,
    expires_at   TIMESTAMP NULL,             -- optional hard expiry
    created_by   INT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (meeting_id)
        REFERENCES meetings(meeting_id)
        ON DELETE CASCADE,
    FOREIGN KEY (created_by)
        REFERENCES members(member_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    UNIQUE (token),
    UNIQUE (meeting_id, is_active)
);

CREATE INDEX idx_qr_token_meeting ON meeting_qr_tokens(meeting_id);

-- -------------------------------------------
-- Setting: minutes after start_time that still
-- counts as "Present" (0 = on-time only)
-- -------------------------------------------
INSERT INTO system_settings (setting_key, setting_value) VALUES
('late_grace_minutes', '15')
ON DUPLICATE KEY UPDATE setting_value = setting_value;