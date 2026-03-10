const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getMe, logoutUser, seedDatabase, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/register', registerUser); // Seeding/Admin usage
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/seed', seedDatabase); // Auto-fix for empty DB
router.get('/me', protect, getMe);

module.exports = router;
