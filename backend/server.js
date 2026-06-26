const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

// ✅ FIX: .env file ko exact path do
dotenv.config({ path: path.join(__dirname, ".env") });

const connectDb = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// ✅ DEBUG: Check karein URI load ho rahi hai
console.log("🔍 MONGO_URI:", process.env.MONGO_URI);

const app = express();

// DB connect
connectDb();

// CORS
const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Normalize and check whitelisted domains
    const isAllowed = allowedOrigins.some((allowed) => {
      const a = allowed.replace(/\/$/, "");
      const o = origin.replace(/\/$/, "");
      return a === o;
    });

    // Automatically allow Vercel subdomains (preview & production deployments)
    const isVercel = origin.endsWith(".vercel.app");

    if (isAllowed || isVercel) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Middlewares
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/books", require("./routes/bookRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));

// Test route
app.get("/", (req, res) => {
  res.json({ status: "ok", name: "library-api" });
});

// Error handler
app.use(errorHandler);

// Server start
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`API running on port ${port}`);
});