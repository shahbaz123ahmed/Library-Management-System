const express = require("express");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const { listActivityLogs } = require("../controllers/activityLogController");

const router = express.Router();

// Admin-only audit log viewer
router.get("/", auth, role("admin"), listActivityLogs);

module.exports = router;
