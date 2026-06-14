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
    const [pendingRequests, overdue] = await Promise.all([
      Transaction.countDocuments({ status: "requested" }),
      Transaction.countDocuments({ status: "issued", dueDate: { $lt: now } }),
    ]);
    res.json({ pendingRequests, overdue, total: pendingRequests + overdue });
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

    res.json({ total: items.length, sent });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, sendReminders, getBadge };
