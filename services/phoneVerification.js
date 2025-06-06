const axios = require('axios');
const querystring = require('querystring');
const OTP = require('../models/OTP');

const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Send OTP using Fast2SMS
exports.sendOTP = async (phoneNumber) => {

  const now = Date.now();

  // Check rate limit
  const recentAttempts = await OTP.countDocuments({
    phoneNumber,
    createdAt: { $gte: now - RATE_LIMIT_WINDOW }
  });

  if (recentAttempts >= RATE_LIMIT_ATTEMPTS) {
    throw new Error('Too many OTP requests. Try again later.');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Generated OTP for ${phoneNumber}: ${otp}`);

  // Save OTP in DB (with expiry)
  await OTP.create({
    phoneNumber,
    otp,
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes expiry
  });

  // 1. Build Fast2SMS API URL
  const apiKey = process.env.FAST2SMS_API;
  const baseUrl = 'https://www.fast2sms.com/dev/bulkV2';

  const queryParams = querystring.stringify({
    authorization: apiKey,
    route: 'otp',
    variables_values: otp,
    flash: 0,
    numbers: phoneNumber,
  });

  const fullUrl = `${baseUrl}?${queryParams}`;

  // 2. Send request securely via Axios
  try {
    const response = await axios.get(fullUrl, {
      headers: {
        'cache-control': 'no-cache',
      }
    });

    console.log('SMS sent:', response.data);
    return otp;
  } catch (error) {
    console.error('Failed to send OTP:', error.response?.data || error.message);
    throw new Error('Failed to send OTP');
  }
};

exports.verifyOTP = async (phoneNumber, otp) => {
  const record = await OTP.findOne({ phoneNumber, otp });

  if (!record || record.expiresAt < Date.now()) {
    return false;
  }

  // Valid OTP, delete it
  await OTP.deleteOne({ _id: record._id });

  return true;
};
