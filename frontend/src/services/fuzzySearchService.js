/**
 * Fuzzy search & typo correction utility using Levenshtein distance
 */

export function getLevenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Finds the closest matching phrase from a dictionary.
 */
export function findClosestCorrection(query, dictionary, threshold = 3) {
  if (!query || !dictionary || dictionary.length === 0) return null;
  const lowerQuery = query.toLowerCase().trim();
  
  let closest = null;
  let minDistance = Infinity;

  for (const item of dictionary) {
    const lowerItem = item.toLowerCase().trim();
    // Direct match
    if (lowerItem === lowerQuery) return item;

    // Check Levenshtein distance on words or whole string
    const dist = getLevenshteinDistance(lowerQuery, lowerItem);
    if (dist < minDistance && dist <= threshold) {
      minDistance = dist;
      closest = item;
    }
  }
  return closest;
}

// Pre-seeded fallback dictionary for typical search typos
export const TYPO_DICTIONARY = [
  "Harry Potter",
  "Stephen King",
  "Psychology",
  "Technology",
  "Science Fiction",
  "Fiction",
  "Biography",
  "Clean Code",
  "The Alchemist",
  "Database System Concepts"
];
