const express = require("express");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const { getNotifications, sendReminders, getBadge } = require("../controllers/notificationController");

const router = express.Router();

router.get("/", auth, getNotifications);
router.get("/badge", auth, role("admin", "librarian"), getBadge);
router.post("/reminders", auth, role("admin", "librarian"), sendReminders);

module.exports = router;
