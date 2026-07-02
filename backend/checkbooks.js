require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const globalBooks = await Book.find({ isGlobal: true }).select('title _id').lean();
  const wsBooks = await Book.find({ isGlobal: false }).where('workspaceId').ne(null).select('title _id workspaceId').lean();
  console.log('Global (admin) books:', globalBooks.length);
  globalBooks.forEach(b => console.log(' -', b._id.toString(), b.title));
  console.log('Workspace books:', wsBooks.length);
  wsBooks.forEach(b => console.log(' -', b._id.toString(), b.title, '| ws:', b.workspaceId.toString()));
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
