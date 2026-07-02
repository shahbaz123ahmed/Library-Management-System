const Transaction = require("../models/Transaction");
const { sendReminder } = require("../utils/emailService");

const getNotifications = async (req, res, next) => {
  try {
    const windowDays = Number(process.env.DUE_SOON_DAYS || 3);
    const now = new Date();
    const soon = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

    const [dueSoon, overdue] = await Promise.all([
      Transaction.find({
        status: "issued",
        dueDate: { $gte: now, $lte: soon },
      })
        .populate("userId", "name email")
        .populate("bookId", "title"),
      Transaction.find({
        status: "issued",
        dueDate: { $lt: now },
      })
        .populate("userId", "name email")
        .populate("bookId", "title"),
    ]);

    res.json({ dueSoon, overdue, counts: { dueSoon: dueSoon.length, overdue: overdue.length } });
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/badge — lightweight count for bell icon
const getBadge = async (req, res, next) => {
  try {
    const now = new Date();
    const showPending = req.user.role === "librarian";
    const showWorkspaceRequests = req.user.role === "admin";
    const WorkspaceRequest = require("../models/WorkspaceRequest");
    const Notification = require("../models/Notification");

    const [pendingRequests, overdue, workspaceRequests, unreadInbox] = await Promise.all([
      showPending ? Transaction.countDocuments({ status: "requested" }) : 0,
      Transaction.countDocuments({ status: "issued", dueDate: { $lt: now } }),
      showWorkspaceRequests ? WorkspaceRequest.countDocuments({ status: "pending" }) : 0,
      showPending ? Notification.countDocuments({ recipientId: req.user._id, isRead: false }) : 0,
    ]);

    res.json({
      pendingRequests,
      overdue,
      workspaceRequests,
      unreadInbox,
      total: pendingRequests + overdue + workspaceRequests + unreadInbox
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/inbox — librarian in-app notifications
const getInbox = async (req, res, next) => {
  try {
    const Notification = require("../models/Notification");
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments({ recipientId: req.user._id });
    const items = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("bookId", "title author");

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/inbox/:id/read — mark notification as read
const markRead = async (req, res, next) => {
  try {
    const Notification = require("../models/Notification");
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true }
    );
    res.json({ message: "Marked as read" });
  } catch (error) {
    next(error);
  }
};

const sendReminders = async (req, res, next) => {
  try {
    const windowDays = Number(process.env.DUE_SOON_DAYS || 3);
    const now = new Date();
    const soon = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

    const items = await Transaction.find({
      status: "issued",
      dueDate: { $gte: now, $lte: soon },
    })
      .populate("userId", "name email")
      .populate("bookId", "title");

    let sent = 0;
    for (const item of items) {
      if (!item.userId?.email) continue;
      const ok = await sendReminder({
        to: item.userId.email,
        subject: "Library due reminder",
        html: `<p>Hello ${item.userId.name},</p><p>Your book <strong>${item.bookId?.title}</strong> is due on ${new Date(
          item.dueDate
        ).toDateString()}.</p>`,
      });
      if (ok) sent += 1;
    }

    res.locals.audit = {
      action: "Notification Sent",
      metadata: { total: items.length, sent }
    };

    res.json({ total: items.length, sent });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, sendReminders, getBadge, getInbox, markRead };

