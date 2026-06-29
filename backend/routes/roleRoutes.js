const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, roleController.getRoles)
    .post(protect, roleController.addRole);

module.exports = router;
