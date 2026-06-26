const { normalizeCategory } = require("./similarity");

function parseNaturalQuery(queryStr) {
  if (!queryStr || typeof queryStr !== "string") {
    return { search: "", filters: {}, sort: null };
  }

  let text = queryStr.trim();
  const filters = {};
  let sort = null;

  // 1. Parse Availability Filter
  // Match "available", "in stock", "ready to borrow", etc.
  const availabilityRegex = /\b(available|in[ -]stock|ready[ -]to[ -]borrow)\b/i;
  if (availabilityRegex.test(text)) {
    filters.availability = "available";
    text = text.replace(availabilityRegex, "");
  }

  // 2. Parse Sort Criteria
  // Match newest / oldest
  const newestRegex = /\b(newest|latest|recent|new[ -]arrivals|new)\b/i;
  const oldestRegex = /\b(oldest|ancient|first)\b/i;
  const popularRegex = /\b(popular|trending|most[ -]issued|famous|hot|most[ -]borrowed)\b/i;
  const ratingRegex = /\b(top[ -]rated|highest[ -]rated|best[ -]rated|rating)\b/i;

  if (newestRegex.test(text)) {
    sort = "newest";
    text = text.replace(newestRegex, "");
  } else if (oldestRegex.test(text)) {
    sort = "oldest";
    text = text.replace(oldestRegex, "");
  } else if (popularRegex.test(text)) {
    sort = "popularity";
    text = text.replace(popularRegex, "");
  } else if (ratingRegex.test(text)) {
    sort = "rating";
    text = text.replace(ratingRegex, "");
  }

  // 3. Parse Category Filter
  // Known list of categories
  const categoriesList = [
    "Software", "Self Help", "Psychology", "Fiction", "Non-Fiction", 
    "Science", "History", "Biography", "Technology", "Philosophy"
  ];
  
  // Look for "[Category] books" or "books on [Category]" or "books in [Category]"
  for (const cat of categoriesList) {
    const catRegex = new RegExp(`\\b(books[ -](in|on|about)[ -])?${cat}\\b`, "i");
    if (catRegex.test(text)) {
      filters.category = cat;
      text = text.replace(catRegex, "");
      break;
    }
  }

  // 4. Parse Author Filter
  // Match "books by [author name]" or "by [author name]"
  const authorRegex = /\b(books[ -])?by\s+([a-z0-9\s.]+)/i;
  const authorMatch = text.match(authorRegex);
  if (authorMatch) {
    filters.author = authorMatch[2].trim();
    text = text.replace(authorRegex, "");
  }

  // Clean up remaining query text
  // Remove multiple spaces, trailing "books", punctuation
  let cleanedSearch = text
    .replace(/\bbooks?\b/gi, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    search: cleanedSearch,
    filters,
    sort
  };
}

module.exports = {
  parseNaturalQuery
};
