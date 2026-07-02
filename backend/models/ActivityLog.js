const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      required: true,
      enum: ["AUTH", "BOOK", "CATEGORY", "TRANSACTION", "USER", "CHATBOT", "NOTIFICATION"]
    },
    action: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    performedByName: { type: String, default: "System" },
    userRole: { type: String, default: "System" },
    targetBook: { type: mongoose.Schema.Types.ObjectId, ref: "Book", default: null },
    targetBookTitle: { type: String, default: "" },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    targetUserName: { type: String, default: "" },
    status: { type: String, enum: ["success", "failed"], default: "success" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Optimize search/filtering queries by indexing performance-critical fields
activityLogSchema.index({ activityType: 1 });
activityLogSchema.index({ performedBy: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
