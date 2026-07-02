const mongoose = require("mongoose");

const workspaceRequestSchema = new mongoose.Schema(
  {
    librarianId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkspaceRequest", workspaceRequestSchema);
