const Book = require("../models/Book");
const Transaction = require("../models/Transaction");
const { parseNaturalQuery } = require("../utils/queryParser");
const { getStringSimilarity, normalizeCategory } = require("../utils/similarity");

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
      category: normalizeCategory(category), // Normalize category on creation
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
      query = {};
    } 
    else if (user.role === "librarian") {
      query = {
        $or: [
          { isGlobal: true },
          { workspaceId: user._id }
        ]
      };
    } 
    else {
      query = { isGlobal: true };
    }

    // Apply natural language query parsing if search query is provided
    let searchStr = req.query.search || "";
    let parsed = { search: searchStr, filters: {}, sort: null };
    
    if (searchStr) {
      parsed = parseNaturalQuery(searchStr);
    }

    // Blend query params with parsed NLP filters (explicit query params take precedence)
    const categoryFilter = req.query.category || parsed.filters.category;
    const availabilityFilter = req.query.availability || parsed.filters.availability;
    const authorFilter = req.query.author || parsed.filters.author;
    const sortCriteria = req.query.sort || parsed.sort;
    const keywordSearch = parsed.search;

    if (categoryFilter) {
      query.category = normalizeCategory(categoryFilter);
    }

    if (availabilityFilter === "available") {
      query.available = { $gt: 0 };
    }

    if (authorFilter) {
      query.author = new RegExp(escapeRegex(authorFilter), "i");
    }

    // Regex match setup for key fields (ISBN / title / author)
    let regexSearchQuery = null;
    if (keywordSearch) {
      regexSearchQuery = {
        $or: [
          { title: new RegExp(escapeRegex(keywordSearch), "i") },
          { author: new RegExp(escapeRegex(keywordSearch), "i") },
          { isbn: new RegExp(escapeRegex(keywordSearch), "i") },
        ]
      };
    }

    // Build the final Mongoose query
    let finalQuery = { ...query };
    if (regexSearchQuery) {
      if (finalQuery.$or) {
        finalQuery = { $and: [ { $or: finalQuery.$or }, regexSearchQuery ] };
      } else {
        finalQuery.$or = regexSearchQuery.$or;
      }
    }

    // Retrieve matching records
    let items = await Book.find(finalQuery);

    // Fuzzy matching fallback if regular search returns nothing
    if (items.length === 0 && keywordSearch) {
      const scopeQuery = { ...query };
      const scopeBooks = await Book.find(scopeQuery);

      const ratedBooks = scopeBooks.map(book => {
        const titleSim = getStringSimilarity(book.title, keywordSearch);
        const authorSim = getStringSimilarity(book.author, keywordSearch);
        const catSim = getStringSimilarity(book.category, keywordSearch);
        const maxSim = Math.max(titleSim, authorSim, catSim);
        return { book, score: maxSim };
      });

      const fuzzyMatches = ratedBooks
        .filter(item => item.score > 0.3)
        .sort((a, b) => b.score - a.score)
        .map(item => item.book);

      items = fuzzyMatches;
    }

    // Multi-criteria ranking and sorting
    items.sort((a, b) => {
      // 1. Availability sorting (always put available books first)
      const aAvail = a.available > 0 ? 1 : 0;
      const bAvail = b.available > 0 ? 1 : 0;
      if (aAvail !== bAvail) {
        return bAvail - aAvail;
      }

      // 2. Specific sorting criteria requested
      if (sortCriteria === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sortCriteria === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortCriteria === "popularity") {
        return (b.borrowCount || 0) - (a.borrowCount || 0);
      }
      if (sortCriteria === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }

      // 3. Relevance similarity score
      if (keywordSearch) {
        const aSim = Math.max(
          getStringSimilarity(a.title, keywordSearch),
          getStringSimilarity(a.author, keywordSearch)
        );
        const bSim = Math.max(
          getStringSimilarity(b.title, keywordSearch),
          getStringSimilarity(b.author, keywordSearch)
        );
        if (Math.abs(aSim - bSim) > 0.05) {
          return bSim - aSim;
        }
      }

      // 4. Default: popularity
      return (b.borrowCount || 0) - (a.borrowCount || 0);
    });

    const total = items.length;
    const paginatedItems = items.slice(skip, skip + limit);

    const itemsWithPermissions = paginatedItems.map(book => ({
      ...book.toObject(),
      isEditable: user.role === "admin" || (user.role === "librarian" && book.workspaceId?.toString() === user._id.toString()),
      isDeletable: user.role === "admin" || (user.role === "librarian" && book.workspaceId?.toString() === user._id.toString() && !book.isGlobal),
    }));

    res.json({
      items: itemsWithPermissions,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
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
          coverImage: "$book.coverImage",
          category: "$book.category",
          description: "$book.description",
        },
      },
    ]);

    res.json({ items: mostIssued });
  } catch (error) {
    next(error);
  }
};

const https = require("https");

const httpsGet = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "LMS-App/1.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse JSON response"));
          }
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}`));
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
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

    try {
      const data = await httpsGet(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`
      );
      const docs = data?.docs || [];
      // Find the first document that actually has author details
      const docWithAuthor = docs.find(d => d.author_name && d.author_name.length > 0);
      const author = docWithAuthor?.author_name?.[0] || null;
      return res.json({ author, source: "openlibrary" });
    } catch (fetchError) {
      console.error("⚠️ OpenLibrary fetch failed:", fetchError.message);
      return res.json({ author: null, source: "openlibrary", error: fetchError.message });
    }
  } catch (error) {
    next(error);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const { category, bookId } = req.query;
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

    // 1. Trending Books: Overall most borrowed books (borrowCount), prioritize available > 0
    const trending = await Book.find(query)
      .sort({ available: -1, borrowCount: -1, createdAt: -1 })
      .limit(6);

    let similar = [];
    let popularInCategory = [];

    if (category) {
      const normalizedCat = normalizeCategory(category);
      
      const catQuery = { ...query, category: normalizedCat };
      const mongoose = require("mongoose");
      if (bookId && mongoose.Types.ObjectId.isValid(bookId)) {
        catQuery._id = { $ne: bookId };
      }

      // 2. Similar Books: Same category, prioritize available
      similar = await Book.find(catQuery)
        .sort({ available: -1, createdAt: -1 })
        .limit(6);

      // 3. Popular in this category: Same category, sorted by borrowCount, prioritize available
      popularInCategory = await Book.find(catQuery)
        .sort({ available: -1, borrowCount: -1, createdAt: -1 })
        .limit(6);
    }

    res.json({
      trending,
      similar,
      popularInCategory
    });
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
  copyBookToWorkspace,
  suggestBooks,
  listCategories,
  listMostIssued,
  lookupAuthor,
  getRecommendations,
};