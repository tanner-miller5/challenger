const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// Ensure upload directory exists
const ensureUploadDir = async (dir) => {
  try {
    await fs.access(dir);
  } catch (error) {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads/';
    await ensureUploadDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `challenge-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 // 50MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (MP4, MPEG, MOV, AVI) are allowed'));
    }
  }
});

// Input validation helpers
const validateChallengeInput = (title, description, category, price_tier) => {
  const errors = [];

  if (!title || title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  if (title && title.length > 100) {
    errors.push('Title cannot exceed 100 characters');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long');
  }
  if (description && description.length > 1000) {
    errors.push('Description cannot exceed 1000 characters');
  }

  const allowedCategories = ['dance', 'fitness', 'comedy', 'lifestyle', 'education', 'other'];
  if (!category || !allowedCategories.includes(category)) {
    errors.push('Invalid category. Must be one of: ' + allowedCategories.join(', '));
  }

  const allowedTiers = ['free', 'premium', 'exclusive'];
  if (!price_tier || !allowedTiers.includes(price_tier)) {
    errors.push('Invalid price tier. Must be one of: ' + allowedTiers.join(', '));
  }

  return errors;
};

// Get user's own challenges (for Dashboard)
router.get('/my', auth, async (req, res) => {
  try {
    const challenges = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.category,
        c.price_tier,
        c.price,
        c.video_url,
        c.created_at,
        COUNT(DISTINCT cp.user_id) as participant_count,
        COALESCE(SUM(cv.amount), 0) as total_revenue
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      LEFT JOIN challenge_views cv ON c.id = cv.challenge_id AND cv.payment_status = 'completed'
      WHERE c.creator_id = $1
      GROUP BY c.id, c.title, c.description, c.category, c.price_tier, c.price, c.video_url, c.created_at
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    const formattedChallenges = challenges.rows.map(challenge => ({
      ...challenge,
      participant_count: parseInt(challenge.participant_count),
      total_revenue: parseFloat(challenge.total_revenue)
    }));

    res.json(formattedChallenges);
  } catch (error) {
    console.error('Get my challenges error:', error);
    res.status(500).json({ message: 'Failed to retrieve challenges' });
  }
});

// Get challenge statistics (for Dashboard)
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT c.id) as total_challenges,
        COUNT(DISTINCT cp.user_id) as total_participants,
        COALESCE(SUM(CASE WHEN cv.payment_status = 'completed' THEN cv.amount ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT CASE 
          WHEN c.created_at > NOW() - INTERVAL '7 days' 
            AND (SELECT COUNT(*) FROM challenge_participants cp2 WHERE cp2.challenge_id = c.id) > 5
          THEN c.id 
        END) as trending_count
      FROM challenges c
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      LEFT JOIN challenge_views cv ON c.id = cv.challenge_id
      WHERE c.creator_id = $1
    `, [req.user.id]);

    const result = stats.rows[0];
    res.json({
      totalChallenges: parseInt(result.total_challenges),
      totalParticipants: parseInt(result.total_participants),
      totalRevenue: parseFloat(result.total_revenue),
      trendingCount: parseInt(result.trending_count)
    });
  } catch (error) {
    console.error('Get challenge stats error:', error);
    res.status(500).json({ message: 'Failed to retrieve statistics' });
  }
});

