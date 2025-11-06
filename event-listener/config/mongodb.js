const mongoose = require('mongoose');

class MongoDB {
  constructor(){
    this.isConnected = false;
  }

  async connect(){
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/event_deduplication';
    const options = { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 };
    await mongoose.connect(uri, options);

    mongoose.connection.on('connected', () => { console.log('MongoDB connected'); this.isConnected = true; });
    mongoose.connection.on('error', (err) => { console.error(' MongoDB error:', err.message); this.isConnected = false; });
    mongoose.connection.on('disconnected', () => { console.log('  MongoDB disconnected'); this.isConnected = false; });
  }

  async disconnect(){
    if (this.isConnected) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
      this.isConnected = false;
    }
  }
}

module.exports = new MongoDB();
