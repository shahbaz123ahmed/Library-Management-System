const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const upload = require("../middleware/upload");
const validate = require("../middleware/validate");
const {
  createBook,
  listBooks,
  getBook,
  updateBook,
  deleteBook,
  copyBookToWorkspace,  // 👈 ADD THIS
  suggestBooks,
  listCategories,
  listMostIssued,
  lookupAuthor,
  autoGenerateBookDetails,
  getRecommendations,
} = require("../controllers/bookController");

const auditMiddleware = require("../middleware/auditMiddleware");

const router = express.Router();

router.get("/", auth, listBooks);
router.get("/suggest", auth, suggestBooks);
router.get("/categories", auth, listCategories);
router.get("/most-issued", auth, listMostIssued);
router.get("/lookup-author", auth, lookupAuthor);
router.get("/auto-generate", auth, autoGenerateBookDetails);
router.get("/recommendations", auth, getRecommendations);
router.get("/:id", auth, getBook);

// 👇 ADD THIS NEW ROUTE - Copy admin book to librarian workspace
router.post("/:id/copy-to-workspace", auth, role("librarian"), auditMiddleware("BOOK"), copyBookToWorkspace);

router.post(
  "/",
  auth,
  role("admin", "librarian"),
  auditMiddleware("BOOK"),
  upload.single("cover"),
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("author").notEmpty().withMessage("Author is required"),
    body("category").notEmpty().withMessage("Category is required"),
    body("isbn").notEmpty().withMessage("ISBN is required"),
    body("quantity").isInt({ min: 0 }).withMessage("Quantity must be >= 0"),
  ],
  validate,
  createBook
);

router.put(
  "/:id",
  auth,
  role("admin", "librarian"),
  auditMiddleware("BOOK"),
  upload.single("cover"),
  [body("quantity").optional().isInt({ min: 0 }).withMessage("Quantity must be >= 0")],
  validate,
  updateBook
);

router.delete("/:id", auth, role("admin", "librarian"), auditMiddleware("BOOK"), deleteBook);

module.exports = router;