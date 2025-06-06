const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');

router.post('/request-otp', authController.requestOTP);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authorize('clinic-admin'), authController.getCurrentUser);

module.exports = router;
