const mongoose = require("mongoose");

//a global cache to store the connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDB() {
    
    if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, //  Stops users.findOne() from hanging/buffering when DB isn't ready
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if Atlas is unreachable
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongooseInstance) => {
      console.log("Connected to MongoDB");
      return mongooseInstance;
    });
  }
    try {
       cached.conn = await cached.promise;
  } 
  catch (error) {
    cached.promise = null; // Clear the cached promise so next request can retry
    console.log("Error in connection");
    console.error(error);
    throw error;
  }

  return cached.conn;
}


module.exports = connectToDB;