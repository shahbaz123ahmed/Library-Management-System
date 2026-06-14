const Book = require("../models/Book");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const calculateFine = require("../utils/fineCalculator");

// ── Student requests to borrow a book via chat ──────────────────────────────
const requestBorrow = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    const userId = req.user._id;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    // Prevent duplicate active request or issue for the same book
    const existing = await Transaction.findOne({
      userId,
      bookId,
      status: { $in: ["requested", "issued"] },
    });
    if (existing) {
      return res.status(400).json({
        message:
          existing.status === "requested"
            ? "You already have a pending borrow request for this book"
            : "You already have this book issued",
      });
    }

    // Create a pending request — available count is NOT decremented yet
    const transaction = await Transaction.create({
      userId,
      bookId,
      status: "requested",
    });

    const populated = await transaction.populate([
      { path: "userId", select: "name email role" },
      { path: "bookId", select: "title author isbn" },
    ]);

    res.status(201).json({ transaction: populated });
  } catch (error) {
    next(error);
  }
};

// ── Librarian / Admin approves a pending request ────────────────────────────
const approveRequest = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (transaction.status !== "requested") {
      return res.status(400).json({ message: "Only pending requests can be approved" });
    }

    const book = await Book.findById(transaction.bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.available <= 0) {
      return res.status(400).json({ message: "Book is no longer available" });
    }

    const dueDays = req.body.dueDays
      ? Number(req.body.dueDays)
      : Number(process.env.DUE_DAYS || 14);

    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + dueDays * 24 * 60 * 60 * 1000);

    transaction.status = "issued";
    transaction.issueDate = issueDate;
    transaction.dueDate = dueDate;
    if (req.body.finePerDay !== undefined && req.body.finePerDay !== "") {
      transaction.finePerDay = Number(req.body.finePerDay);
    }
    await transaction.save();

    book.available -= 1;
    await book.save();

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

// ── Librarian / Admin issues a book directly ────────────────────────────────
const issueBook = async (req, res, next) => {
  try {
    const { userId, bookId, issueDate, dueDays } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.available <= 0) {
      return res.status(400).json({ message: "Book not available" });
    }

    const issue = issueDate ? new Date(issueDate) : new Date();
    const days = dueDays ? Number(dueDays) : Number(process.env.DUE_DAYS || 14);
    const dueDate = new Date(issue.getTime() + days * 24 * 60 * 60 * 1000);

    const txData = {
      userId,
      bookId,
      issueDate: issue,
      dueDate,
      status: "issued",
    };
    if (req.body.finePerDay !== undefined && req.body.finePerDay !== "") {
      txData.finePerDay = Number(req.body.finePerDay);
    }

    const transaction = await Transaction.create(txData);

    book.available -= 1;
    await book.save();

    res.status(201).json({ transaction });
  } catch (error) {
    next(error);
  }
};

// ── Librarian / Admin marks a book as returned ──────────────────────────────
const returnBook = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.status === "returned") {
      return res.status(400).json({ message: "Book already returned" });
    }

    const book = await Book.findById(transaction.bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const returnDate = new Date();
    const finePerDay = transaction.finePerDay ?? Number(process.env.FINE_PER_DAY || 2);
    const fine = calculateFine(transaction.dueDate, returnDate, finePerDay);

    transaction.returnDate = returnDate;
    transaction.fine = fine;
    transaction.status = "returned";
    await transaction.save();

    book.available = Math.min(book.quantity, book.available + 1);
    await book.save();

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

// ── List transactions with optional search / status filter ──────────────────
const listTransactions = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.status) query.status = req.query.status;
    if (req.query.excludeStatus) query.status = { $ne: req.query.excludeStatus };
    if (req.query.search) {
      const search = String(req.query.search).trim();
      if (search) {
        const regex = new RegExp(search, "i");
        const [users, books] = await Promise.all([
          User.find({ name: regex }).select("_id"),
          Book.find({ $or: [{ title: regex }, { isbn: regex }] }).select("_id"),
        ]);
        const userIds = users.map((u) => u._id);
        const bookIds = books.map((b) => b._id);
        query.$or = [{ userId: { $in: userIds } }, { bookId: { $in: bookIds } }];
      }
    }

    const [items, total] = await Promise.all([
      Transaction.find(query)
        .populate("userId", "name email role")
        .populate("bookId", "title author isbn")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Transaction.countDocuments(query),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// ── Librarian / Admin rejects a pending borrow request ──────────────────────
const rejectRequest = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (transaction.status !== "requested") {
      return res.status(400).json({ message: "Only pending requests can be rejected" });
    }
    await transaction.deleteOne();
    res.json({ message: "Request rejected" });
  } catch (error) {
    next(error);
  }
};

module.exports = { requestBorrow, approveRequest, rejectRequest, issueBook, returnBook, listTransactions };
