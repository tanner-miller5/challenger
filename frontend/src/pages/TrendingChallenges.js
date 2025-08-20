
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Flame, Users, Eye } from 'lucide-react';
import axios from 'axios';

const TrendingChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTrendingChallenges();
  }, [filter]);

  const fetchTrendingChallenges = async () => {
    try {
      const response = await axios.get(`/api/challenges/trending?filter=${filter}`);
      setChallenges(response.data);
    } catch (error) {
      console.error('Error fetching trending challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading trending challenges...</div>;
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '32px' }}>
        <h1>
          <Flame size={32} style={{ marginRight: '12px', color: '#ff6b6b' }} />
          Trending Challenges
        </h1>
        <p style={{ color: '#6c757d', fontSize: '18px' }}>
          Discover the hottest challenges taking the platform by storm
        </p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Categories
          </button>
          <button 
            className={`btn ${filter === 'dance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('dance')}
          >
            Dance
          </button>
          <button 
            className={`btn ${filter === 'fitness' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('fitness')}
          >
            Fitness
          </button>
          <button 
            className={`btn ${filter === 'comedy' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('comedy')}
          >
            Comedy
          </button>
          <button 
            className={`btn ${filter === 'lifestyle' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('lifestyle')}
          >
            Lifestyle
          </button>
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <TrendingUp size={64} style={{ color: '#6c757d', marginBottom: '16px' }} />
          <h3 style={{ color: '#6c757d' }}>No Trending Challenges</h3>
          <p style={{ color: '#6c757d' }}>
            Be the first to create a viral challenge!
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {challenges.map((challenge, index) => (
            <div key={challenge.id} className="challenge-card">
              <div className="challenge-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h3>{challenge.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Flame size={16} />
                    <span>#{index + 1}</span>
                  </div>
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  by @{challenge.creator_username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                  <span className={`badge badge-${challenge.price_tier}`}>
                    {challenge.price_tier === 'free' ? 'Free' : `$${challenge.price}`}
                  </span>
                  <span style={{ fontSize: '12px' }}>
                    {challenge.category}
                  </span>
                </div>
              </div>
              
              <div className="challenge-body">
                <p style={{ marginBottom: '16px', color: '#6c757d', lineHeight: '1.5' }}>
                  {challenge.description.length > 100 
                    ? `${challenge.description.substring(0, 100)}...`
                    : challenge.description
                  }
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6c757d' }}>
                    <Users size={16} />
                    <span>{challenge.participant_count} participants</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6c757d' }}>
                    <Eye size={16} />
                    <span>{challenge.view_count} views</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: '#28a745', fontWeight: 'bold', fontSize: '14px' }}>
                    Viral Score: {challenge.viral_score}
                  </div>
                  <Link 
                    to={`/challenge/${challenge.id}`} 
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '14px' }}
                  >
                    View Challenge
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

export default TrendingChallenges;
