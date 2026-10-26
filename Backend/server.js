require("dotenv").config();
// console.log("URI =", process.env.MONGO_URI);

// const express = require("express");
const app = require("./src/app");
const connectToDB = require("./src/config/database");
const dns = require ("dns");

// Change DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectToDB().catch((error) => {
  console.error("Failed to connect to DB:", error);
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running locally on port ${PORT}`);
  });
}

module.exports = app;