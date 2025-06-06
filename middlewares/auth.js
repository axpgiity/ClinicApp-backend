const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Auth middleware
exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1]; // Bearer token

  if (!token) return res.status(401).json({ message: 'Not authorized, token missing' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based access
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('User role:', req.user.role);  
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
