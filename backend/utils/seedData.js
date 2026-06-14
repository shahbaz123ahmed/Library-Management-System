const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Book = require("../models/Book");

const seedData = async () => {
  await User.deleteMany({});
  await Book.deleteMany({});

  const password = await bcrypt.hash("Password123!", 10);

  const users = await User.insertMany([
    { name: "Admin User", email: "admin@library.com", password, role: "admin" },
    { name: "Librarian User", email: "librarian@library.com", password, role: "librarian" },
    { name: "Student User", email: "student@library.com", password, role: "student" },
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
    },
  ]);

  return { users, books };
};

module.exports = seedData;
