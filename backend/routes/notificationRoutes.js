const express = require("express");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const { getNotifications, sendReminders, getBadge, getInbox, markRead } = require("../controllers/notificationController");

const auditMiddleware = require("../middleware/auditMiddleware");

const router = express.Router();

router.get("/", auth, getNotifications);
router.get("/badge", auth, role("admin", "librarian"), getBadge);
router.post("/reminders", auth, role("admin", "librarian"), auditMiddleware("NOTIFICATION"), sendReminders);

// Librarian in-app notification inbox
router.get("/inbox", auth, role("librarian"), getInbox);
router.patch("/inbox/:id/read", auth, role("librarian"), markRead);

module.exports = router;
