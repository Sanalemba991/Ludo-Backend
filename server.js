const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fast2sms = require("fast-two-sms");
const UserModel = require("./model/User");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const otpStore = {}; // To store OTPs temporarily

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Function to generate OTP (using a simple random 6-digit number)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP via Fast2SMS
const sendMessage = async (mobile, token) => {
  const options = {
    authorization: process.env.FAST2SMS_API_KEY,
    message: `Your OTP verification code is ${token}`,
    numbers: [mobile],
  };

  try {
    const response = await fast2sms.sendMessage(options);
    return { success: true, message: "OTP sent successfully!" };
  } catch (error) {
    console.error("Error sending OTP:", error);
    return { success: false, message: "Failed to send OTP." };
  }
};

// Signup Route
app.post("/signup", async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
    });

    const savedUser = await newUser.save();
    const token = generateOTP(); // Generate OTP
    otpStore[phone] = token; // Store OTP

    const result = await sendMessage(phone, token); // Send OTP

    if (result.success) {
      res.status(201).json({
        name: savedUser.name,
        email: savedUser.email,
        id: savedUser._id,
        otpSent: true,
        message: "User registered successfully. OTP sent to the registered phone number.",
      });
    } else {
      res.status(500).json({ error: "User registered, but failed to send OTP." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OTP Verification Route
app.post("/verify-otp", (req, res) => {
  const { mobileNumber, otp } = req.body;

  if (!otp || !mobileNumber) {
    return res.status(400).json({ success: false, message: "Mobile number and OTP are required." });
  }

  if (otpStore[mobileNumber] && otpStore[mobileNumber] === otp) {
    res.status(200).json({ success: true, message: "OTP verified successfully!" });
  } else {
    res.status(400).json({ success: false, message: "Invalid OTP." });
  }
});

// User Login Route with JWT token generation
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "No user found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "90d", // Token expires in 90 days
    });

    res.status(200).json({
      message: "Login successful",
      token: token, // Send the JWT token to the client
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
