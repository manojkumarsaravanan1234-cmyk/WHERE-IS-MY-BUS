const express = require('express');
const router = express.Router();
const { loginAdmin } = require('../controllers/authController');

// @route   POST /api/auth/login
// @desc    Admin Login
// @access  Public
router.post('/login', loginAdmin);

module.exports = router;
