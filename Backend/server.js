require("dotenv").config();
// console.log("URI =", process.env.MONGO_URI);

// const express = require("express");
const app = require("./src/app");
const connectToDB = require("./src/config/database");
const dns = require ("dns");

// Change DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

connectToDB()

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})