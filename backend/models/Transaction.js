const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    issueDate: { type: Date },
    dueDate: { type: Date },
    returnDate: { type: Date },
    fine: { type: Number, default: 0 },
    status: { type: String, enum: ["requested", "issued", "returned"], default: "issued" },
    finePerDay: { type: Number, default: null }, // null = use global env var
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, bookId: 1, status: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
