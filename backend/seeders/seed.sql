
-- Seed data for development/testing (optional)

-- Insert test users (passwords are 'password123' hashed with bcrypt)
INSERT INTO users (username, email, password_hash) VALUES 
('johndoe', 'john@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8ux/VzMz7.'),
('janedoe', 'jane@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8ux/VzMz7.'),
('creator1', 'creator1@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8ux/VzMz7.'),
('testuser', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8ux/VzMz7.')
ON CONFLICT (username) DO NOTHING;

-- Insert test challenges
INSERT INTO challenges (creator_id, title, description, category, price_tier, price) VALUES 
(1, 'Dance Challenge 2024', 'Show us your best dance moves to this trending song! Perfect for beginners and pros alike.', 'dance', 'free', 0.00),
(1, 'Fitness Motivation Challenge', 'Complete this 30-day fitness challenge and share your progress. Transform your body and mind!', 'fitness', 'premium', 1.99),
(2, 'Comedy Skit Challenge', 'Create a funny 60-second comedy skit that will make everyone laugh. Unleash your creativity!', 'comedy', 'premium', 2.49),
(3, 'Lifestyle Transformation', 'Document your lifestyle changes over 30 days. Health, productivity, and mindfulness combined.', 'lifestyle', 'exclusive', 7.99),
(2, 'Educational Content Challenge', 'Teach something new in 3 minutes or less. Share your knowledge with the world!', 'education', 'free', 0.00)
ON CONFLICT DO NOTHING;

-- Insert some test challenge participants
INSERT INTO challenge_participants (challenge_id, user_id) VALUES 
(1, 2),
(1, 3),
(1, 4),
(2, 3),
(5, 1),
(5, 4)
ON CONFLICT (challenge_id, user_id) DO NOTHING;

-- Insert some test challenge views/purchases
INSERT INTO challenge_views (challenge_id, user_id, amount, payment_status) VALUES 
(2, 2, 1.99, 'completed'),
(3, 1, 2.49, 'completed'),
(4, 2, 7.99, 'completed'),
(4, 4, 7.99, 'completed')
ON CONFLICT (challenge_id, user_id) DO NOTHING;