// Create new challenge
router.post('/', auth, upload.single('video'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { title, description, category, price_tier, price, tagged_users } = req.body;

    // Validate input
    const validationErrors = validateChallengeInput(title, description, category, price_tier);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: validationErrors.join(', ') });
    }

    // Validate price for non-free tiers
    let challengePrice = 0;
    if (price_tier !== 'free') {
      challengePrice = parseFloat(price);
      
      if (isNaN(challengePrice) || challengePrice <= 0) {
        return res.status(400).json({ message: 'Valid price required for paid challenges' });
      }

      if (price_tier === 'premium' && (challengePrice < 0.99 || challengePrice > 2.99)) {
        return res.status(400).json({ message: 'Premium challenges must be priced between $0.99 and $2.99' });
      }

      if (price_tier === 'exclusive' && (challengePrice < 5.00 || challengePrice > 9.99)) {
        return res.status(400).json({ message: 'Exclusive challenges must be priced between $5.00 and $9.99' });
      }
    }

    let videoUrl = null;
    if (req.file) {
      videoUrl = `/uploads/${req.file.filename}`;
    }

    // Create challenge
    const newChallenge = await client.query(`
      INSERT INTO challenges (
        creator_id, title, description, category, price_tier, price, video_url, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `, [req.user.id, title.trim(), description.trim(), category, price_tier, challengePrice, videoUrl]);

    const challenge = newChallenge.rows[0];

    // Handle tagged users
    if (tagged_users && tagged_users.trim()) {
      const usernames = tagged_users.split(',')
        .map(u => u.trim())
        .filter(u => u.length > 0);
      
      for (const username of usernames) {
        try {
          const userResult = await client.query(
            'SELECT id FROM users WHERE username = $1', 
            [username.toLowerCase()]
          );
          
          if (userResult.rows.length > 0) {
            await client.query(`
              INSERT INTO user_tags (challenge_id, tagged_user_id, tagger_id, created_at)
              VALUES ($1, $2, $3, NOW())
              ON CONFLICT (challenge_id, tagged_user_id) DO NOTHING
            `, [challenge.id, userResult.rows[0].id, req.user.id]);
          }
        } catch (tagError) {
          console.error(`Error tagging user ${username}:`, tagError);
          // Continue with other users even if one fails
        }
      }
    }

    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Challenge created successfully',
      challenge: {
        ...challenge,
        creator_username: req.user.username
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create challenge error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error removing uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ message: 'Failed to create challenge' });
  } finally {
    client.release();
  }
});

// Get challenge details
router.get('/:id', auth, async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: 'Invalid challenge ID' });
    }

    const challengeResult = await pool.query(`
      SELECT 
        c.*,
        u.username as creator_username,
        COUNT(DISTINCT cp.user_id) as participant_count,
        COALESCE(SUM(CASE WHEN cv.payment_status = 'completed' THEN cv.amount ELSE 0 END), 0) as total_revenue,
        EXISTS(SELECT 1 FROM challenge_views cv2 WHERE cv2.challenge_id = c.id AND cv2.user_id = $2 AND cv2.payment_status = 'completed') as has_purchased,
        EXISTS(SELECT 1 FROM challenge_participants cp2 WHERE cp2.challenge_id = c.id AND cp2.user_id = $2) as is_participant
      FROM challenges c
      JOIN users u ON c.creator_id = u.id
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      LEFT JOIN challenge_views cv ON c.id = cv.challenge_id
      WHERE c.id = $1
      GROUP BY c.id, c.creator_id, c.title, c.description, c.category, c.price_tier, c.price, 
               c.video_url, c.created_at, c.updated_at, u.username
    `, [challengeId, req.user.id]);

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    let challenge = challengeResult.rows[0];
    challenge.participant_count = parseInt(challenge.participant_count);
    challenge.total_revenue = parseFloat(challenge.total_revenue);

    // Check if user has access to full content
    const hasAccess = challenge.price_tier === 'free' || 
                      challenge.has_purchased || 
                      challenge.creator_id === req.user.id;

    if (!hasAccess) {
      // Return limited info for unpurchased premium content
      challenge = {
        ...challenge,
        video_url: null,
        description: challenge.description.length > 100 
          ? challenge.description.substring(0, 100) + '...' 
          : challenge.description
      };
    }

    res.json(challenge);
  } catch (error) {
    console.error('Get challenge details error:', error);
    res.status(500).json({ message: 'Failed to retrieve challenge details' });
  }
});

// Get challenge participants
router.get('/:id/participants', auth, async (req, res) => {
  try {
    const challengeId = parseInt(req.params.id);
    
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: 'Invalid challenge ID' });
    }

    // Check if challenge exists
    const challengeExists = await pool.query('SELECT id FROM challenges WHERE id = $1', [challengeId]);
    
    if (challengeExists.rows.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const participants = await pool.query(`
      SELECT 
        u.id,
        u.username,
        cp.joined_at,
        cp.submission_video_url
      FROM challenge_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.challenge_id = $1
      ORDER BY cp.joined_at ASC
    `, [challengeId]);

    res.json(participants.rows);
  } catch (error) {
    console.error('Get challenge participants error:', error);
    res.status(500).json({ message: 'Failed to retrieve participants' });
  }
});

