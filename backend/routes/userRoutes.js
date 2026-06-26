const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const validate = require("../middleware/validate");
const { listUsers, createUser, updateUser, deleteUser } = require("../controllers/userController");

const router = express.Router();

router.get("/", auth, role("admin", "librarian"), listUsers);

router.post(
  "/",
  auth,
  role("admin"),
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
    body("role").isIn(["admin", "librarian", "student"]).withMessage("Invalid role"),
  ],
  validate,
  createUser
);

router.put(
  "/:id",
  auth,
  role("admin"),
  [
    body("email").optional().isEmail().withMessage("Valid email is required"),
    body("password").optional({ values: "falsy" }).isLength({ min: 6 }).withMessage("Password min 6 chars"),
    body("role").optional().isIn(["admin", "librarian", "student"]).withMessage("Invalid role"),
  ],
  validate,
  updateUser
);

router.delete("/:id", auth, role("admin"), deleteUser);

module.exports = router;
