const User = require("../models/User");

// GET /api/wishlist — get current user's wishlist with full book details
const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "wishlist",
      select: "title author isbn category available quantity coverImage description",
    });
    res.json({ wishlist: user.wishlist || [] });
  } catch (error) {
    next(error);
  }
};

// POST /api/wishlist/:bookId — toggle book in/out of wishlist
const toggleWishlist = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.wishlist.findIndex((id) => id.toString() === bookId);
    if (index === -1) {
      user.wishlist.push(bookId);
      await user.save();
      return res.json({ added: true, wishlist: user.wishlist });
    } else {
      user.wishlist.splice(index, 1);
      await user.save();
      return res.json({ added: false, wishlist: user.wishlist });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getWishlist, toggleWishlist };
