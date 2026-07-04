const express = require("express");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const { getNotifications, sendReminders, getBadge, getInbox, markRead } = require("../controllers/notificationController");

const auditMiddleware = require("../middleware/auditMiddleware");

const router = express.Router();

router.get("/", auth, getNotifications);
router.get("/badge", auth, getBadge);
router.post("/reminders", auth, role("admin", "librarian"), auditMiddleware("NOTIFICATION"), sendReminders);

// User in-app notification inbox
router.get("/inbox", auth, getInbox);
router.patch("/inbox/:id/read", auth, markRead);

module.exports = router;
