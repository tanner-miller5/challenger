
const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all users (for user search/discovery)
router.get('/', auth, async (req, res) => {
    try {
        const { search, limit = 20, offset = 0 } = req.query;

        let query = `
      SELECT 
        u.id,
        u.username,
        u.created_at,
        COUNT(DISTINCT c.id) as challenges_created,
        COUNT(DISTINCT cp.challenge_id) as challenges_participated,
        COALESCE(SUM(rd.amount), 0) as total_earnings
      FROM users u
      LEFT JOIN challenges c ON u.id = c.creator_id
      LEFT JOIN challenge_participants cp ON u.id = cp.user_id
      LEFT JOIN revenue_distribution rd ON u.id = rd.user_id
    `;

        let params = [];
        let paramCount = 0;

        if (search) {
            query += ` WHERE u.username ILIKE $${++paramCount}`;
            params.push(`%${search}%`);
        }

        query += `
      GROUP BY u.id, u.username, u.created_at
      ORDER BY u.username
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

        params.push(limit, offset);

        const users = await pool.query(query, params);
        res.json(users.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user by ID or username
router.get('/:identifier', auth, async (req, res) => {
    try {
        const { identifier } = req.params;

        // Check if identifier is numeric (ID) or string (username)
        const isId = /^\d+$/.test(identifier);
        const field = isId ? 'id' : 'username';
        const value = isId ? parseInt(identifier) : identifier;

        const userResult = await pool.query(`
      SELECT 
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
      WHERE u.${field} = $1
      GROUP BY u.id, u.username, u.email, u.created_at
    `, [value]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];

        // Don't expose email if not own profile
        if (user.id !== req.user.id) {
            delete user.email;
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's challenges
router.get('/:identifier/challenges', auth, async (req, res) => {
    try {
        const { identifier } = req.params;
        const isId = /^\d+$/.test(identifier);
        const field = isId ? 'id' : 'username';
        const value = isId ? parseInt(identifier) : identifier;

        // First get the user ID
        const userResult = await pool.query(`SELECT id FROM users WHERE ${field} = $1`, [value]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userId = userResult.rows[0].id;

        const challenges = await pool.query(`
      SELECT 
        c.*,
        u.username as creator_username,
        COUNT(DISTINCT cp.user_id) as participant_count,
        COALESCE(SUM(cv.amount), 0) as total_revenue
      FROM challenges c
      JOIN users u ON c.creator_id = u.id
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      LEFT JOIN challenge_views cv ON c.id = cv.challenge_id
      WHERE c.creator_id = $1
      GROUP BY c.id, u.username
      ORDER BY c.created_at DESC
    `, [userId]);

        res.json(challenges.rows);
    } catch (error) {
        console.error('Get user challenges error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Follow/Unfollow user (if implementing social features)
router.post('/:identifier/follow', auth, async (req, res) => {
    try {
        const { identifier } = req.params;
        const isId = /^\d+$/.test(identifier);
        const field = isId ? 'id' : 'username';
        const value = isId ? parseInt(identifier) : identifier;

        // Get target user
        const targetUserResult = await pool.query(`SELECT id FROM users WHERE ${field} = $1`, [value]);

        if (targetUserResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const targetUserId = targetUserResult.rows[0].id;

        // Can't follow yourself
        if (targetUserId === req.user.id) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        // Check if already following
        const existingFollow = await pool.query(
            'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2',
            [req.user.id, targetUserId]
        );

        if (existingFollow.rows.length > 0) {
            // Unfollow
            await pool.query(
                'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
                [req.user.id, targetUserId]
            );
            res.json({ message: 'Unfollowed successfully', following: false });
        } else {
            // Follow
            await pool.query(
                'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)',
                [req.user.id, targetUserId]
            );
            res.json({ message: 'Followed successfully', following: true });
        }
    } catch (error) {
        console.error('Follow/unfollow error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's followers
router.get('/:identifier/followers', auth, async (req, res) => {
    try {
        const { identifier } = req.params;
        const isId = /^\d+$/.test(identifier);
        const field = isId ? 'id' : 'username';
        const value = isId ? parseInt(identifier) : identifier;

        const followers = await pool.query(`
      SELECT 
        u.id,
        u.username,
        uf.created_at as followed_at
      FROM user_follows uf
      JOIN users u ON uf.follower_id = u.id
      JOIN users target ON uf.following_id = target.id
      WHERE target.${field} = $1
      ORDER BY uf.created_at DESC
    `, [value]);

        res.json(followers.rows);
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get users that this user is following
router.get('/:identifier/following', auth, async (req, res) => {
    try {
        const { identifier } = req.params;
        const isId = /^\d+$/.test(identifier);
        const field = isId ? 'id' : 'username';
        const value = isId ? parseInt(identifier) : identifier;

        const following = await pool.query(`
      SELECT 
        u.id,
        u.username,
        uf.created_at as followed_at
      FROM user_follows uf
      JOIN users u ON uf.following_id = u.id
      JOIN users follower ON uf.follower_id = follower.id
      WHERE follower.${field} = $1
      ORDER BY uf.created_at DESC
    `, [value]);

        res.json(following.rows);
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;