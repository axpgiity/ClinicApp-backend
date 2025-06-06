const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const phoneVerificationService = require('../services/phoneVerification');  // Import the phone verification service

// a) Request OTP
exports.requestOTP = async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.status(400).json({ message: 'Phone number is required.' });

  try {
    await phoneVerificationService.sendOTP(phoneNumber);
    res.status(200).json({ message: 'OTP sent successfully.'});
  } catch (err) {
    console.error('OTP Error:', err.message);
    res.status(429).json({ error: err.message });
  }
};

// b) Register (with inline OTP verification)
exports.register = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, otp, role } = req.body;

    if (!name || !email || !password || !phoneNumber || !otp || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Check if email or phone already registered
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or phone number already registered.' });
    }

    // OTP Verification
    const isOtpValid = await phoneVerificationService.verifyOTP(phoneNumber, otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      phoneVerified: true,
      role,
    });

    const token = generateToken(newUser);
    const { _id } = newUser;

    res.status(201).json({
      user: { _id, name, email, role, phoneNumber },
      token,
    });
  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required.' });
    }

    // Find user by email, phoneNumber or username
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phoneNumber: identifier },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    const { _id, name, email, phoneNumber, role, username } = user;

    res.status(200).json({
      user: { _id, name, email, phoneNumber, username, role },
      token,
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};
