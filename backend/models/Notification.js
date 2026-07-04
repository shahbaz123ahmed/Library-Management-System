const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["BOOK_ASSIGNED", "WORKSPACE_REQUEST_APPROVED", "WORKSPACE_REQUEST_REJECTED", "BORROW_APPROVED", "BORROW_REJECTED", "GENERAL"],
      default: "GENERAL",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
