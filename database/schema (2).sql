-- ============================================
-- Data Science Chapter Tracker Database
-- Author: Natuyamba Conrad
-- ============================================

DROP DATABASE IF EXISTS ds_chapter_tracker;

CREATE DATABASE IF NOT EXISTS ds_chapter_tracker;

USE ds_chapter_tracker;

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    role_id INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE committees (
    committee_id INT AUTO_INCREMENT PRIMARY KEY,
    committee_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE members (
    member_id INT AUTO_INCREMENT PRIMARY KEY,

    student_number VARCHAR(20) NOT NULL UNIQUE,

    first_name VARCHAR(50) NOT NULL,

    last_name VARCHAR(50) NOT NULL,

    gender ENUM('Male','Female','Other'),

    email VARCHAR(100) UNIQUE,

    phone VARCHAR(20),

    course VARCHAR(100),

    year_of_study INT,

    committee_id INT,

    join_date DATE,

    status ENUM('Active','Inactive') DEFAULT 'Active',

    FOREIGN KEY (committee_id)
        REFERENCES committees(committee_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE meetings (
    meeting_id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(150) NOT NULL,

    topic VARCHAR(200),

    description TEXT,

    venue VARCHAR(100),

    meeting_date DATE NOT NULL,

    start_time TIME,

    end_time TIME,

    created_by INT NOT NULL,

    FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,

    meeting_id INT NOT NULL,

    member_id INT NOT NULL,

    status ENUM(
        'Present',
        'Late',
        'Absent',
        'Excused'
    ) DEFAULT 'Absent',

    check_in_time TIME,

    remarks TEXT,

    FOREIGN KEY (meeting_id)
        REFERENCES meetings(meeting_id)
        ON DELETE CASCADE,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE,

    UNIQUE (meeting_id, member_id)
);

CREATE TABLE participation_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,

    activity_name VARCHAR(100) NOT NULL UNIQUE,

    default_points INT NOT NULL,

    description TEXT
);


CREATE TABLE participation (
    participation_id INT AUTO_INCREMENT PRIMARY KEY,

    meeting_id INT NOT NULL,

    member_id INT NOT NULL,

    activity VARCHAR(100) NOT NULL,

    points INT DEFAULT 0,

    remarks TEXT,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (meeting_id)
        REFERENCES meetings(meeting_id)
        ON DELETE CASCADE,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
);

CREATE TABLE member_roles (
    member_role_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    position VARCHAR(100) NOT NULL,
    start_date DATE,
    end_date DATE,

    FOREIGN KEY (member_id)
        REFERENCES members(member_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_member_email
ON members(email);

CREATE INDEX idx_meeting_date
ON meetings(meeting_date);

CREATE INDEX idx_attendance_member
ON attendance(member_id);

CREATE INDEX idx_participation_member
ON participation(member_id);

CREATE INDEX idx_member_roles_member
ON member_roles(member_id);

ALTER TABLE users
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    DEFAULT CHARACTER SET = 'utf8mb4';