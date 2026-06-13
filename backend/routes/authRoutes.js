// Authentication API routes.

const express = require('express');
const router = express.Router();
const { register, login, getProfile, getAllUsers } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

/** POST /api/register - Register a new collaborator account */
router.post('/register', register);

/** POST /api/login - Authenticate user credentials and issue JWT */
router.post('/login', login);

/** GET /api/me - Retrieve current authenticated user profile (protected) */
router.get('/me', verifyToken, getProfile);

/** GET /api/users - Fetch public user directory for collaboration invitations */
router.get('/users', getAllUsers);

module.exports = router;

