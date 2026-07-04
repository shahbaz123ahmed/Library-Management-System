const express = require("express");
const { body } = require("express-validator");
const { register, login, me } = require("../controllers/authController");
const { googleLogin, githubLogin } = require("../controllers/oauthController");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password min 6 chars"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.get("/me", auth, me);

router.post("/google", googleLogin);
router.post("/github", githubLogin);

module.exports = router;
