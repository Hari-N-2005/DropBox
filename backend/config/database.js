// Centralised MongoDB connection logic for the file-transfer app

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,              // prevent exhausting connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);

    // Retry after 5 s if the DB is temporarily unreachable
    setTimeout(connectDB, 5000);
  }
};

// Establish initial connection immediately
connectDB();

/* ---------- Connection-lifecycle helpers ---------- */
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB runtime error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected – attempting reconnection…');
  connectDB();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('📴 MongoDB connection closed (app termination)');
  process.exit(0);
});

/* Export the mongoose instance in case other modules
   want direct access to the connection pool. */
module.exports = mongoose;
