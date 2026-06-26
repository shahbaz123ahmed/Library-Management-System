const mongoose = require('mongoose');

const URI = 'mongodb+srv://shahbaz126ahmed:lms1234@lms.uyxgxad.mongodb.net/?retryWrites=true&w=majority&appName=LMS';

console.log('🔍 Testing MongoDB Connection...');
console.log('📝 Username: shahbaz126ahmed');
console.log('🔑 Password: lms1234');
console.log('========================================');

mongoose.connect(URI)
    .then(() => {
        console.log('✅ CONNECTED SUCCESSFULLY! 🎉');
        console.log('Database connected!');
        process.exit(0);
    })
    .catch(err => {
        console.log('❌ CONNECTION FAILED!');
        console.log('Error:', err.message);
        process.exit(1);
    });