const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Book = require("../models/Book");

const seedData = async () => {
  await User.deleteMany({});
  await Book.deleteMany({});

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.local";
  const librarianEmail = process.env.SEED_LIBRARIAN_EMAIL || "librarian@example.local";
  const studentEmail = process.env.SEED_STUDENT_EMAIL || "student@example.local";
  const rawPassword = process.env.SEED_USER_PASSWORD || "ChangeMe123!";

  const password = await bcrypt.hash(rawPassword, 10);

  const users = await User.insertMany([
    { name: "Admin User", email: adminEmail, password, role: "admin" },
    { name: "Librarian User", email: librarianEmail, password, role: "librarian" },
    { name: "Student User", email: studentEmail, password, role: "student" },
  ]);

  const books = await Book.insertMany([
    {
      title: "Clean Code",
      author: "Robert C. Martin",
      category: "Software",
      isbn: "9780132350884",
      quantity: 5,
      available: 5,
      coverImage: "",
      description: "A handbook of agile software craftsmanship.",
      createdBy: users[0]._id
    },
    {
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt",
      category: "Software",
      isbn: "9780201616224",
      quantity: 3,
      available: 3,
      coverImage: "",
      description: "Your journey to mastery.",
      createdBy: users[0]._id
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      category: "Self Help",
      isbn: "9780735211292",
      quantity: 4,
      available: 4,
      coverImage: "",
      description: "An easy and proven way to build good habits.",
      createdBy: users[0]._id
    },
  ]);

  return { users, books };
};

module.exports = seedData;
