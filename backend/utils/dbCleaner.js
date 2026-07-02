const { normalizeCategory } = require("./similarity");

const cleanDatabase = async () => {
  try {
    const Book = require("../models/Book");
    const Transaction = require("../models/Transaction");
    const User = require("../models/User");

    console.log("🧹 Running database cleanup & normalization...");

    // 1. Category Normalization
    const books = await Book.find({});
    let categoryUpdates = 0;
    for (const book of books) {
      if (book.category) {
        const normalized = normalizeCategory(book.category);
        if (normalized !== book.category) {
          book.category = normalized;
          await book.save();
          categoryUpdates++;
        }
      }
    }
    if (categoryUpdates > 0) {
      console.log(`✅ Normalized categories for ${categoryUpdates} books.`);
    }

    // 2. Duplicate ISBN Merger — only for global/admin books; workspace copies intentionally share ISBNs
    const duplicates = await Book.aggregate([
      { $match: { isGlobal: true } },  // only consider global books for duplicate detection
      { $group: { _id: "$isbn", count: { $sum: 1 }, ids: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    let mergedCount = 0;
    for (const dup of duplicates) {
      const isbn = dup._id;
      if (!isbn || isbn.trim().toUpperCase() === "N/A" || isbn.trim() === "") continue;

      // Only look at global books — never touch workspace copies
      const dupBooks = await Book.find({ isbn, isGlobal: true });
      if (dupBooks.length <= 1) continue;

      // Primary book is the one with highest quantity
      dupBooks.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
      const primaryBook = dupBooks[0];

      for (let i = 1; i < dupBooks.length; i++) {
        const otherBook = dupBooks[i];
        
        primaryBook.quantity += (otherBook.quantity || 0);
        primaryBook.available += (otherBook.available || 0);

        // Redirect transactions
        await Transaction.updateMany(
          { bookId: otherBook._id },
          { $set: { bookId: primaryBook._id } }
        );

        // Redirect wishlists in User schema
        await User.updateMany(
          { wishlist: otherBook._id },
          { $set: { "wishlist.$[elem]": primaryBook._id } },
          { arrayFilters: [{ "elem": otherBook._id }] }
        );

        // Delete duplicate global book only
        await Book.deleteOne({ _id: otherBook._id, isGlobal: true });
        mergedCount++;
      }

      await primaryBook.save();
    }

    if (mergedCount > 0) {
      console.log(`✅ Merged ${mergedCount} duplicate global book entries by ISBN.`);
    }

    // 3. Sync borrowCount from Transaction history
    const txCounts = await Transaction.aggregate([
      { $group: { _id: "$bookId", count: { $sum: 1 } } }
    ]);
    
    // Reset all books borrowCount to 0
    await Book.updateMany({}, { $set: { borrowCount: 0 } });
    
    // Set actual borrowCount
    let countUpdates = 0;
    for (const item of txCounts) {
      if (item._id) {
        await Book.updateOne({ _id: item._id }, { $set: { borrowCount: item.count } });
        countUpdates++;
      }
    }
    if (countUpdates > 0) {
      console.log(`✅ Synced borrowCount for ${countUpdates} books from Transaction logs.`);
    }

    console.log("🧹 Database cleanup & normalization completed!");
  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
  }
};

module.exports = cleanDatabase;
