// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fast2sms = require('fast-two-sms');
const UserModel = require('../model/User');

const router = express.Router();

const otpStore = {};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendMessage = async (mobile, token) => {
  const options = {
    authorization: process.env.FAST2SMS_API_KEY,
    message: `Your OTP verification code is ${token}`,
    numbers: [mobile],
  };

  try {
    const response = await fast2sms.sendMessage(options);
    return { success: true, message: 'OTP sent successfully!' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, message: 'Failed to send OTP.' };
  }
};

router.post('/signup', async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
    });

    const savedUser = await newUser.save();
    const token = generateOTP();
    otpStore[phone] = { otp: token, timestamp: Date.now() };

    const result = await sendMessage(phone, token);

    if (result.success) {
      res.status(201).json({
        name: savedUser.name,
        email: savedUser.email,
        id: savedUser._id,
        otpSent: true,
        message: 'User registered successfully. OTP sent to the registered phone number.',
      });
    } else {
      res.status(500).json({ error: 'User registered, but failed to send OTP.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-otp', (req, res) => {
  const { mobileNumber, otp } = req.body;

  if (!otp || !mobileNumber) {
    return res.status(400).json({ success: false, message: 'Mobile number and OTP are required.' });
  }

  const otpData = otpStore[mobileNumber];
  if (!otpData) {
    return res.status(400).json({ success: false, message: 'OTP not sent or expired.' });
  }

  const otpExpiryTime = 5 * 60 * 1000;
  if (Date.now() - otpData.timestamp > otpExpiryTime) {
    delete otpStore[mobileNumber];
    return res.status(400).json({ success: false, message: 'OTP has expired.' });
  }

  if (otpData.otp === otp) {
    res.status(200).json({ success: true, message: 'OTP verified successfully!' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'No user found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '90d',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
