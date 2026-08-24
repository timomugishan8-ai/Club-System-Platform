USE ds_chapter_tracker;

-- -------------------------------------------
-- Roles
-- -------------------------------------------
INSERT INTO roles (role_name, description) VALUES
('Admin',  'System Administrator — full access, approves signups'),
('Leader', 'Chapter Leader — manage meetings/events/participation'),
('Member', 'Chapter Member — view + personal tracking');

-- -------------------------------------------
-- Committees
-- -------------------------------------------
INSERT INTO committees (committee_name, description) VALUES
('Executive', 'Executive Committee'),
('Training',  'Training Committee'),
('Media',     'Media and Publicity'),
('Events',    'Events Committee');

-- -------------------------------------------
-- Participation types (point catalog)
-- -------------------------------------------
INSERT INTO participation_types (activity_name, default_points, description) VALUES
('Attendance Bonus',     2,  'Member attended the meeting'),
('Asked Question',       5,  'Asked a meaningful question'),
('Answered Question',    10, 'Answered a question correctly'),
('Presentation',         20, 'Presented during the meeting'),
('Workshop Facilitator', 30, 'Facilitated a workshop'),
('Competition Winner',  50, 'Won a chapter competition');

-- -------------------------------------------
-- Badges (rule_key resolved in code; rules TBD)
-- -------------------------------------------
INSERT INTO badges (name, description, icon, color, rule_key, tier) VALUES
('Python Explorer', 'Completed Python learning modules', 'python',   '#3B6FE8', 'python_explorer', 'Bronze'),
('Data Analyst',    'Analyzed a dataset',                 'chart',    '#22C55E', 'data_analyst',    'Silver'),
('Git Master',      'Multiple Git contributions',         'git-branch','#F59E0B', 'git_master',      'Gold'),
('Consistency Star','High attendance streak',           'star',     '#7C5CFC', 'consistency_star','Silver');

-- -------------------------------------------
-- System settings — leaderboard tier thresholds
-- -------------------------------------------
INSERT INTO system_settings (setting_key, setting_value) VALUES
('tier_bronze_min',  '0'),
('tier_silver_min',  '500'),
('tier_gold_min',    '1500'),
('github_weight',    '1'),   -- points per contribution
('attendance_weight','10');  -- weight of attendance % in progress

-- -------------------------------------------
-- Default Admin account
-- Password: Admin@1234  (change after first login)
-- -------------------------------------------
INSERT INTO members (
    email, password_hash, role_id, is_active, approval_status,
    first_name, last_name, join_date, status, theme
) VALUES (
    'admin@dschapter.org',
    '$2b$10$/JxLmvE/yy.Z0AaAapitUecon.5Kt/YMm.5o.CdWwrFhdpunsaXuS',
    1, TRUE, 'Approved',
    'System', 'Admin', CURDATE(), 'Active', 'dark'
);

-- Verify seed
SELECT 'roles' AS tbl, COUNT(*) AS n FROM roles
UNION ALL SELECT 'committees', COUNT(*) FROM committees
UNION ALL SELECT 'participation_types', COUNT(*) FROM participation_types
UNION ALL SELECT 'badges', COUNT(*) FROM badges
UNION ALL SELECT 'system_settings', COUNT(*) FROM system_settings
UNION ALL SELECT 'members (admin)', COUNT(*) FROM members;