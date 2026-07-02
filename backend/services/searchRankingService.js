/**
 * Sorts books in-place based on the requested search ranking priority:
 * 1. Exact Title Match
 * 2. Starts With Title
 * 3. Author Match
 * 4. ISBN Match
 * 5. Category Match
 * 6. Contains Title
 * 7. Popularity (borrowCount)
 * 8. Availability (available)
 * 9. Borrow Count
 * 10. Recently Added (createdAt)
 */
const rankSearchResults = (books, query) => {
  if (!query) return books;
  const q = String(query).trim().toLowerCase();

  return books.sort((a, b) => {
    const aTitle = (a.title || "").toLowerCase();
    const bTitle = (b.title || "").toLowerCase();
    const aAuthor = (a.author || "").toLowerCase();
    const bAuthor = (b.author || "").toLowerCase();
    const aIsbn = (a.isbn || "").toLowerCase();
    const bIsbn = (b.isbn || "").toLowerCase();
    const aCat = (a.category || "").toLowerCase();
    const bCat = (b.category || "").toLowerCase();

    // 1. Exact Title Match
    const aExact = aTitle === q ? 1 : 0;
    const bExact = bTitle === q ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;

    // 2. Starts With Title
    const aStarts = aTitle.startsWith(q) ? 1 : 0;
    const bStarts = bTitle.startsWith(q) ? 1 : 0;
    if (aStarts !== bStarts) return bStarts - aStarts;

    // 3. Author Match
    const aAuthMatch = aAuthor.includes(q) ? 1 : 0;
    const bAuthMatch = bAuthor.includes(q) ? 1 : 0;
    if (aAuthMatch !== bAuthMatch) return bAuthMatch - aAuthMatch;

    // 4. ISBN Match
    const aIsbnMatch = aIsbn === q ? 1 : 0;
    const bIsbnMatch = bIsbn === q ? 1 : 0;
    if (aIsbnMatch !== bIsbnMatch) return bIsbnMatch - aIsbnMatch;

    // 5. Category Match
    const aCatMatch = aCat === q ? 1 : 0;
    const bCatMatch = bCat === q ? 1 : 0;
    if (aCatMatch !== bCatMatch) return bCatMatch - aCatMatch;

    // 6. Contains Title
    const aContains = aTitle.includes(q) ? 1 : 0;
    const bContains = bTitle.includes(q) ? 1 : 0;
    if (aContains !== bContains) return bContains - aContains;

    // 7. Popularity (borrowCount)
    const aPopularity = a.borrowCount || 0;
    const bPopularity = b.borrowCount || 0;
    if (aPopularity !== bPopularity) return bPopularity - aPopularity;

    // 8. Availability
    const aAvail = a.available || 0;
    const bAvail = b.available || 0;
    if (aAvail !== bAvail) return bAvail - aAvail;

    // 9. Recently Added (createdAt)
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
};

module.exports = { rankSearchResults };
