// Sorenson-Dice string similarity algorithm for typo-tolerant fuzzy matching
function getStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = String(str1).toLowerCase().replace(/[^a-z0-9]/g, "");
  const s2 = String(str2).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };
  
  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  if (b1.size === 0 || b2.size === 0) return 0;
  
  let intersection = 0;
  for (const val of b1) {
    if (b2.has(val)) intersection++;
  }
  
  return (2.0 * intersection) / (b1.size + b2.size);
}

// Maps inconsistent/misspelled category names to standardized category list
function normalizeCategory(categoryName) {
  if (!categoryName) return "Uncategorized";
  const name = categoryName.trim().toLowerCase();
  
  const mapping = {
    "phsycology": "Psychology",
    "psycology": "Psychology",
    "psycolgy": "Psychology",
    "psychology": "Psychology",
    
    "software": "Software",
    "programming": "Software",
    "coding": "Software",
    "dev": "Software",
    
    "self help": "Self Help",
    "self-help": "Self Help",
    "motivation": "Self Help",
    
    "fiction": "Fiction",
    "novel": "Fiction",
    
    "non-fiction": "Non-Fiction",
    "nonfiction": "Non-Fiction",
    
    "science": "Science",
    "technology": "Technology",
    "tech": "Technology",
    "philosophy": "Philosophy",
    "history": "History",
    "biography": "Biography",
  };
  
  if (mapping[name]) {
    return mapping[name];
  }
  
  // Title case fallback
  return categoryName.trim().charAt(0).toUpperCase() + categoryName.trim().slice(1);
}

module.exports = {
  getStringSimilarity,
  normalizeCategory,
};
