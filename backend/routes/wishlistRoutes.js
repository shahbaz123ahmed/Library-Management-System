const express = require("express");
const auth = require("../middleware/auth");
const { getWishlist, toggleWishlist } = require("../controllers/wishlistController");

const router = express.Router();

router.get("/", auth, getWishlist);
router.post("/:bookId", auth, toggleWishlist);

module.exports = router;
