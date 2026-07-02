/**
 * Frontend helper to match book details and resolve recommendation explanation badges
 */

export function getRecommendationBadge(book, context = {}) {
  if (book.recBadge) return book.recBadge;

  const historyAuthors = context.historyAuthors || [];
  const historyCategories = context.historyCategories || [];

  if (historyAuthors.includes(book.author)) {
    return "Same Author";
  }
  if (historyCategories.includes(book.category)) {
    return "Based on Your Borrow History";
  }
  if (book.borrowCount && book.borrowCount >= 4) {
    return "Frequently Borrowed";
  }
  if (book.rating && book.rating >= 4.7) {
    return "Highly Rated";
  }
  if (book.category) {
    return `Popular in ${book.category}`;
  }
  return "Trending This Month";
}
