const Book = require("../models/Book");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const getStats = async (req, res, next) => {
  try {
    const user = req.user;
    console.log("📊 Getting stats for:", user.email, "| Role:", user.role);
    
    // ADMIN STATS
    if (user.role === "admin") {
      const [totalBooks, issuedBooks, availableBooksAgg, registeredUsers] = await Promise.all([
        Book.countDocuments(),
        Transaction.countDocuments({ status: "issued" }),
        Book.aggregate([{ $group: { _id: null, total: { $sum: "$available" } } }]),
        User.countDocuments(),
      ]);

      const availableBooks = availableBooksAgg[0]?.total || 0;

      return res.json({ totalBooks, issuedBooks, availableBooks, registeredUsers });
    }
    
    // LIBRARIAN STATS
    if (user.role === "librarian") {
      const [librarianBooks, todayIssues, pendingReturns] = await Promise.all([
        Book.countDocuments({ workspaceId: user._id }),
        Transaction.countDocuments({ 
          status: "issued",
          issueDate: { $gte: new Date().setHours(0, 0, 0, 0) }
        }),
        Transaction.countDocuments({ 
          status: "issued", 
          dueDate: { $lt: new Date() } 
        }),
      ]);

      return res.json({ 
        librarianBooks: librarianBooks || 0, 
        todayIssues: todayIssues || 0, 
        pendingReturns: pendingReturns || 0 
      });
    }
    
    // STUDENT STATS
    if (user.role === "student") {
      const [myBorrows, dueThisWeek, totalRead, pendingRequests] = await Promise.all([
        Transaction.countDocuments({ userId: user._id, status: "issued" }),
        Transaction.countDocuments({ 
          userId: user._id, 
          status: "issued",
          dueDate: { $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        }),
        Transaction.countDocuments({ userId: user._id, status: "returned" }),
        Transaction.countDocuments({ userId: user._id, status: "requested" }),
      ]);

      return res.json({ 
        myBorrows: myBorrows || 0, 
        dueThisWeek: dueThisWeek || 0, 
        totalRead: totalRead || 0,
        pendingRequests: pendingRequests || 0,
      });
    }
    
    return res.status(403).json({ message: "Invalid user role" });
  } catch (error) {
    console.error("Stats error:", error);
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const user = req.user;
    console.log("📈 Getting analytics for:", user.email, "| Role:", user.role);
    
    // For admin and librarian - show most issued books across the library
    // For student - show recommended or popular books
    const mostIssued = await Transaction.aggregate([
      { $group: { _id: "$bookId", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, total: 1, title: { $ifNull: ["$book.title", "Unknown Book"] } } },
    ]);

    res.json({ mostIssued: mostIssued || [] });
  } catch (error) {
    console.error("Analytics error:", error);
    next(error);
  }
};

module.exports = { getStats, getAnalytics };