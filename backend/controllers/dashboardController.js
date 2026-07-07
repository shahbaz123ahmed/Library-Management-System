const Book = require("../models/Book");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const getStats = async (req, res, next) => {
  try {
    const user = req.user;
    console.log("📊 Getting stats for:", user.email, "| Role:", user.role);
    
    // ADMIN STATS
    if (user.role === "admin") {
      const [totalBooksList, issuedBooksList, availableBooksList, registeredUsersList] = await Promise.all([
        Book.find().select("title author coverImage").limit(50),
        Transaction.find({ status: "issued" }).populate("bookId", "title author coverImage").populate("userId", "name").limit(50),
        Book.find({ available: { $gt: 0 } }).select("title author coverImage available").limit(50),
        User.find().select("name email role").limit(50),
      ]);
      const [totalBooks, issuedBooks, availableBooksAgg, registeredUsers] = await Promise.all([
        Book.countDocuments(),
        Transaction.countDocuments({ status: "issued" }),
        Book.aggregate([{ $group: { _id: null, total: { $sum: "$available" } } }]),
        User.countDocuments(),
      ]);

      const availableBooks = availableBooksAgg[0]?.total || 0;

      return res.json({ 
        totalBooks, 
        issuedBooks, 
        availableBooks, 
        registeredUsers,
        totalBooksList,
        issuedBooksList,
        availableBooksList,
        registeredUsersList
      });
    }
    
    // LIBRARIAN STATS
    if (user.role === "librarian") {
      const [librarianBooksList, todayIssuesList, pendingReturnsList, totalMembersList] = await Promise.all([
        Book.find({ workspaceId: user._id }).select("title author coverImage").limit(50),
        Transaction.find({ 
          status: "issued",
          issueDate: { $gte: new Date().setHours(0, 0, 0, 0) }
        }).populate("bookId", "title author coverImage").populate("userId", "name").limit(50),
        Transaction.find({ 
          status: "issued", 
          dueDate: { $lt: new Date() } 
        }).populate("bookId", "title author coverImage").populate("userId", "name").limit(50),
        User.find({ role: "student" }).select("name email").limit(50)
      ]);
      const [librarianBooks, todayIssues, pendingReturns, totalMembers] = await Promise.all([
        Book.countDocuments({ workspaceId: user._id }),
        Transaction.countDocuments({ 
          status: "issued",
          issueDate: { $gte: new Date().setHours(0, 0, 0, 0) }
        }),
        Transaction.countDocuments({ 
          status: "issued", 
          dueDate: { $lt: new Date() } 
        }),
        User.countDocuments({ role: "student" })
      ]);

      return res.json({ 
        librarianBooks: librarianBooks || 0, 
        todayIssues: todayIssues || 0, 
        pendingReturns: pendingReturns || 0,
        totalMembers: totalMembers || 0,
        librarianBooksList,
        todayIssuesList,
        pendingReturnsList,
        totalMembersList
      });
    }
    
    // STUDENT STATS
    if (user.role === "student") {
      const [myBorrowsList, dueThisWeekList, totalReadList, pendingRequestsList] = await Promise.all([
        Transaction.find({ userId: user._id, status: "issued" }).populate("bookId", "title author coverImage"),
        Transaction.find({ 
          userId: user._id, 
          status: "issued",
          dueDate: { $lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        }).populate("bookId", "title author coverImage dueDate"),
        Transaction.find({ userId: user._id, status: "returned" }).populate("bookId", "title author coverImage"),
        Transaction.find({ userId: user._id, status: "requested" }).populate("bookId", "title author coverImage"),
      ]);

      return res.json({ 
        myBorrows: myBorrowsList.length || 0, 
        dueThisWeek: dueThisWeekList.length || 0, 
        totalRead: totalReadList.length || 0,
        pendingRequests: pendingRequestsList.length || 0,
        myBorrowsList,
        dueThisWeekList,
        totalReadList,
        pendingRequestsList
      });
    }
    
    return res.status(403).json({ message: "Invalid user role" });
  } catch (error) {
    console.error("Stats error:", error);
    next(error);
  }
};

const { getExtendedAnalytics } = require("../services/analyticsService");

const getAnalytics = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Maintain backward compatibility for existing charts
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

    const extended = await getExtendedAnalytics();

    res.json({
      mostIssued: mostIssued || [],
      ...extended
    });
  } catch (error) {
    console.error("Analytics error:", error);
    next(error);
  }
};

module.exports = { getStats, getAnalytics };