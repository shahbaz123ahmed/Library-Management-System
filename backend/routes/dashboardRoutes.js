const express = require("express");
const auth = require("../middleware/auth");
const { getStats, getAnalytics } = require("../controllers/dashboardController");

const router = express.Router();

// Important: Apply auth middleware to ALL dashboard routes
router.use(auth);

router.get("/stats", getStats);
router.get("/analytics", getAnalytics);

module.exports = router;
