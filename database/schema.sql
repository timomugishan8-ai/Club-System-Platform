-- ============================================
-- Data Science Chapter Tracker Database
-- Schema v2 — merged users+members, GitHub, events, badges, notifications
-- ============================================

DROP DATABASE IF EXISTS ds_chapter_tracker;

CREATE DATABASE IF NOT EXISTS ds_chapter_tracker;

USE ds_chapter_tracker;

-- -------------------------------------------
-- Roles
-- -------------------------------------------
CREATE TABLE roles (
    role_id   INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- -------------------------------------------
-- Committees
-- -------------------------------------------
CREATE TABLE committees (
    committee_id   INT AUTO_INCREMENT PRIMARY KEY,
    committee_name VARCHAR(100) NOT NULL UNIQUE,
    description    TEXT
);

-- -------------------------------------------
-- Members (merged: auth + profile)
-- -------------------------------------------
CREATE TABLE members (
    member_id       INT AUTO_INCREMENT PRIMARY KEY,

    -- Auth
    email           VARCHAR(100) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role_id         INT NOT NULL DEFAULT 3,           -- default Member
    is_active       BOOLEAN DEFAULT TRUE,
    approval_status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
    approved_by     INT,                              -- admin member_id
    approved_at     TIMESTAMP NULL,

    -- Profile
    student_number  VARCHAR(20) UNIQUE,
    first_name      VARCHAR(50) NOT NULL,
    last_name       VARCHAR(50) NOT NULL,
    gender          ENUM('Male','Female','Other'),
    phone           VARCHAR(20),
    course          VARCHAR(100),
    year_of_study   INT,
    committee_id    INT,
    join_date       DATE,
    status          ENUM('Active','Inactive') DEFAULT 'Active',

    -- GitHub integration
    github_handle   VARCHAR(100),

    -- Preferences
    avatar_url      VARCHAR(255),
    bio             TEXT,
    notify_email    BOOLEAN DEFAULT TRUE,
    notify_inapp    BOOLEAN DEFAULT TRUE,
    theme           ENUM('dark','light') DEFAULT 'dark',

    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (committee_id)
        REFERENCES committees(committee_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    FOREIGN KEY (approved_by)
        REFERENCES members(member_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- -------------------------------------------
-- Member roles / positions (e.g. Tech Lead)
-- -------------------------------------------
CREATE TABLE member_roles (
    member_role_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id      INT NOT NULL,
    position       VARCHAR(100) NOT NULL,
    start_date     DATE,
    end_date       DATE,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
);

-- -------------------------------------------
-- Meetings
-- -------------------------------------------
CREATE TABLE meetings (
    meeting_id    INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(150) NOT NULL,
    topic         VARCHAR(200),
    description   TEXT,
    venue         VARCHAR(100),
    meeting_date  DATE NOT NULL,
    start_time    TIME,
    end_time      TIME,
    created_by    INT NOT NULL,

    FOREIGN KEY (created_by)
        REFERENCES members(member_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- -------------------------------------------
-- Attendance
-- -------------------------------------------
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id    INT NOT NULL,
    member_id     INT NOT NULL,
    status        ENUM('Present','Late','Absent','Excused') DEFAULT 'Absent',
    check_in_time TIME,
    remarks       TEXT,

    FOREIGN KEY (meeting_id)
        REFERENCES meetings(meeting_id)
        ON DELETE CASCADE,
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,

    UNIQUE (meeting_id, member_id)
);

-- -------------------------------------------
-- QR check-in tokens (one active per meeting)
-- -------------------------------------------
CREATE TABLE meeting_qr_tokens (
    qr_token_id  INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id   INT NOT NULL,
    token        CHAR(36) NOT NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    expires_at   TIMESTAMP NULL,
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

-- -------------------------------------------
-- Participation types (point catalog)
-- -------------------------------------------
CREATE TABLE participation_types (
    type_id         INT AUTO_INCREMENT PRIMARY KEY,
    activity_name   VARCHAR(100) NOT NULL UNIQUE,
    default_points  INT NOT NULL,
    description     TEXT
);

-- -------------------------------------------
-- Participation records
-- -------------------------------------------
CREATE TABLE participation (
    participation_id INT AUTO_INCREMENT PRIMARY KEY,
    meeting_id      INT NOT NULL,
    member_id       INT NOT NULL,
    activity        VARCHAR(100) NOT NULL,
    points          INT DEFAULT 0,
    pillar          ENUM('Attendance & Participation','Technical Skills','Projects & GitHub','Community Contribution','Professional Growth') DEFAULT 'Attendance & Participation',
    remarks         TEXT,
    recorded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (meeting_id)
        REFERENCES meetings(meeting_id)
        ON DELETE CASCADE,
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
);

-- -------------------------------------------
-- Events (workshops, hackathons, socials — distinct from meetings)
-- -------------------------------------------
CREATE TABLE events (
    event_id     INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(150) NOT NULL,
    description  TEXT,
    event_type   ENUM('Workshop','Hackathon','Social','Talk','Other') DEFAULT 'Other',
    venue        VARCHAR(100),
    event_date   DATE NOT NULL,
    start_time   TIME,
    end_time     TIME,
    image_url    VARCHAR(255),
    created_by   INT NOT NULL,

    FOREIGN KEY (created_by)
        REFERENCES members(member_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- -------------------------------------------
-- Event registrations
-- -------------------------------------------
CREATE TABLE event_registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id        INT NOT NULL,
    member_id       INT NOT NULL,
    registered_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,

    UNIQUE (event_id, member_id)
);

-- -------------------------------------------
-- Projects
-- -------------------------------------------
CREATE TABLE projects (
    project_id    INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(150) NOT NULL,
    description   TEXT,
    repo_url      VARCHAR(255),
    status        ENUM('Planning','In Progress','Completed','Archived') DEFAULT 'Planning',
    start_date    DATE,
    end_date      DATE,
    created_by    INT NOT NULL,

    FOREIGN KEY (created_by)
        REFERENCES members(member_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE project_members (
    project_member_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id        INT NOT NULL,
    member_id         INT NOT NULL,
    role              VARCHAR(50) DEFAULT 'Member',

    FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,

    UNIQUE (project_id, member_id)
);

-- Reviewer feedback on projects (admin/leader guidance for members)
CREATE TABLE project_comments (
    comment_id  INT AUTO_INCREMENT PRIMARY KEY,
    project_id  INT NOT NULL,
    member_id   INT NOT NULL,
    body        TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id)
        REFERENCES projects(project_id)
        ON DELETE CASCADE,
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
);

-- -------------------------------------------
-- Announcements (Admin-only posts)
-- -------------------------------------------
CREATE TABLE announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    body            TEXT NOT NULL,
    category        ENUM('General','Event','Achievement','Urgent') DEFAULT 'General',
    is_pinned        BOOLEAN DEFAULT FALSE,
    expires_at       TIMESTAMP NULL,
    created_by      INT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by)
        REFERENCES members(member_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- -------------------------------------------
-- Resources (links + file uploads for practice datasets)
-- -------------------------------------------
CREATE TABLE resources (
    resource_id   INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    category      ENUM('Dataset','Tutorial','Article','Tool','Other') DEFAULT 'Other',
    difficulty    ENUM('Beginner','Intermediate','Advanced') DEFAULT 'Beginner',
    link_url      VARCHAR(255),
    file_path     VARCHAR(255),
    file_size     BIGINT,
    uploaded_by   INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (uploaded_by)
        REFERENCES members(member_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- -------------------------------------------
-- Badges (auto-awarded by rules; rule_key resolved in code)
-- -------------------------------------------
CREATE TABLE badges (
    badge_id     INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    description  TEXT,
    icon         VARCHAR(100),
    color        VARCHAR(20),
    rule_key     VARCHAR(100) NOT NULL,
    pillar       ENUM('Attendance & Participation','Technical Skills','Projects & GitHub','Community Contribution','Professional Growth') DEFAULT 'Attendance & Participation'
);

CREATE TABLE member_badges (
    member_badge_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id      INT NOT NULL,
    badge_id       INT NOT NULL,
    awarded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,
    FOREIGN KEY (badge_id)
        REFERENCES badges(badge_id)
        ON DELETE CASCADE,

    UNIQUE (member_id, badge_id)
);

-- -------------------------------------------
-- Point adjustments (manual pillar actions: mentorship, certifications, etc.)
-- -------------------------------------------
CREATE TABLE point_adjustments (
    adjustment_id  INT AUTO_INCREMENT PRIMARY KEY,
    member_id      INT NOT NULL,
    pillar         ENUM('Attendance & Participation','Technical Skills','Projects & GitHub','Community Contribution','Professional Growth') NOT NULL,
    activity       VARCHAR(100) NOT NULL,
    points         INT NOT NULL,
    remarks        TEXT,
    awarded_by     INT,
    awarded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,
    FOREIGN KEY (awarded_by)
        REFERENCES members(member_id)
        ON DELETE SET NULL
);

-- -------------------------------------------
-- GitHub contributions cache (per member, refreshed periodically)
-- -------------------------------------------
CREATE TABLE github_contributions (
    contribution_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id       INT NOT NULL,
    repo_count      INT DEFAULT 0,
    commit_count    INT DEFAULT 0,
    pr_count        INT DEFAULT 0,
    issue_count     INT DEFAULT 0,
    star_count      INT DEFAULT 0,
    streak_days     INT DEFAULT 0,
    fetched_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,

    UNIQUE (member_id)
);

-- Per-day contribution counts (for heatmap rendering)
CREATE TABLE github_daily_activity (
    activity_id  INT AUTO_INCREMENT PRIMARY KEY,
    member_id    INT NOT NULL,
    activity_date DATE NOT NULL,
    count        INT DEFAULT 0,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,

    UNIQUE (member_id, activity_date)
);

-- Cached GitHub repositories per member (refreshed with stats)
CREATE TABLE github_repositories (
    repository_id  INT AUTO_INCREMENT PRIMARY KEY,
    member_id      INT NOT NULL,
    github_repo_id BIGINT NOT NULL,
    name           VARCHAR(200) NOT NULL,
    full_name      VARCHAR(300),
    description    TEXT,
    html_url       VARCHAR(400),
    language       VARCHAR(100),
    star_count     INT DEFAULT 0,
    fork_count     INT DEFAULT 0,
    is_fork        BOOLEAN DEFAULT FALSE,
    pushed_at      TIMESTAMP NULL,
    fetched_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,

    UNIQUE (member_id, github_repo_id)
);

-- -------------------------------------------
-- Notifications (in-app + email log)
-- -------------------------------------------
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id      INT NOT NULL,
    type           VARCHAR(50) NOT NULL,            -- approval, announcement, reminder, etc.
    title          VARCHAR(200) NOT NULL,
    body           TEXT,
    is_read        BOOLEAN DEFAULT FALSE,
    email_sent     BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
);

-- -------------------------------------------
-- Password reset tokens
-- -------------------------------------------
CREATE TABLE password_reset_tokens (
    token_id    INT AUTO_INCREMENT PRIMARY KEY,
    member_id   INT NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used_at     TIMESTAMP NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
);

-- -------------------------------------------
-- System settings (tier thresholds, etc.)
-- -------------------------------------------
CREATE TABLE system_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value TEXT
);

-- -------------------------------------------
-- Articles (file-upload based, review workflow)
-- -------------------------------------------
CREATE TABLE articles (
    article_id    INT AUTO_INCREMENT PRIMARY KEY,
    author_id     INT NOT NULL,
    title         VARCHAR(200) NOT NULL,
    summary       TEXT,
    category      VARCHAR(50),
    file_path     VARCHAR(255) NOT NULL,
    file_size     BIGINT,
    file_type     VARCHAR(50),
    cover_image   VARCHAR(255),
    reading_time  INT DEFAULT 0,
    status        ENUM('Draft','Submitted','Approved','Rejected','Published') DEFAULT 'Draft',
    reviewed_by   INT,
    reviewed_at   TIMESTAMP NULL,
    review_note   TEXT,
    published_at  TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (author_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (reviewed_by)
        REFERENCES members(member_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE article_tags (
    tag_id    INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    tag       VARCHAR(50) NOT NULL,

    FOREIGN KEY (article_id)
        REFERENCES articles(article_id)
        ON DELETE CASCADE,

    UNIQUE (article_id, tag)
);

CREATE TABLE article_likes (
    like_id   INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    member_id  INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (article_id)
        REFERENCES articles(article_id)
        ON DELETE CASCADE,
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,

    UNIQUE (article_id, member_id)
);

CREATE TABLE article_comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    member_id  INT NOT NULL,
    body       TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (article_id)
        REFERENCES articles(article_id)
        ON DELETE CASCADE,
    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_member_email        ON members(email);
CREATE INDEX idx_member_github       ON members(github_handle);
CREATE INDEX idx_member_approval     ON members(approval_status);
CREATE INDEX idx_meeting_date        ON meetings(meeting_date);
CREATE INDEX idx_qr_token_meeting    ON meeting_qr_tokens(meeting_id);
CREATE INDEX idx_attendance_member   ON attendance(member_id);
CREATE INDEX idx_participation_member ON participation(member_id);
CREATE INDEX idx_member_roles_member ON member_roles(member_id);
CREATE INDEX idx_event_date          ON events(event_date);
CREATE INDEX idx_notification_member ON notifications(member_id);
CREATE INDEX idx_point_adjustments_member ON point_adjustments(member_id);
CREATE INDEX idx_github_daily_member ON github_daily_activity(member_id, activity_date);
CREATE INDEX idx_article_author      ON articles(author_id);
CREATE INDEX idx_article_status      ON articles(status);
CREATE INDEX idx_article_category    ON articles(category);
CREATE INDEX idx_article_likes       ON article_likes(article_id);
CREATE INDEX idx_article_comments    ON article_comments(article_id);