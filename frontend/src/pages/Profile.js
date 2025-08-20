import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Trophy, DollarSign, Calendar, Settings } from 'lucide-react';
import axios from 'axios';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [profileRes, statsRes, challengesRes] = await Promise.all([
        axios.get('/api/profile'),
        axios.get('/api/profile/stats'),
        axios.get('/api/profile/challenges')
      ]);
      
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setChallenges(challengesRes.data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading profile...</div>;
  }

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: '8px' }}>@{user?.username}</h2>
            <p style={{ color: '#6c757d', marginBottom: '8px' }}>{user?.email}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6c757d' }}>
              <Calendar size={16} />
              <span>Joined {new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <button className="btn btn-secondary">
            <Settings size={18} style={{ marginRight: '8px' }} />
            Edit Profile
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-2" style={{ marginBottom: '24px' }}>
          <div className="card" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3>Total Earnings</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
                  ${stats.total_earnings.toFixed(2)}
                </p>
                <p style={{ opacity: 0.9 }}>Lifetime Revenue</p>
              </div>
              <DollarSign size={48} style={{ opacity: 0.3 }} />
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3>Challenges Created</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
                  {stats.challenges_created}
                </p>
                <p style={{ opacity: 0.9 }}>Total Challenges</p>
              </div>
              <Trophy size={48} style={{ opacity: 0.3 }} />
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3>Participation Rate</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
                  {stats.participation_rate}%
                </p>
                <p style={{ opacity: 0.9 }}>Challenge Success</p>
              </div>
              <User size={48} style={{ opacity: 0.3 }} />
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)', color: '#333' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3>Rank</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
                  #{stats.global_rank}
                </p>
                <p style={{ opacity: 0.8 }}>Global Leaderboard</p>
              </div>
              <Trophy size={48} style={{ opacity: 0.3 }} />
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ borderBottom: '2px solid #dee2e6', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <button 
              className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('overview')}
              style={{ borderRadius: '0', borderBottom: activeTab === 'overview' ? '2px solid #667eea' : 'none' }}
            >
              Overview
            </button>
            <button 
              className={`btn ${activeTab === 'challenges' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('challenges')}
              style={{ borderRadius: '0', borderBottom: activeTab === 'challenges' ? '2px solid #667eea' : 'none' }}
            >
              My Challenges
            </button>
            <button 
              className={`btn ${activeTab === 'participated' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('participated')}
              style={{ borderRadius: '0', borderBottom: activeTab === 'participated' ? '2px solid #667eea' : 'none' }}
            >
              Participated
            </button>
          </div>
        </div>

        {activeTab === 'overview' && stats && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Activity Overview</h3>
            <div className="grid grid-2">
              <div>
                <h4>Recent Achievements</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid #dee2e6' }}>
                    🏆 Created your first viral challenge
                  </li>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid #dee2e6' }}>
                    💰 Earned your first $10 in revenue
                  </li>
                  <li style={{ padding: '8px 0', borderBottom: '1px solid #dee2e6' }}>
                    👥 Gained 25 followers
                  </li>
                </ul>
              </div>
              <div>
                <h4>Revenue Breakdown</h4>
                <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Creator Revenue:</strong> ${(stats.total_earnings * 0.6).toFixed(2)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Participation Bonus:</strong> ${(stats.total_earnings * 0.25).toFixed(2)}
                  </div>
                  <div>
                    <strong>Referral Bonus:</strong> ${(stats.total_earnings * 0.15).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Challenges You Created</h3>
            {challenges.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6c757d', padding: '32px' }}>
                You haven't created any challenges yet.
              </p>
            ) : (
              <div className="grid grid-3">
                {challenges.filter(c => c.is_creator).map((challenge) => (
                  <div key={challenge.id} className="challenge-card" style={{ margin: 0 }}>
                    <div className="challenge-header">
                      <h4>{challenge.title}</h4>
                      <span className={`badge badge-${challenge.price_tier}`}>
                        {challenge.price_tier === 'free' ? 'Free' : `$${challenge.price}`}
                      </span>
                    </div>
                    <div className="challenge-body">
                      <p>{challenge.participant_count} participants</p>
                      <p style={{ color: '#28a745', fontWeight: 'bold' }}>
                        ${challenge.total_revenue?.toFixed(2) || '0.00'} earned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'participated' && (
          <div>
            <h3 style={{ marginBottom: '20px' }}>Challenges You Joined</h3>
            {challenges.filter(c => !c.is_creator).length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6c757d', padding: '32px' }}>
                You haven't participated in any challenges yet.
              </p>
            ) : (
              <div className="grid grid-3">
                {challenges.filter(c => !c.is_creator).map((challenge) => (
                  <div key={challenge.id} className="challenge-card" style={{ margin: 0 }}>
                    <div className="challenge-header">
                      <h4>{challenge.title}</h4>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        by @{challenge.creator_username}
                      </div>
                    </div>
                    <div className="challenge-body">
                      <p>Joined: {new Date(challenge.joined_at).toLocaleDateString()}</p>
                      <p style={{ color: '#28a745', fontWeight: 'bold' }}>
                        Earned: ${challenge.participant_earnings?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
