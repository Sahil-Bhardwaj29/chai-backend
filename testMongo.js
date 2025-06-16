// testMongo.js
import mongoose from 'mongoose';

const uri = 'mongodb+srv://availablenot30:sahil123@cluster0.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(uri)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB connection failed:', err.message));



  