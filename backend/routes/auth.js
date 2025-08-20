const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Input validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

// Register user
router.post('/register', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Username, email, and password are required' 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ 
        message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' 
      });
    }

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      const existingEmail = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );
      
      const existingUsername = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [username.toLowerCase()]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      
      if (existingUsername.rows.length > 0) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Hash password
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await client.query(
      `INSERT INTO users (username, email, password_hash, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING id, username, email, created_at`,
      [username.toLowerCase(), email.toLowerCase(), hashedPassword]
    );

    const user = newUser.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  } finally {
    client.release();
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

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.created_at,
        COUNT(DISTINCT c.id) as challenges_created,
        COUNT(DISTINCT cp.challenge_id) as challenges_participated,
        COALESCE(SUM(rd.amount), 0) as total_earnings
       FROM users u
       LEFT JOIN challenges c ON u.id = c.creator_id
       LEFT JOIN challenge_participants cp ON u.id = cp.user_id
       LEFT JOIN revenue_distribution rd ON u.id = rd.user_id
       WHERE u.id = $1
       GROUP BY u.id, u.username, u.email, u.created_at`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      stats: {
        challenges_created: parseInt(user.challenges_created),
        challenges_participated: parseInt(user.challenges_participated),
        total_earnings: parseFloat(user.total_earnings)
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Get current user with password
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedNewPassword, req.user.id]
    );

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username && !email) {
      return res.status(400).json({ 
        message: 'At least one field (username or email) is required' 
      });
    }

    let updateFields = [];
    let updateValues = [];
    let paramCount = 0;

    if (username) {
      if (!validateUsername(username)) {
        return res.status(400).json({ 
          message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' 
        });
      }

      // Check if username is taken
      const existingUsername = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username.toLowerCase(), req.user.id]
      );

      if (existingUsername.rows.length > 0) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      updateFields.push(`username = $${++paramCount}`);
      updateValues.push(username.toLowerCase());
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ 
          message: 'Please provide a valid email address' 
        });
      }

      // Check if email is taken
      const existingEmail = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), req.user.id]
      );

      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      updateFields.push(`email = $${++paramCount}`);
      updateValues.push(email.toLowerCase());
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(req.user.id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${++paramCount}
      RETURNING id, username, email, created_at
    `;

    const updatedUser = await pool.query(query, updateValues);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (client-side token removal, but we can add token blacklisting here)
router.post('/logout', auth, async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, just acknowledge the logout
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;