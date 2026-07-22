const mongoose = require("mongoose");



async function connectToDB() {

    try {
        // console.log("Connecting to:", process.env.MONGO_URI); // debug line
        // console.log("URI:", process.env.MONGO_URI);

        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
    }
    catch (error) {
        console.log("Error in connection");
        console.error(error);
        // process.exit(1);
    }
};

module.exports = connectToDB;