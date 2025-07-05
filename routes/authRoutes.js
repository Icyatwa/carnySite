const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/check-setup', authController.checkSetup);
router.post('/setup', authController.setup);
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/create-admin', authController.createAdmin);

// Protected routes
router.post('/complete-setup', authMiddleware, authController.completeSetup);
router.get('/verify', authMiddleware, authController.verifyToken);

module.exports = router;