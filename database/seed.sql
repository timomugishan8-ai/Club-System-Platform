USE ds_chapter_tracker;

-- Roles
INSERT INTO roles (role_name, description) VALUES
('Admin', 'System Administrator'),
('Leader', 'Chapter Leader');

-- Committees
INSERT INTO committees (committee_name, description) VALUES
('Executive', 'Executive Committee'),
('Training', 'Training Committee'),
('Media', 'Media and Publicity'),
('Events', 'Events Committee');

-- Participation Types
INSERT INTO participation_types (activity_name, default_points, description) VALUES
('Attendance Bonus', 2, 'Member attended the meeting'),
('Asked Question', 5, 'Asked a meaningful question'),
('Answered Question', 10, 'Answered a question correctly'),
('Presentation', 20, 'Presented during the meeting'),
('Workshop Facilitator', 30, 'Facilitated a workshop'),
('Competition Winner', 50, 'Won a chapter competition');

SELECT * FROM roles;

