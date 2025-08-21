const jwt = require('jsonwebtoken');
const { User } = require('../models');

const Auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Find user in database
        const user = await User.findByPk(decoded.userId, {
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(401).json({
                message: 'Token is not valid. User not found.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                message: 'Account is deactivated.'
            });
        }

        // Add user info to request
        req.user = {
            userId: user.id,
            username: user.username,
            email: user.email,
            isVerified: user.isVerified
        };
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Token is not valid.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token has expired.'
            });
        }
        
        res.status(500).json({
            message: 'Server error during authentication.'
        });
    }
};

module.exports = Auth;