// Purchase challenge access
router.post('/:id/purchase', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const challengeId = parseInt(req.params.id);
    
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: 'Invalid challenge ID' });
    }

    const challengeResult = await client.query(
      'SELECT * FROM challenges WHERE id = $1',
      [challengeId]
    );

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];

    if (challenge.price_tier === 'free') {
      return res.status(400).json({ message: 'This challenge is free' });
    }

    if (challenge.creator_id === req.user.id) {
      return res.status(400).json({ message: 'You cannot purchase your own challenge' });
    }

    // Check if already purchased
    const existingPurchase = await client.query(
      'SELECT id FROM challenge_views WHERE challenge_id = $1 AND user_id = $2',
      [challengeId, req.user.id]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ message: 'Challenge already purchased' });
    }

    // Record purchase (simplified payment processing)
    const purchaseResult = await client.query(`
      INSERT INTO challenge_views (challenge_id, user_id, amount, payment_status, created_at)
      VALUES ($1, $2, $3, 'completed', NOW())
      RETURNING *
    `, [challengeId, req.user.id, challenge.price]);

    // Distribute revenue
    await distributeRevenue(client, challengeId, challenge.price, challenge.creator_id);

    await client.query('COMMIT');
    
    res.json({ 
      message: 'Purchase successful',
      purchase: purchaseResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Purchase challenge error:', error);
    res.status(500).json({ message: 'Purchase failed' });
  } finally {
    client.release();
  }
});

