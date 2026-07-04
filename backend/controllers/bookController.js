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
    const coverImage = req.file ? req.file.path : "";
    const user = req.user;

    // Determine if book is global (admin) or workspace-specific (librarian)
    let isGlobal = user.role === "admin";
    let workspaceId = user.role === "librarian" ? user._id : null;

    if (user.role === "admin" && req.body.workspaceId) {
      workspaceId = req.body.workspaceId;
      isGlobal = false;
    }

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

    // Check if category is newly created (not used by any other book yet)
    const otherBook = await Book.findOne({ category: book.category, _id: { $ne: book._id } });
    if (!otherBook) {
      const { logActivity } = require("../services/loggerService");
      await logActivity({
        req,
        activityType: "CATEGORY",
        action: "Category Created",
        performedBy: user._id,
        userRole: user.role,
        metadata: { category: book.category }
      });
    }

    res.locals.audit = {
      action: "Book Added",
      targetBook: book._id,
      targetBookTitle: book.title,
      metadata: { quantity: book.quantity, category: book.category }
    };

    // Notify librarian when admin directly assigns the book to their workspace
    if (user.role === "admin" && workspaceId) {
      const Notification = require("../models/Notification");
      await Notification.create({
        recipientId: workspaceId,
        type: "BOOK_ASSIGNED",
        title: "New Book Added to Your Catalog",
        message: `Admin has added "${book.title}" by ${book.author} directly to your workspace catalog.`,
        bookId: book._id,
      });
    }

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
      if (req.query.globalOnly === "true") {
        query = { isGlobal: true };
      } else {
        query = {};
      }
    }
    else if (user.role === "librarian") {
      if (req.query.workspaceOnly === "true") {
        query = { workspaceId: user._id };
      } else if (req.query.globalOnly === "true") {
        query = { isGlobal: true };
      } else {
        query = {
          $or: [
            { isGlobal: true },
            { workspaceId: user._id }
          ]
        };
      }
    }
    else {
      // Students only see books that librarians have added to their workspace catalogs
      // (isGlobal:false means it belongs to a librarian workspace, not the admin-only master catalog)
      query = { isGlobal: false, workspaceId: { $ne: null } };
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
        finalQuery = { $and: [{ $or: finalQuery.$or }, regexSearchQuery] };
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

    // Use searchRankingService to rank results if keywordSearch is provided
    const { rankSearchResults } = require("../services/searchRankingService");
    if (keywordSearch) {
      items = rankSearchResults(items, keywordSearch);

      // Log ISBN Search if applicable
      const looksLikeISBN = (str) => /^[\d-]+$/.test(str.trim()) && str.replace(/-/g, "").length >= 1;
      const isIsbn = looksLikeISBN(keywordSearch);
      if (isIsbn) {
        const { logActivity } = require("../services/loggerService");
        await logActivity({
          req,
          activityType: "CHATBOT",
          action: "ISBN Search",
          status: "success",
          performedBy: user._id,
          userRole: user.role,
          metadata: { isbn: keywordSearch }
        });
      }

      // Save search history
      const SearchHistory = require("../models/SearchHistory");
      let searchType = "title";
      if (isIsbn) searchType = "isbn";
      else if (authorFilter) searchType = "author";
      else if (categoryFilter) searchType = "category";

      await SearchHistory.create({
        userId: user._id,
        query: keywordSearch,
        searchType,
        resultsCount: items.length
      }).catch(err => console.error("SearchHistory create err:", err));
    } else {
      // standard sort
      items.sort((a, b) => {
        const aAvail = a.available > 0 ? 1 : 0;
        const bAvail = b.available > 0 ? 1 : 0;
        if (aAvail !== bAvail) return bAvail - aAvail;
        if (sortCriteria === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortCriteria === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortCriteria === "popularity") return (b.borrowCount || 0) - (a.borrowCount || 0);
        if (sortCriteria === "rating") return (b.rating || 0) - (a.rating || 0);
        return (b.borrowCount || 0) - (a.borrowCount || 0);
      });
    }

    const total = items.length;
    const paginatedItems = items.slice(skip, skip + limit);

    let copiedBookIds = [];
    let workspaceRequestsMap = {};
    if (user.role === "librarian") {
      copiedBookIds = await Book.find({
        workspaceId: user._id,
        sourceBookId: { $ne: null }
      }).distinct("sourceBookId");

      const WorkspaceRequest = require("../models/WorkspaceRequest");
      const librarianRequests = await WorkspaceRequest.find({ librarianId: user._id });
      librarianRequests.forEach(r => {
        workspaceRequestsMap[r.bookId.toString()] = r.status;
      });
    }

    const itemsWithPermissions = paginatedItems.map(book => {
      const bookObj = book.toObject();
      return {
        ...bookObj,
        isEditable: user.role === "admin" || (user.role === "librarian" && book.workspaceId?.toString() === user._id.toString()),
        isDeletable: user.role === "admin" || (user.role === "librarian" && book.workspaceId?.toString() === user._id.toString() && !book.isGlobal),
        isAlreadyCopied: user.role === "librarian" && book.isGlobal && copiedBookIds.map(id => id.toString()).includes(book._id.toString()),
        workspaceRequestStatus: user.role === "librarian" && book.isGlobal ? (workspaceRequestsMap[book._id.toString()] || null) : null,
      };
    });

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

    // Check if user has access to this book:
    // - Admins can see everything
    // - Librarians can see global books + their own workspace books
    // - Students can see librarian workspace books (isGlobal:false + workspaceId set)
    //   but NOT books that are admin-only global books with no workspace assignment
    const isAdminBook = book.isGlobal === true;
    const isLibrarianWorkspaceBook = book.isGlobal === false && book.workspaceId != null;
    const isOwnWorkspace = user.role === "librarian" && book.workspaceId?.toString() === user._id.toString();

    if (user.role === "admin") {
      // Admin sees everything — no restriction
    } else if (user.role === "librarian") {
      // Librarian sees global books OR their own workspace books
      if (!isAdminBook && !isOwnWorkspace) {
        return res.status(403).json({ message: "You don't have access to this book" });
      }
    } else {
      // Students see only librarian workspace books (not admin-only global catalog)
      if (!isLibrarianWorkspaceBook) {
        return res.status(403).json({ message: "You don't have access to this book" });
      }
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

    const oldTitle = book.title;
    const oldAuthor = book.author;
    const oldCategory = book.category;
    const oldIsbn = book.isbn;
    const oldQuantity = book.quantity;

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
      book.coverImage = req.file.path;
    }

    let newWorkspaceId = null;
    if (user.role === "admin" && typeof req.body.workspaceId !== "undefined") {
      if (req.body.workspaceId === "" || req.body.workspaceId === null || req.body.workspaceId === "null") {
        book.workspaceId = null;
        book.isGlobal = true;
      } else {
        newWorkspaceId = req.body.workspaceId;
        book.workspaceId = newWorkspaceId;
        book.isGlobal = false;
      }
    }

    await book.save();

    const changes = {};
    if (title && oldTitle !== title) changes.title = { old: oldTitle, new: title };
    if (author && oldAuthor !== author) changes.author = { old: oldAuthor, new: author };
    if (category && oldCategory !== category) changes.category = { old: oldCategory, new: category };
    if (isbn && oldIsbn !== isbn) changes.isbn = { old: oldIsbn, new: isbn };
    if (typeof quantity !== "undefined" && oldQuantity !== Number(quantity)) {
      changes.quantity = { old: oldQuantity, new: Number(quantity) };
    }

    res.locals.audit = {
      action: "Book Updated",
      targetBook: book._id,
      targetBookTitle: book.title,
      metadata: { changes }
    };

    // Category updated check
    if (category && oldCategory !== category) {
      const { logActivity } = require("../services/loggerService");
      await logActivity({
        req,
        activityType: "CATEGORY",
        action: "Category Updated",
        metadata: { oldCategory, newCategory: category }
      });
    }

    // Notify librarian when admin assigns this book to their workspace
    if (user.role === "admin" && newWorkspaceId) {
      const Notification = require("../models/Notification");
      await Notification.create({
        recipientId: newWorkspaceId,
        type: "BOOK_ASSIGNED",
        title: "New Book Added to Your Catalog",
        message: `Admin has added "${book.title}" by ${book.author} to your workspace catalog.`,
        bookId: book._id,
      });
    }

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
      res.locals.audit = {
        action: "Book Deleted",
        targetBook: book._id,
        targetBookTitle: book.title,
        metadata: { category: book.category }
      };

      const categoryName = book.category;
      await book.deleteOne();

      const remainingBook = await Book.findOne({ category: categoryName });
      if (!remainingBook) {
        const { logActivity } = require("../services/loggerService");
        await logActivity({
          req,
          activityType: "CATEGORY",
          action: "Category Deleted",
          metadata: { category: categoryName }
        });
      }

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

      res.locals.audit = {
        action: "Book Deleted",
        targetBook: book._id,
        targetBookTitle: book.title,
        metadata: { category: book.category }
      };

      const categoryName = book.category;
      await book.deleteOne();

      const remainingBook = await Book.findOne({ category: categoryName });
      if (!remainingBook) {
        const { logActivity } = require("../services/loggerService");
        await logActivity({
          req,
          activityType: "CATEGORY",
          action: "Category Deleted",
          metadata: { category: categoryName }
        });
      }

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
      return res.status(400).json({ message: "Already added this book to your workspace" });
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

    res.locals.audit = {
      action: "Book Copied to Workspace",
      targetBook: librarianCopy._id,
      targetBookTitle: librarianCopy.title,
      metadata: { sourceBookId: adminBook._id }
    };

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
      // Students only see librarian workspace books
      query = { isGlobal: false, workspaceId: { $ne: null } };
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
      // Students only see librarian workspace books
      query = { isGlobal: false, workspaceId: { $ne: null } };
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

const generateDummyISBN = () => {
  let isbn = "978";
  for (let i = 0; i < 9; i++) {
    isbn += Math.floor(Math.random() * 10);
  }
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return isbn + checkDigit;
};

const generateAIDescription = (title, author) => {
  const t = title.toLowerCase();
  const authorText = author ? ` by ${author}` : "";

  if (t.includes("habit") || t.includes("success") || t.includes("power") || t.includes("think") || t.includes("mind") || t.includes("rich") || t.includes("lead") || t.includes("goal") || t.includes("life") || t.includes("self") || t.includes("personal")) {
    return `"${title}"${authorText} is a transformative guide focused on personal growth, human psychology, and achieving true success. It offers actionable advice, scientific insights, and deep perspectives to help readers break negative patterns, build positive habits, and unlock their potential.`;
  }
  if (t.includes("history") || t.includes("war") || t.includes("world") || t.includes("ancient") || t.includes("revolution") || t.includes("empire") || t.includes("century") || t.includes("roman") || t.includes("nation")) {
    return `Exploring pivotal events and historical movements, "${title}"${authorText} delivers a comprehensive, thoroughly researched account of past achievements and challenges. It connects historical contexts to modern dynamics, making it an essential read for history enthusiasts.`;
  }
  if (t.includes("science") || t.includes("code") || t.includes("program") || t.includes("design") || t.includes("computer") || t.includes("data") || t.includes("physics") || t.includes("math") || t.includes("techno") || t.includes("system") || t.includes("network")) {
    return `"${title}"${authorText} is a foundational resource exploring technical systems, structured logic, and modern problem-solving methodologies. Ideal for students, developers, and professionals, it clarifies complex ideas with practical applications and clear explanations.`;
  }
  if (t.includes("love") || t.includes("secret") || t.includes("mystery") || t.includes("shadow") || t.includes("death") || t.includes("dark") || t.includes("night") || t.includes("girl") || t.includes("man") || t.includes("silent") || t.includes("wind") || t.includes("song")) {
    return `A captivating story of mystery and intrigue, "${title}"${authorText} weaves a complex narrative filled with vivid character development, sudden turns, and atmospheric tension. Readers will find themselves hooked from the very first page.`;
  }

  // General default fallback
  return `"${title}"${authorText} is a compelling work that offers a memorable reading experience. Combining structured insights with engaging execution, it serves as a valuable addition to the collection of both casual readers and subject enthusiasts.`;
};

const autoGenerateBookDetails = async (req, res, next) => {
  try {
    const title = String(req.query.title || "").trim();
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const result = {
      author: "",
      isbn: "",
      description: "",
    };

    // 1. Check local DB first for author
    try {
      const localBook = await Book.findOne({
        title: new RegExp(`^${escapeRegex(title)}$`, "i"),
      }).select("author");
      if (localBook?.author) {
        result.author = localBook.author;
      }
    } catch (err) {
      console.error("Local DB lookup failed:", err.message);
    }

    // 2. Fetch from OpenLibrary
    try {
      const searchData = await httpsGet(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=3`
      );
      const docs = searchData?.docs || [];
      const bestDoc = docs.find((d) => d.author_name && d.author_name.length > 0) || docs[0];

      if (bestDoc) {
        if (!result.author && bestDoc.author_name?.length > 0) {
          result.author = bestDoc.author_name.join(", ");
        }

        if (bestDoc.isbn?.length > 0) {
          result.isbn = bestDoc.isbn[0];
        }

        if (bestDoc.key) {
          try {
            const workData = await httpsGet(`https://openlibrary.org${bestDoc.key}.json`);
            const descObj = workData?.description;
            if (descObj) {
              const rawDesc = typeof descObj === "string" ? descObj : descObj.value || "";
              if (rawDesc) {
                result.description = rawDesc
                  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
                  .replace(/<[^>]*>/g, "")
                  .trim();
              }
            }
          } catch (descError) {
            console.error("OpenLibrary work description fetch failed:", descError.message);
          }
        }
      }
    } catch (fetchError) {
      console.error("OpenLibrary lookup failed:", fetchError.message);
    }

    // Fallbacks
    if (!result.isbn) {
      result.isbn = generateDummyISBN();
    }
    if (!result.description) {
      result.description = generateAIDescription(title, result.author);
    }

    return res.json(result);
  } catch (error) {
    next(error);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const { category, bookId } = req.query;
    const user = req.user;

    const RecommendationContext = require("../services/recommendationContext");
    const DatabaseRecommendationStrategy = require("../services/databaseRecommendationStrategy");

    const strategy = new DatabaseRecommendationStrategy();
    const context = new RecommendationContext(strategy);

    const recommendations = await context.execute({ user, category, bookId });

    // Log recommendation generation
    const { logActivity } = require("../services/loggerService");
    await logActivity({
      req,
      activityType: "CHATBOT",
      action: "Recommendation Generated",
      status: "success",
      performedBy: user._id,
      userRole: user.role,
      metadata: { category, bookId }
    });

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

// Request admin to copy a book to librarian workspace
const requestWorkspace = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    const user = req.user;

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (!book.isGlobal) {
      return res.status(400).json({ message: "This book is not from the admin catalog" });
    }

    const WorkspaceRequest = require("../models/WorkspaceRequest");

    // Check if librarian already has a copy
    const existingCopy = await Book.findOne({
      sourceBookId: book._id,
      workspaceId: user._id
    });
    if (existingCopy) {
      return res.status(400).json({ message: "Already added this book to your workspace" });
    }

    // Check if there is an active pending or approved request
    const existingRequest = await WorkspaceRequest.findOne({
      librarianId: user._id,
      bookId: book._id,
      status: { $in: ["pending", "approved"] }
    });
    if (existingRequest) {
      return res.status(400).json({ message: `Request is already ${existingRequest.status}` });
    }

    // Create a new request
    const newRequest = await WorkspaceRequest.create({
      librarianId: user._id,
      bookId: book._id,
      status: "pending"
    });

    // Log activity
    const { logActivity } = require("../services/loggerService");
    await logActivity({
      req,
      activityType: "BOOK",
      action: "Workspace Copy Requested",
      status: "success",
      performedBy: user._id,
      userRole: user.role,
      targetBook: book._id,
      targetBookTitle: book.title,
      metadata: { requestId: newRequest._id }
    });

    res.status(201).json({ request: newRequest, message: "Add to workspace request submitted to Admin" });
  } catch (error) {
    next(error);
  }
};

