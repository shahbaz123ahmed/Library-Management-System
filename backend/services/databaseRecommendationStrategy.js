const Book = require("../models/Book");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

class DatabaseRecommendationStrategy {
  async getRecommendations({ user, category, bookId }) {
    let query = {};
    if (user.role === "admin") {
      query = {};
    } else if (user.role === "librarian") {
      query = {
        $or: [{ isGlobal: true }, { workspaceId: user._id }]
      };
    } else {
      // Students only see librarian workspace books
      query = { isGlobal: false, workspaceId: { $ne: null } };
    }

    // Fetch user's borrow history to build personalized insights
    let historyCategories = [];
    let historyAuthors = [];
    if (user && user.role === "student") {
      const userTransactions = await Transaction.find({ userId: user._id }).limit(30);
      if (userTransactions.length > 0) {
        const bookIds = userTransactions.map((t) => t.bookId);
        const readBooks = await Book.find({ _id: { $in: bookIds } }).select("category author");
        historyCategories = readBooks.map((b) => b.category).filter(Boolean);
        historyAuthors = readBooks.map((b) => b.author).filter(Boolean);
      }
    }

    // Helper to attach explanation badges to recommended books
    const attachReasonBadges = (books, cat = null) => {
      return books.map((doc) => {
        const book = doc.toObject ? doc.toObject() : doc;
        if (historyAuthors.includes(book.author)) {
          book.recBadge = "Same Author";
        } else if (historyCategories.includes(book.category)) {
          book.recBadge = "Based on Your Borrow History";
        } else if (book.borrowCount && book.borrowCount >= 4) {
          book.recBadge = "Frequently Borrowed";
        } else if (cat && book.category === cat) {
          book.recBadge = `Popular in ${cat}`;
        } else {
          book.recBadge = "Trending This Month";
        }
        return book;
      });
    };

    // 1. Trending Books: Overall most borrowed
    const trendingDocs = await Book.find(query)
      .sort({ available: -1, borrowCount: -1, createdAt: -1 })
      .limit(6);
    const trending = attachReasonBadges(trendingDocs);

    let similar = [];
    let popularInCategory = [];

    if (category) {
      const catQuery = { ...query, category };
      if (bookId && mongoose.Types.ObjectId.isValid(bookId)) {
        catQuery._id = { $ne: bookId };
      }

      // 2. Similar Books
      const similarDocs = await Book.find(catQuery)
        .sort({ available: -1, createdAt: -1 })
        .limit(6);
      similar = attachReasonBadges(similarDocs, category);

      // 3. Popular in Category
      const popularDocs = await Book.find(catQuery)
        .sort({ available: -1, borrowCount: -1, createdAt: -1 })
        .limit(6);
      popularInCategory = attachReasonBadges(popularDocs, category);
    }

    return {
      trending,
      similar,
      popularInCategory
    };
  }
}

module.exports = DatabaseRecommendationStrategy;
