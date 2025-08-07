const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://dinhkhafpt:dinhkhahikari@cluster0.1azthmo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose;
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'CappieBot',
    });
    console.log('[MONGO] Đã kết nối MongoDB!');
    return mongoose;
  } catch (err) {
    console.error('[MONGO] Lỗi kết nối MongoDB:', err);
    throw err;
  }
}

module.exports = { mongoose, connectMongo };