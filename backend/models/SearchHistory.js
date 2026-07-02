const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    query: { type: String, required: true },
    searchType: {
      type: String,
      required: true,
      enum: ["title", "author", "category", "isbn"]
    },
    resultsCount: { type: Number, default: 0 },
    clickedBook: { type: mongoose.Schema.Types.ObjectId, ref: "Book", default: null }
  },
  { timestamps: true }
);

searchHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SearchHistory", searchHistorySchema);
