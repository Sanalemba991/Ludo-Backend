const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,  // Ensures email is stored in lowercase
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],  // Basic email regex validation
    },
    password: {
      type: String,
      required: true,
      minlength: 8,  // Password must be at least 8 characters
    },
    phone: {
      type: String,
      default: null,
      match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],  // Phone validation (you can modify the regex if needed)
    },
  },
  { timestamps: true }  // Automatically adds createdAt and updatedAt fields
);

const User = mongoose.model("User", userSchema);

module.exports = User;
