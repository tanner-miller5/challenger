-- Create database schema for Challenger platform

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    price_tier VARCHAR(20) NOT NULL CHECK (price_tier IN ('free', 'premium', 'exclusive')),
    price DECIMAL(10,2) DEFAULT 0.00,
    video_url VARCHAR(255),
    thumbnail_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_video_url VARCHAR(255),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- User tags table (for challenge invitations)
CREATE TABLE IF NOT EXISTS user_tags (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    tagged_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tagger_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(challenge_id, tagged_user_id)
);

-- Challenge views/purchases table
CREATE TABLE IF NOT EXISTS challenge_views (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

-- Revenue distribution table
CREATE TABLE IF NOT EXISTS revenue_distribution (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('creator_share', 'participant_share', 'platform_fee')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- User follows table (for social features)
CREATE TABLE IF NOT EXISTS user_follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_creator_id ON challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_price_tier ON challenges(price_tier);
CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_joined_at ON challenge_participants(joined_at);

CREATE INDEX IF NOT EXISTS idx_challenge_views_challenge_id ON challenge_views(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_views_user_id ON challenge_views(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_views_payment_status ON challenge_views(payment_status);

CREATE INDEX IF NOT EXISTS idx_revenue_distribution_challenge_id ON revenue_distribution(challenge_id);
CREATE INDEX IF NOT EXISTS idx_revenue_distribution_user_id ON revenue_distribution(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_distribution_type ON revenue_distribution(type);

CREATE INDEX IF NOT EXISTS idx_user_tags_challenge_id ON user_tags(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tagged_user_id ON user_tags(tagged_user_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows(following_id);

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
