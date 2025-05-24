const path = require('path'); // ✅ FIRST: Import this before using
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// Debug log to verify env
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✓ Present" : "❌ MISSING");
console.log("OWNER_EMAIL:", process.env.OWNER_EMAIL);

// Global OTP
let currentOTP = null;
let otpExpiry = null;

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Route: Send OTP
app.post('/send-otp', (req, res) => {
  currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
  otpExpiry = Date.now() + 5 * 60 * 1000;

  const mailOptions = {
    from: `"PDF Access System" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL,
    subject: "Your OTP Code",
    text: `Your OTP: ${currentOTP} (Valid for 5 minutes)`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("EMAIL ERROR:", error);
      return res.status(500).json({ success: false, message: "OTP send failed." });
    }
    console.log("OTP sent:", info.response);
    res.json({ success: true, message: "OTP sent." });
  });
});

// Route: Verify OTP
app.post('/verify-otp', (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ success: false, message: "OTP is required." });
  }

  if (!currentOTP || Date.now() > otpExpiry) {
    currentOTP = null;
    return res.status(400).json({ success: false, message: "OTP expired or not sent." });
  }

  if (otp === currentOTP) {
    currentOTP = null;
    return res.json({ success: true, message: "OTP verified." });
  }

  return res.status(400).json({ success: false, message: "Incorrect OTP." });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
