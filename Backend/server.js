require("dotenv").config();
// console.log("URI =", process.env.MONGO_URI);

// const express = require("express");
const app = require("./src/app");
const connectToDB = require("./src/config/database");
const dns = require ("dns");

// Change DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectToDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server due to DB connection error:", error);
  }
};

startServer();