// Admin lists pending/all workspace requests
const listWorkspaceRequests = async (req, res, next) => {
  try {
    const WorkspaceRequest = require("../models/WorkspaceRequest");
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const [items, total] = await Promise.all([
      WorkspaceRequest.find(query)
        .populate("librarianId", "name email role")
        .populate("bookId", "title author isbn coverImage available quantity category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WorkspaceRequest.countDocuments(query)
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// Admin approves workspace request
const approveWorkspaceRequest = async (req, res, next) => {
  try {
    const WorkspaceRequest = require("../models/WorkspaceRequest");
    const request = await WorkspaceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    const adminBook = await Book.findById(request.bookId);
    if (!adminBook) {
      return res.status(404).json({ message: "Admin book not found" });
    }

    // Check if librarian already has a copy
    const existingCopy = await Book.findOne({
      sourceBookId: adminBook._id,
      workspaceId: request.librarianId
    });

    if (existingCopy) {
      request.status = "approved";
      await request.save();
      return res.json({ message: "Book was already in workspace. Request marked as approved." });
    }

    // Create copy in librarian workspace
    const librarianCopy = new Book({
      title: adminBook.title,
      author: adminBook.author,
      category: adminBook.category,
      isbn: adminBook.isbn,
      quantity: adminBook.quantity,
      available: adminBook.available,
      description: adminBook.description,
      coverImage: adminBook.coverImage,
      createdBy: adminBook.createdBy,
      workspaceId: request.librarianId,
      isGlobal: false,
      sourceBookId: adminBook._id
    });
    await librarianCopy.save();

    request.status = "approved";
    await request.save();

    const { logActivity } = require("../services/loggerService");
    await logActivity({
      req,
      activityType: "BOOK",
      action: "Workspace Copy Approved",
      status: "success",
      performedBy: req.user._id,
      userRole: req.user.role,
      targetBook: adminBook._id,
      targetBookTitle: adminBook.title,
      targetUser: request.librarianId,
      metadata: { requestId: request._id, newBookId: librarianCopy._id }
    });

    // Notify librarian that their request was approved
    const Notification = require("../models/Notification");
    await Notification.create({
      recipientId: request.librarianId,
      type: "WORKSPACE_REQUEST_APPROVED",
      title: "Workspace Request Approved ✅",
      message: `Your request to add "${adminBook.title}" by ${adminBook.author} has been approved and is now in your catalog.`,
      bookId: librarianCopy._id,
    });

    res.json({ message: "Request approved and book successfully added to Librarian's workspace!" });
  } catch (error) {
    next(error);
  }
};

// Admin rejects workspace request
const rejectWorkspaceRequest = async (req, res, next) => {
  try {
    const WorkspaceRequest = require("../models/WorkspaceRequest");
    const request = await WorkspaceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    request.status = "rejected";
    await request.save();

    const adminBook = await Book.findById(request.bookId);

    const { logActivity } = require("../services/loggerService");
    await logActivity({
      req,
      activityType: "BOOK",
      action: "Workspace Copy Rejected",
      status: "success",
      performedBy: req.user._id,
      userRole: req.user.role,
      targetBook: adminBook ? adminBook._id : null,
      targetBookTitle: adminBook ? adminBook.title : "",
      targetUser: request.librarianId,
      metadata: { requestId: request._id }
    });

    res.json({ message: "Request rejected successfully." });
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
  autoGenerateBookDetails,
  getRecommendations,
  requestWorkspace,
  listWorkspaceRequests,
  approveWorkspaceRequest,
  rejectWorkspaceRequest,
};