// app.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');  // Import the routes

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

app.use('/auth', authRoutes); // Use the routes for all authentication-related endpoints

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
