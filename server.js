const express = require("express");
const dotenv = require("dotenv");
const app = express();
const mongoose = require("mongoose");
const port = 3000;
app.use(express.json());
dotenv.config();
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
