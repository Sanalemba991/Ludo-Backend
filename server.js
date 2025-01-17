const express = require("express");
const dotenv = require("dotenv");
const app = express();
const mongoose = require("mongoose");
const port = 3000;
app.use(express.json());
dotenv.config();
const authenticateJWT = require("./middlewares/authenticateJWT");
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
let otpStore = {};
//generate otp
const generateOTP = () => {
  const secret = onlostpointercapture.authenticator.generatSecret();
  return onlostpointercapture.authenticator.generate(secret);
};
//send otp mobile using fast2sms
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
  
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
