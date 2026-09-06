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
-- Participation types (point catalog by pillar)
-- -------------------------------------------
INSERT INTO participation_types (activity_name, default_points, description) VALUES
-- Attendance & Participation
('Attendance Bonus',          2,  'Member attended the meeting (Present)'),
('Late Attendance',           1,  'Member arrived late'),
('Absent Penalty',           -2,  'Member was absent without excuse'),
('Asked Question',            5,  'Asked a meaningful question'),
('Answered Question',        10,  'Answered a question correctly'),
('Attendance Streak (4w)',   10,  '4-week attendance streak bonus'),
('Attendance Streak (8w)',   25,  '8-week attendance streak bonus'),
('Attendance Streak (12w)',  50,  '12-week attendance streak bonus'),
-- Technical Skills
('Presentation',             20,  'Presented during the meeting'),
('Workshop Facilitator',     30,  'Facilitated a workshop'),
('In-Session Exercise',       8,  'Completed in-session exercise'),
('Learning Module',          15,  'Completed a learning module'),
('Article Published',        25,  'Published an article or blog'),
-- Projects & GitHub
('Project Joined',           10,  'Joined a project'),
('Project Completed',        40,  'Project completed (member)'),
('GitHub PR Merged',          2,  'GitHub pull request merged'),
('GitHub Issue Closed',       1,  'GitHub issue closed'),
('GitHub Repo Stars',        15,  'Repo reached 5+ stars'),
-- Community Contribution
('Helped Solve Problem',      8,  'Helped another member solve a problem'),
('Shared Resources',          5,  'Shared useful resources'),
('Volunteered',              15,  'Volunteered in chapter sessions and events'),
('Mentored Junior',          20,  'Mentored a junior member'),
('Organized Event',          25,  'Helped organize an event'),
('Recruited Member',          15,  'Recruited a new member'),
('Competition Winner',       50,  'Won a chapter competition'),
('Article Like',              1,  'Article received a like (max 50)'),
-- Professional Growth
('External Event',           15,  'Attended an external event'),
('Certification',            50,  'Earned an external certification'),
('Internship',               75,  'Completed an internship'),
('Research Published',       60,  'Published research or paper'),
('Landed DS Role',          100,  'Landed a data science role');

-- -------------------------------------------
-- Badges (flat awards; rule_key resolved in code)
-- -------------------------------------------
INSERT INTO badges (name, description, icon, color, rule_key, pillar) VALUES
('Python Explorer',  'Completed a Python project',                  'python',      '#3B6FE8', 'python_explorer',   'Projects & GitHub'),
('Data Analyst',     'Gave a presentation',                          'chart',       '#22C55E', 'data_analyst',      'Technical Skills'),
('Git Master',       '10 GitHub commits',                            'git-branch',  '#F59E0B', 'git_master',        'Projects & GitHub'),
('Consistency Star', '4-week attendance streak',                     'star',        '#7C5CFC', 'consistency_star',  'Attendance & Participation'),
('Git Champion',     '50 commits + 5 PRs',                           'trophy',      '#EF4444', 'git_champion',      'Projects & GitHub'),
('Community Builder','Answered 5 questions',                          'users',       '#06B6D4', 'community_builder', 'Community Contribution'),
('R Rookie',         'Completed an R project',                       'code',        '#10B981', 'r_rookie',          'Projects & GitHub'),
('R Master',         'Completed 3 R projects',                       'award',       '#0EA5E9', 'r_master',          'Projects & GitHub'),
('Visualization Guru','Gave 3 presentations',                         'bar-chart',   '#8B5CF6', 'viz_guru',          'Technical Skills'),
('Model Builder',    'Facilitated a workshop',                       'cpu',         '#EC4899', 'model_builder',     'Technical Skills');

-- -------------------------------------------
-- System settings — leaderboard tier thresholds
-- -------------------------------------------
INSERT INTO system_settings (setting_key, setting_value) VALUES
('tier_rookie_min',      '0'),
('tier_rising_star_min', '100'),
('tier_bronze_min',      '300'),
('tier_silver_min',      '700'),
('tier_gold_min',        '1500'),
('tier_diamond_min',     '3000'),
('github_weight',        '1'),
('attendance_weight',    '10'),
('late_grace_minutes',   '15');

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