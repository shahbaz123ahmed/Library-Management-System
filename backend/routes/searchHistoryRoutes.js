const express = require("express");
const auth = require("../middleware/auth");
const SearchHistory = require("../models/SearchHistory");

const router = express.Router();

// Store search history for logged-in users
router.post("/", auth, async (req, res, next) => {
  try {
    const { query, searchType, resultsCount, clickedBook } = req.body;
    const userId = req.user._id;
    
    if (!query) {
      return res.status(400).json({ message: "query is required" });
    }

    const history = await SearchHistory.create({
      userId,
      query,
      searchType: searchType || "title",
      resultsCount: resultsCount || 0,
      clickedBook: clickedBook || null
    });
    
    res.status(201).json(history);
  } catch (error) {
    next(error);
  }
});

// Retrieve search history for logged-in users
router.get("/", auth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const items = await SearchHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("clickedBook", "title author coverImage");
    
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
