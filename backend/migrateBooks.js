const mongoose = require("mongoose");
const Book = require("./models/Book");
require("dotenv").config();

const migrateBooks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Update all existing books that don't have the new fields
    const result = await Book.updateMany(
      { 
        $or: [
          { isGlobal: { $exists: false } },
          { createdBy: { $exists: false } }
        ]
      },
      {
        $set: {
          isGlobal: true,           // Existing books become admin/global books
          createdBy: null,          // Will need to assign manually or set to admin ID
          workspaceId: null,
          sourceBookId: null
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} books`);

    // Optional: Assign createdBy to a specific admin user
    const User = require("./models/User");
    const admin = await User.findOne({ role: "admin" });
    
    if (admin) {
      const adminUpdate = await Book.updateMany(
        { createdBy: null },
        { $set: { createdBy: admin._id } }
      );
      console.log(`Assigned ${adminUpdate.modifiedCount} books to admin: ${admin.email}`);
    } else {
      console.log("No admin found. Please manually assign createdBy field");
    }

    console.log("Migration completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

migrateBooks();