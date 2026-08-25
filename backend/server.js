require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const db = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const memberRoutes = require("./routes/memberRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const participationRoutes = require("./routes/participationRoutes");
const eventRoutes = require("./routes/eventRoutes");
const projectRoutes = require("./routes/projectRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const githubRoutes = require("./routes/githubRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const articleRoutes = require("./routes/articleRoutes");
const badgeRoutes = require("./routes/badgeRoutes");
const pointAdjustmentRoutes = require("./routes/pointAdjustmentRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/participation", participationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/point-adjustments", pointAdjustmentRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Data Science Chapter Tracker API" });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});