const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    isbn: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    available: { type: Number, required: true, min: 0 },
    coverImage: { type: String },
    description: { type: String },
    
    // WORKSPACE ISOLATION FIELDS
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },
    workspaceId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      default: null 
    },
    isGlobal: { 
      type: Boolean, 
      default: false 
    },
    sourceBookId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Book",
      default: null 
    },
    
    // NEW METADATA FIELDS FOR CHATBOT
    rating: {
      type: Number,
      default: 4.5
    },
    publishedYear: {
      type: Number,
      default: 2021
    },
    borrowCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Indexes for faster queries
bookSchema.index({ workspaceId: 1, isGlobal: 1 });
bookSchema.index({ createdBy: 1 });
bookSchema.index({ isGlobal: 1 });
// ISBN / search speed indexes
bookSchema.index({ isbn: 1 });
bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });

module.exports = mongoose.model("Book", bookSchema);