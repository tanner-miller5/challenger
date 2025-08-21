const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize'); // Add this import
const Auth = require('../middleware/Auth');

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Username, email, and password are required'
            });
        }

        // Check if user already exists - Fixed the $or operator
        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { email: email.toLowerCase() },
                    { username: username.toLowerCase() }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email.toLowerCase() 
                    ? 'Email already registered' 
                    : 'Username already taken'
            });
        }

        // Create new user
        const user = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: password
        });

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Return success response
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: user.profilePicture,
                bio: user.bio,
                isVerified: user.isVerified,
                followerCount: user.followerCount,
                followingCount: user.followingCount,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors.map(err => err.message)
            });
        }

        // Handle unique constraint errors
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0].path;
            return res.status(400).json({
                message: `${field === 'email' ? 'Email' : 'Username'} already exists`
            });
        }

        res.status(500).json({
            message: 'Registration failed. Please try again.'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        // Update last login
        await user.updateLastLogin();

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Return success response
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePicture: user.profilePicture,
                bio: user.bio,
                isVerified: user.isVerified,
                followerCount: user.followerCount,
                followingCount: user.followingCount,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Login failed. Please try again.'
        });
    }
});

// Get current user profile
router.get('/me', Auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json({
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            message: 'Failed to fetch user profile'
        });
    }
});

// Update user profile
router.put('/profile', Auth, async (req, res) => {
    try {
        const { firstName, lastName, bio } = req.body;
        
        const user = await User.findByPk(req.user.userId);
        
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Update user fields
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (bio !== undefined) user.bio = bio;

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: user.toJSON()
        });

    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors.map(err => err.message)
            });
        }

        res.status(500).json({
            message: 'Failed to update profile'
        });
    }
});

// Logout (optional - mainly for clearing server-side sessions if used)
router.post('/logout', Auth, (req, res) => {
    // In JWT-based auth, logout is typically handled client-side
    // by removing the token from storage
    res.json({
        message: 'Logged out successfully'
    });
});

module.exports = router;