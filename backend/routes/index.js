const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const challengeRoutes = require('./challenges');
const userRoutes = require('./users');


// API route handlers
router.use('/auth', authRoutes);
router.use('/challenges', challengeRoutes);
router.use('/users', userRoutes);


// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API info endpoint
router.get('/', (req, res) => {
    res.json({
        message: 'Challenger API',
        version: '1.0.0',
        endpoints: [
            'GET /api/health - Health check',
            'POST /api/auth/register - Register user',
            'POST /api/auth/login - Login user',
            'GET /api/auth/me - Get current user',
            'GET /api/challenges - Get challenges',
            'POST /api/challenges - Create challenge',
            'GET /api/users - Get users',
        ]
    });
});

module.exports = router;