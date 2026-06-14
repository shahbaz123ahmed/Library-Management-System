const Book = require("../models/Book");
const Transaction = require("../models/Transaction");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Helper function to check if user is admin
const isAdmin = (user) => user.role === "admin";

// Helper function to check if user is librarian
const isLibrarian = (user) => user.role === "librarian";

const createBook = async (req, res, next) => {
  try {
    const { title, author, category, isbn, quantity, description } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : "";
    const user = req.user;

    // Determine if book is global (admin) or workspace-specific (librarian)
    const isGlobal = user.role === "admin";
    const workspaceId = user.role === "librarian" ? user._id : null;

    const book = await Book.create({
      title,
      author,
      category,
      isbn,
      quantity,
      available: quantity,
      description,
      coverImage,
      createdBy: user._id,
      workspaceId: workspaceId,
      isGlobal: isGlobal,
      sourceBookId: null,
    });

    res.status(201).json({ book });
  } catch (error) {
    next(error);
  }
};

const listBooks = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 12);
    const skip = (page - 1) * limit;
    const user = req.user;

    let query = {};

    // Role-based book visibility
    if (user.role === "admin") {
      // Admin sees ALL books (global + all librarian workspaces)
      query = {};
    } 
    else if (user.role === "librarian") {
      // Librarian sees:
      // 1. Global books (admin added) - read-only
      // 2. Books they personally created
      query = {
        $or: [
          { isGlobal: true },
          { workspaceId: user._id }
        ]
      };
    } 
    else {
      // Student sees only global books
      query = { isGlobal: true };
    }

    // Apply filters
    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.availability === "available") {
      query.available = { $gt: 0 };
    }

    if (req.query.search) {
      const search = req.query.search;
      query.$or = [
        { title: new RegExp(search, "i") },
        { author: new RegExp(search, "i") },
        { isbn: new RegExp(search, "i") },
      ];
    }

    const [items, total] = await Promise.all([
      Book.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Book.countDocuments(query),
    ]);

    // Add flag to indicate if book is editable by current user
    const itemsWithPermissions = items.map(book => ({
      ...book.toObject(),
      isEditable: user.role === "admin" || (user.role === "librarian" && book.workspaceId?.toString() === user._id.toString()),
      isDeletable: user.role === "admin" || (user.role === "librarian" && book.workspaceId?.toString() === user._id.toString() && !book.isGlobal),
    }));

    res.json({ items: itemsWithPermissions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

const getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const user = req.user;
    
    // Check if user has access to this book
    if (user.role !== "admin" && !book.isGlobal && book.workspaceId?.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "You don't have access to this book" });
    }

    const isEditable = user.role === "admin" || (user.role === "librarian" && book.workspaceId?.toString() === user._id.toString());
    const isDeletable = user.role === "admin" || (user.role === "librarian" && book.workspaceId?.toString() === user._id.toString() && !book.isGlobal);

    res.json({ 
      book: {
        ...book.toObject(),
        isEditable,
        isDeletable,
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const user = req.user;

    // Check permissions
    const canEdit = user.role === "admin" || (user.role === "librarian" && book.workspaceId?.toString() === user._id.toString());
    
    if (!canEdit) {
      return res.status(403).json({ message: "You don't have permission to edit this book" });
    }

    const { title, author, category, isbn, quantity, description } = req.body;

    if (title) book.title = title;
    if (author) book.author = author;
    if (category) book.category = category;
    if (isbn) book.isbn = isbn;
    if (description) book.description = description;

    if (typeof quantity !== "undefined") {
      const newQty = Number(quantity);
      const diff = newQty - book.quantity;
      const newAvailable = book.available + diff;
      if (newAvailable < 0) {
        return res.status(400).json({ message: "Available count cannot be negative" });
      }
      book.quantity = newQty;
      book.available = newAvailable;
    }

    if (req.file) {
      book.coverImage = `/uploads/${req.file.filename}`;
    }

    await book.save();
    res.json({ book });
  } catch (error) {
    next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const user = req.user;

    // Admin can delete ANY book
    if (user.role === "admin") {
      await book.deleteOne();
      return res.json({ message: "Book deleted from master catalog" });
    }

    // Librarian can ONLY delete their OWN books (not global/admin books)
    if (user.role === "librarian") {
      if (book.isGlobal === true) {
        return res.status(403).json({ 
          message: "Cannot delete admin-added books. You can only delete books you added to your workspace." 
        });
      }

      if (book.workspaceId?.toString() !== user._id.toString()) {
        return res.status(403).json({ 
          message: "You can only delete books from your own workspace." 
        });
      }

      await book.deleteOne();
      return res.json({ message: "Book deleted from your workspace only" });
    }

    return res.status(403).json({ message: "Not authorized to delete books" });
  } catch (error) {
    next(error);
  }
};

// Copy admin book to librarian's workspace
const copyBookToWorkspace = async (req, res, next) => {
  try {
    const adminBook = await Book.findById(req.params.id);
    const user = req.user;

    if (!adminBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!adminBook.isGlobal) {
      return res.status(400).json({ message: "This book is not from admin catalog" });
    }

    if (user.role !== "librarian") {
      return res.status(403).json({ message: "Only librarians can copy books to their workspace" });
    }

    // Check if librarian already has a copy
    const existingCopy = await Book.findOne({
      sourceBookId: adminBook._id,
      workspaceId: user._id,
    });

    if (existingCopy) {
      return res.json({ book: existingCopy, message: "Book already in your workspace" });
    }

    // Create librarian's personal copy
    const librarianCopy = new Book({
      title: adminBook.title,
      author: adminBook.author,
      category: adminBook.category,
      isbn: adminBook.isbn,
      quantity: adminBook.quantity,
      available: adminBook.available,
      description: adminBook.description,
      coverImage: adminBook.coverImage,
      createdBy: user._id,
      workspaceId: user._id,
      isGlobal: false,
      sourceBookId: adminBook._id,
    });

    await librarianCopy.save();
    res.status(201).json({ book: librarianCopy, message: "Book copied to your workspace" });
  } catch (error) {
    next(error);
  }
};

const suggestBooks = async (req, res, next) => {
  try {
    const search = req.query.q || "";
    const user = req.user;
    
    let query = {};
    
    if (user.role === "admin") {
      query = {};
    } else if (user.role === "librarian") {
      query = {
        $or: [
          { isGlobal: true },
          { workspaceId: user._id }
        ]
      };
    } else {
      query = { isGlobal: true };
    }
    
    query.title = new RegExp(search, "i");
    
    const items = await Book.find(query)
      .select("title author")
      .limit(5);

    res.json({ items });
  } catch (error) {
    next(error);
  }
};

const listCategories = async (req, res, next) => {
  try {
    const user = req.user;
    let query = {};
    
    if (user.role === "admin") {
      query = {};
    } else if (user.role === "librarian") {
      query = {
        $or: [
          { isGlobal: true },
          { workspaceId: user._id }
        ]
      };
    } else {
      query = { isGlobal: true };
    }
    
    const items = await Book.distinct("category", query);
    res.json({ items });
  } catch (error) {
    next(error);
  }
};

const listMostIssued = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 5);
    const mostIssued = await Transaction.aggregate([
      { $group: { _id: "$bookId", totalIssued: { $sum: 1 } } },
      { $sort: { totalIssued: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          totalIssued: 1,
          bookId: "$_id",
          title: "$book.title",
          author: "$book.author",
          isbn: "$book.isbn",
          available: "$book.available",
          quantity: "$book.quantity",
        },
      },
    ]);

    res.json({ items: mostIssued });
  } catch (error) {
    next(error);
  }
};

const lookupAuthor = async (req, res, next) => {
  try {
    const title = String(req.query.title || "").trim();
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const exactMatch = await Book.findOne({
      title: new RegExp(`^${escapeRegex(title)}$`, "i"),
    }).select("title author");

    if (exactMatch?.author) {
      return res.json({ author: exactMatch.author, source: "local", title: exactMatch.title });
    }

    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`
    );
    if (!response.ok) {
      return res.json({ author: null, source: "openlibrary" });
    }
    const data = await response.json();
    const author = data?.docs?.[0]?.author_name?.[0] || null;
    return res.json({ author, source: "openlibrary" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBook,
  listBooks,
  getBook,
  updateBook,
  deleteBook,
  copyBookToWorkspace,  // NEW
  suggestBooks,
  listCategories,
  listMostIssued,
  lookupAuthor,
};