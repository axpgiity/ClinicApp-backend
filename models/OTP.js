const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // Auto-delete document after 5 minutes (300 seconds)
  },
});

module.exports = mongoose.model('OTP', otpSchema);
