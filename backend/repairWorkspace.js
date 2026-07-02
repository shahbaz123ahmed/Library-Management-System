require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('./models/Book');
const WorkspaceRequest = require('./models/WorkspaceRequest');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const approvedReqs = await WorkspaceRequest.find({ status: 'approved' });
  console.log('Found', approvedReqs.length, 'approved requests to repair');

  let created = 0;
  let skipped = 0;

  for (const req of approvedReqs) {
    const adminBook = await Book.findById(req.bookId);
    if (!adminBook) {
      console.log('Admin book not found for request', req._id);
      skipped++;
      continue;
    }

    // Check if copy already exists
    const existingCopy = await Book.findOne({
      sourceBookId: adminBook._id,
      workspaceId: req.librarianId
    });

    if (existingCopy) {
      console.log('Copy already exists for:', adminBook.title, '-> skipping');
      skipped++;
      continue;
    }

    // Create the workspace copy
    const copy = new Book({
      title: adminBook.title,
      author: adminBook.author,
      category: adminBook.category,
      isbn: adminBook.isbn,
      quantity: adminBook.quantity,
      available: adminBook.available,
      description: adminBook.description,
      coverImage: adminBook.coverImage,
      createdBy: adminBook.createdBy,
      workspaceId: req.librarianId,
      isGlobal: false,
      sourceBookId: adminBook._id
    });
    await copy.save();
    console.log('CREATED copy of:', adminBook.title, 'for librarian:', req.librarianId.toString());
    created++;
  }

  console.log('\nDone. Created:', created, ' Skipped:', skipped);

  // Verify
  const wsBooks = await Book.find({ isGlobal: false }).where('workspaceId').ne(null).select('title workspaceId').lean();
  console.log('\n=== WORKSPACE BOOKS NOW ===');
  wsBooks.forEach(b => console.log(' -', b.title, '| workspace:', b.workspaceId.toString()));

  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
