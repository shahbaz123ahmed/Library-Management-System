/**
 * Manages conversational context variables and follow-up query matching
 */

export const INITIAL_CONTEXT = {
  lastQuery: "",
  lastCategory: "",
  lastAuthor: "",
  lastResults: [],
  page: 1,
  hasMore: false
};

/**
 * Checks if a query is a follow-up request and returns appropriate instructions.
 */
export function parseFollowUp(query, context = INITIAL_CONTEXT) {
  const cleanQuery = query.toLowerCase().trim();

  // 1. "show more" or "next page"
  if (cleanQuery === "show more" || cleanQuery === "more" || cleanQuery === "next") {
    return {
      type: "SHOW_MORE",
      payload: { page: (context.page || 1) + 1 }
    };
  }

  // 2. "only available" or "available books"
  if (cleanQuery === "only available" || cleanQuery === "available" || cleanQuery === "in stock") {
    const filtered = (context.lastResults || []).filter((book) => book.available > 0);
    return {
      type: "FILTER_AVAILABLE",
      payload: { filtered }
    };
  }

  // 3. "recommend one" or "suggest one"
  if (cleanQuery === "recommend one" || cleanQuery === "suggest one" || cleanQuery === "pick one") {
    const list = context.lastResults || [];
    let recommendedBook = null;
    if (list.length > 0) {
      // Pick best rating or popularity
      recommendedBook = [...list].sort((a, b) => {
        const ratingDiff = (b.rating || 4.5) - (a.rating || 4.5);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.borrowCount || 0) - (a.borrowCount || 0);
      })[0];
    }
    return {
      type: "RECOMMEND_ONE",
      payload: { book: recommendedBook }
    };
  }

  // 4. "what else did he write" or "author books"
  if (
    (cleanQuery.includes("else") || cleanQuery.includes("more")) &&
    (cleanQuery.includes("he") || cleanQuery.includes("she") || cleanQuery.includes("author") || cleanQuery.includes("write")) &&
    context.lastAuthor
  ) {
    return {
      type: "AUTHOR_SEARCH",
      payload: { author: context.lastAuthor }
    };
  }

  return null;
}
