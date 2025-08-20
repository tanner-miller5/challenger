import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Lock, Star, Gift, Zap } from 'lucide-react';
import axios from 'axios';

const PremiumChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('premium');

  useEffect(() => {
    fetchPremiumChallenges();
  }, [filter]);

  const fetchPremiumChallenges = async () => {
    try {
      const response = await axios.get(`/api/challenges/premium?tier=${filter}`);
      setChallenges(response.data);
    } catch (error) {
      console.error('Error fetching premium challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading premium challenges...</div>;
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '32px' }}>
        <h1>
          <Crown size={32} style={{ marginRight: '12px', color: '#ffd700' }} />
          Premium Challenges
        </h1>
        <p style={{ color: '#6c757d', fontSize: '18px' }}>
          Exclusive, high-quality challenges from top creators
        </p>
      </div>

      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)', 
        color: '#333',
        marginBottom: '24px' 
      }}>
        <h3>Why Go Premium?</h3>
        <div className="grid grid-3" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={20} />
            <span>Exclusive Content</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} />
            <span>Early Access</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gift size={20} />
            <span>Creator Support</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${filter === 'premium' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('premium')}
          >
            Premium ($0.99 - $2.99)
          </button>
          <button 
            className={`btn ${filter === 'exclusive' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('exclusive')}
          >
            Exclusive ($5.00 - $9.99)
          </button>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Premium
          </button>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <Crown size={64} style={{ color: '#6c757d', marginBottom: '16px' }} />
          <h3 style={{ color: '#6c757d' }}>No Premium Challenges</h3>
          <p style={{ color: '#6c757d' }}>
            Premium challenges will appear here once creators start publishing them
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="challenge-card">
              <div className="challenge-header" style={{
                background: challenge.price_tier === 'exclusive' 
                  ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3>{challenge.title}</h3>
                  {challenge.price_tier === 'exclusive' ? (
                    <Crown size={20} style={{ color: '#ffd700' }} />
                  ) : (
                    <Star size={20} />
                  )}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  by @{challenge.creator_username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                  <span className={`badge badge-${challenge.price_tier}`}>
                    ${challenge.price}
                  </span>
                  <span style={{ fontSize: '12px' }}>
                    {challenge.category}
                  </span>
                </div>
              </div>
              
              <div className="challenge-body">
                {!challenge.has_purchased && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: '#f8f9fa', 
                    padding: '8px 12px', 
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '14px',
                    color: '#6c757d'
                  }}>
                    <Lock size={16} />
                    Preview Mode - Purchase to view full content
                  </div>
                )}
                
                <p style={{ marginBottom: '16px', color: '#6c757d', lineHeight: '1.5' }}>
                  {challenge.description.length > 80 
                    ? `${challenge.description.substring(0, 80)}...`
                    : challenge.description
                  }
                </p>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                    Revenue Distribution:
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    <span style={{ color: '#28a745' }}>Creator: 60%</span> • 
                    <span style={{ color: '#007bff', marginLeft: '4px' }}>Participants: 25%</span> • 
                    <span style={{ color: '#6c757d', marginLeft: '4px' }}>Platform: 15%</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '14px' }}>
                    <strong>{challenge.participant_count}</strong> participants
                    <br />
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                      ${challenge.total_revenue?.toFixed(2) || '0.00'} earned
                    </span>
                  </div>
                  <Link 
                    to={`/challenge/${challenge.id}`} 
                    className="btn btn-primary"
                    style={{ 
                      textDecoration: 'none', 
                      padding: '8px 16px', 
                      fontSize: '14px',
                      background: challenge.has_purchased 
                        ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                        : undefined
                    }}
                  >
                    {challenge.has_purchased ? 'View Challenge' : `Buy $${challenge.price}`}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PremiumChallenges;
