const Book = require("../models/Book");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");

const getExtendedAnalytics = async () => {
  // 1. Top Borrowers (Students with most transactions)
  const topBorrowers = await Transaction.aggregate([
    { $group: { _id: "$userId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $project: { _id: 0, name: "$user.name", email: "$user.email", count: 1 } }
  ]);

  // 2. Most Active Librarians (Based on activity log approvals/issues)
  const activeLibrarians = await ActivityLog.aggregate([
    { 
      $match: { 
        userRole: "librarian",
        action: { $in: ["Book Borrowed", "Borrow Rejected", "Book Returned"] }
      } 
    },
    { $group: { _id: "$performedBy", name: { $first: "$performedByName" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, name: 1, count: 1 } }
  ]);

  // 3. Average Fine
  const avgFineAgg = await Transaction.aggregate([
    { $group: { _id: null, avgFine: { $avg: "$fine" } } }
  ]);
  const avgFine = avgFineAgg[0]?.avgFine || 0;

  // 4. Average Borrow Duration (in days)
  const avgDurationAgg = await Transaction.aggregate([
    { $match: { status: "returned", issueDate: { $ne: null }, returnDate: { $ne: null } } },
    {
      $project: {
        duration: {
          $divide: [{ $subtract: ["$returnDate", "$issueDate"] }, 24 * 60 * 60 * 1000]
        }
      }
    },
    { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
  ]);
  const avgBorrowDuration = avgDurationAgg[0]?.avgDuration || 0;

  // 5. Books Never Borrowed
  const borrowedBookIds = await Transaction.distinct("bookId");
  const booksNeverBorrowed = await Book.find({ _id: { $nin: borrowedBookIds } })
    .select("title author")
    .limit(5);

  // 6. Most Borrowed Authors
  const topAuthors = await Transaction.aggregate([
    { $group: { _id: "$bookId", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "books",
        localField: "_id",
        foreignField: "_id",
        as: "book"
      }
    },
    { $unwind: "$book" },
    { $group: { _id: "$book.author", count: { $sum: "$count" } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, author: "$_id", count: 1 } }
  ]);

  // 7. Monthly Trends (Borrows vs Returns)
  const monthlyBorrows = await Transaction.aggregate([
    { $match: { issueDate: { $ne: null } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$issueDate" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const monthlyReturns = await Transaction.aggregate([
    { $match: { status: "returned", returnDate: { $ne: null } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$returnDate" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return {
    topBorrowers: topBorrowers || [],
    activeLibrarians: activeLibrarians || [],
    avgFine: Number(avgFine.toFixed(2)),
    avgBorrowDuration: Number(avgBorrowDuration.toFixed(1)),
    booksNeverBorrowed: booksNeverBorrowed || [],
    topAuthors: topAuthors || [],
    monthlyBorrows: monthlyBorrows || [],
    monthlyReturns: monthlyReturns || []
  };
};

module.exports = { getExtendedAnalytics };
