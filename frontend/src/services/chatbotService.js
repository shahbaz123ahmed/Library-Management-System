import api from "@/lib/api";
import { findClosestCorrection, TYPO_DICTIONARY } from "./fuzzySearchService";
import { parseFollowUp } from "./conversationContextService";

/**
 * Coordinates chatbot business logic: context analysis, typo corrections,
 * recommendations, and backend query dispatching.
 */
export async function processChatMessage({
  message,
  context,
  chatLanguage,
  categories = [],
  user = null
}) {
  const isHi = chatLanguage === "hi";
  const cleanMsg = message.trim();

  // 1. Check for Contextual Follow-up
  const followUp = parseFollowUp(cleanMsg, context);
  if (followUp) {
    if (followUp.type === "FILTER_AVAILABLE") {
      const filtered = followUp.payload.filtered;
      return {
        success: true,
        text: isHi
          ? `✓ Sirf available kitaben filter ki gayi hain (${filtered.length} mili):`
          : `✓ Filtered only available books (${filtered.length} found):`,
        results: filtered,
        updatedContext: {
          ...context,
          lastResults: filtered
        }
      };
    }

    if (followUp.type === "RECOMMEND_ONE") {
      const book = followUp.payload.book;
      if (!book) {
        return {
          success: true,
          text: isHi
            ? "😅 Mere paas recommend karne ke liye koi book nahi hai."
            : "😅 I don't have any books from the previous search to recommend."
        };
      }
      return {
        success: true,
        text: isHi
          ? `💡 Main aapko **"${book.title}"** recommend karta hoon kyuki ye is list ki best book hai (${book.recBadge || 'Highly Recommended'})!`
          : `💡 I recommend **"${book.title}"** by ${book.author} (${book.recBadge || 'Highly Recommended'})!`,
        results: [book],
        updatedContext: context
      };
    }

    if (followUp.type === "AUTHOR_SEARCH") {
      const author = followUp.payload.author;
      const { data } = await api.get("/books", { params: { search: author, limit: 10 } });
      const books = data.items || [];
      return {
        success: true,
        text: isHi
          ? `✍️ **${author}** ki aur kitaben:`
          : `✍️ More books by **${author}**:`,
        results: books,
        updatedContext: {
          ...context,
          lastQuery: author,
          lastAuthor: author,
          lastResults: books,
          page: 1
        }
      };
    }
  }

  // 2. Typo Correction
  const dictionary = [...categories, ...TYPO_DICTIONARY];
  const words = cleanMsg.split(/\s+/);
  let correctedQuery = cleanMsg;
  let didCorrect = false;
  const correctedWords = [];

  for (const word of words) {
    // Skip short words or structural particles
    if (word.length <= 3) continue;
    const correction = findClosestCorrection(word, dictionary, 2);
    if (correction && correction.toLowerCase() !== word.toLowerCase()) {
      correctedQuery = correctedQuery.replace(new RegExp(word, "gi"), correction);
      didCorrect = true;
      correctedWords.push(correction);
    }
  }

  return {
    success: false, // Indicates standard flow should execute query search
    didCorrect,
    correctedQuery,
    correctedWords
  };
}
