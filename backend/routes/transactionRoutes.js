const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const validate = require("../middleware/validate");
const {
  requestBorrow,
  approveRequest,
  rejectRequest,
  issueBook,
  returnBook,
  listTransactions,
} = require("../controllers/transactionController");

const auditMiddleware = require("../middleware/auditMiddleware");

const router = express.Router();

// List all transactions
router.get("/", auth, listTransactions);

// Student requests to borrow a book (via ChatWidget)
router.post(
  "/request",
  auth,
  auditMiddleware("TRANSACTION"),
  [body("bookId").notEmpty().withMessage("bookId is required")],
  validate,
  requestBorrow
);

// Librarian / Admin approves a pending borrow request
router.post("/approve/:id", auth, role("librarian"), auditMiddleware("TRANSACTION"), approveRequest);

// Librarian / Admin issues a book directly
router.post(
  "/issue",
  auth,
  role("admin", "librarian"),
  auditMiddleware("TRANSACTION"),
  [
    body("userId").notEmpty().withMessage("userId is required"),
    body("bookId").notEmpty().withMessage("bookId is required"),
    body("dueDays")
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage("dueDays must be between 1 and 365"),
  ],
  validate,
  issueBook
);

// Librarian / Admin marks a book as returned
router.post("/return/:id", auth, role("admin", "librarian"), auditMiddleware("TRANSACTION"), returnBook);

// Librarian / Admin rejects a pending borrow request
router.delete("/:id", auth, role("librarian"), auditMiddleware("TRANSACTION"), rejectRequest);

module.exports = router;
