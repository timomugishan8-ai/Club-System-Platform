const express = require("express");
const router = express.Router();

const searchController = require("../controllers/searchController");
const { verifyToken } = require("../middleware/authMiddleware");
const { loadRoleName } = require("../middleware/roleMiddleware");

router.use(verifyToken, loadRoleName);

router.get("/", searchController.search);

module.exports = router;