// Join challenge as participant
router.post('/:id/participate', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const challengeId = parseInt(req.params.id);
    
    if (isNaN(challengeId)) {
      return res.status(400).json({ message: 'Invalid challenge ID' });
    }

    // Check if challenge exists and user has access
    const challengeResult = await client.query(`
      SELECT 
        c.*, 
        EXISTS(SELECT 1 FROM challenge_views cv WHERE cv.challenge_id = c.id AND cv.user_id = $2 AND cv.payment_status = 'completed') as has_access
      FROM challenges c
      WHERE c.id = $1
    `, [challengeId, req.user.id]);

    if (challengeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const challenge = challengeResult.rows[0];

    // Check access for premium challenges
    if (challenge.price_tier !== 'free' && !challenge.has_access && challenge.creator_id !== req.user.id) {
      return res.status(403).json({ message: 'Please purchase access to this challenge first' });
    }

    // Check if already participating
    const existingParticipant = await client.query(
      'SELECT id FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2',
      [challengeId, req.user.id]
    );

    if (existingParticipant.rows.length > 0) {
      return res.status(400).json({ message: 'Already participating in this challenge' });
    }

    // Add participant
    const participantResult = await client.query(`
      INSERT INTO challenge_participants (challenge_id, user_id, joined_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `, [challengeId, req.user.id]);

    await client.query('COMMIT');
    
    res.json({ 
      message: 'Successfully joined challenge',
      participant: participantResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Join challenge error:', error);
    res.status(500).json({ message: 'Failed to join challenge' });
  } finally {
    client.release();
  }
});

// Get trending challenges
router.get('/trending', auth, async (req, res) => {
  try {
    const filter = req.query.filter || 'all';
    const limit = parseInt(req.query.limit) || 20;
    
    let whereClause = '';
    let params = [limit];
    
    if (filter !== 'all') {
      whereClause = 'WHERE c.category = $2';
      params = [limit, filter];
    }

    const challenges = await pool.query(`
      SELECT 
        c.*,
        u.username as creator_username,
        COUNT(DISTINCT cp.user_id) as participant_count,
        COUNT(DISTINCT cv.user_id) as view_count,
        COALESCE(SUM(CASE WHEN cv.payment_status = 'completed' THEN cv.amount ELSE 0 END), 0) as total_revenue,
        (COUNT(DISTINCT cp.user_id) * 10 + COUNT(DISTINCT cv.user_id) * 5 + 
         CASE WHEN c.created_at > NOW() - INTERVAL '7 days' THEN 50 ELSE 0 END) as viral_score
      FROM challenges c
      JOIN users u ON c.creator_id = u.id
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      LEFT JOIN challenge_views cv ON c.id = cv.challenge_id
      ${whereClause}
      GROUP BY c.id, c.creator_id, c.title, c.description, c.category, c.price_tier, c.price, 
               c.video_url, c.created_at, c.updated_at, u.username
      HAVING COUNT(DISTINCT cp.user_id) > 0 OR COUNT(DISTINCT cv.user_id) > 0
      ORDER BY viral_score DESC, c.created_at DESC
      LIMIT $1
    `, params);

    const formattedChallenges = challenges.rows.map(challenge => ({
      ...challenge,
      participant_count: parseInt(challenge.participant_count),
      view_count: parseInt(challenge.view_count),
      total_revenue: parseFloat(challenge.total_revenue),
      viral_score: parseInt(challenge.viral_score)
    }));

    res.json(formattedChallenges);
  } catch (error) {
    console.error('Get trending challenges error:', error);
    res.status(500).json({ message: 'Failed to retrieve trending challenges' });
  }
});

// Get premium challenges
router.get('/premium', auth, async (req, res) => {
  try {
    const tier = req.query.tier || 'premium';
    const limit = parseInt(req.query.limit) || 20;
    
    let whereClause = 'WHERE c.price_tier != \'free\'';
    let params = [req.user.id, limit];
    
    if (tier !== 'all') {
      whereClause += ' AND c.price_tier = $3';
      params = [req.user.id, limit, tier];
    }

    const challenges = await pool.query(`
      SELECT 
        c.*,
        u.username as creator_username,
        COUNT(DISTINCT cp.user_id) as participant_count,
        COALESCE(SUM(CASE WHEN cv.payment_status = 'completed' THEN cv.amount ELSE 0 END), 0) as total_revenue,
        EXISTS(SELECT 1 FROM challenge_views cv2 WHERE cv2.challenge_id = c.id AND cv2.user_id = $1 AND cv2.payment_status = 'completed') as has_purchased
      FROM challenges c
      JOIN users u ON c.creator_id = u.id
      LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
      LEFT JOIN challenge_views cv ON c.id = cv.challenge_id
      ${whereClause}
      GROUP BY c.id, c.creator_id, c.title, c.description, c.category, c.price_tier, c.price, 
               c.video_url, c.created_at, c.updated_at, u.username
      ORDER BY c.created_at DESC
      LIMIT $2
    `, params);

    const formattedChallenges = challenges.rows.map(challenge => ({
      ...challenge,
      participant_count: parseInt(challenge.participant_count),
      total_revenue: parseFloat(challenge.total_revenue)
    }));

    res.json(formattedChallenges);
  } catch (error) {
    console.error('Get premium challenges error:', error);
    res.status(500).json({ message: 'Failed to retrieve premium challenges' });
  }
});

// Helper function to distribute revenue
async function distributeRevenue(client, challengeId, amount, creatorId) {
  try {
    const creatorShare = amount * 0.6; // 60% to creator
    const participantPool = amount * 0.25; // 25% to participants
    const platformFee = amount * 0.15; // 15% platform fee

    // Creator revenue
    await client.query(`
      INSERT INTO revenue_distribution (challenge_id, user_id, amount, type, created_at)
      VALUES ($1, $2, $3, 'creator_share', NOW())
    `, [challengeId, creatorId, creatorShare]);

    // Get participants in join order
    const participants = await client.query(`
      SELECT user_id, ROW_NUMBER() OVER (ORDER BY joined_at) as position
      FROM challenge_participants
      WHERE challenge_id = $1
      ORDER BY joined_at
    `, [challengeId]);

    // Distribute participant shares (pyramid model)
    if (participants.rows.length > 0) {
      const baseShare = participantPool / participants.rows.length;
      
      for (const participant of participants.rows) {
        // Earlier participants get slightly more
        const positionMultiplier = Math.max(0.5, 1.5 - (participant.position - 1) * 0.1);
        const participantAmount = baseShare * positionMultiplier;
        
        await client.query(`
          INSERT INTO revenue_distribution (challenge_id, user_id, amount, type, created_at)
          VALUES ($1, $2, $3, 'participant_share', NOW())
        `, [challengeId, participant.user_id, participantAmount]);
      }
    }

    // Platform fee (no user_id for platform revenue)
    await client.query(`
      INSERT INTO revenue_distribution (challenge_id, user_id, amount, type, created_at)
      VALUES ($1, NULL, $2, 'platform_fee', NOW())
    `, [challengeId, platformFee]);

  } catch (error) {
    console.error('Revenue distribution error:', error);
    throw error;
  }
}

module.exports = router;