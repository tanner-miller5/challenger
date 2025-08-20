
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Eye, Users, DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState({
    totalChallenges: 0,
    totalParticipants: 0,
    totalRevenue: 0,
    trendingCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [challengesRes, statsRes] = await Promise.all([
        axios.get('/api/challenges/my'),
        axios.get('/api/challenges/stats')
      ]);
      
      setChallenges(challengesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '32px' }}>
        <h1>Welcome back, {user?.username}!</h1>
        <p style={{ color: '#6c757d', fontSize: '18px' }}>
          Ready to create amazing challenges and earn rewards?
        </p>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3>My Challenges</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
                {stats.totalChallenges}
              </p>
              <p style={{ opacity: 0.9 }}>Challenges Created</p>
            </div>
            <Eye size={48} style={{ opacity: 0.3 }} />
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3>Total Participants</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
                {stats.totalParticipants}
              </p>
              <p style={{ opacity: 0.9 }}>People Engaged</p>
            </div>
            <Users size={48} style={{ opacity: 0.3 }} />
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)', color: '#333' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3>Total Revenue</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
                ${stats.totalRevenue.toFixed(2)}
              </p>
              <p style={{ opacity: 0.8 }}>Earnings</p>
            </div>
            <DollarSign size={48} style={{ opacity: 0.3 }} />
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3>Trending</h3>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '8px 0' }}>
                {stats.trendingCount}
              </p>
              <p style={{ opacity: 0.9 }}>Hot Challenges</p>
            </div>
            <TrendingUp size={48} style={{ opacity: 0.3 }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Your Challenges</h2>
        <Link to="/create-challenge" className="btn btn-primary">
          <Plus size={20} style={{ marginRight: '8px' }} />
          Create Challenge
        </Link>
      </div>

      {challenges.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <h3 style={{ color: '#6c757d', marginBottom: '16px' }}>No Challenges Yet</h3>
          <p style={{ color: '#6c757d', marginBottom: '24px' }}>
            Create your first challenge to get started and begin earning rewards!
          </p>
          <Link to="/create-challenge" className="btn btn-primary">
            Create Your First Challenge
          </Link>
        </div>
      ) : (
        <div className="grid grid-3">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="challenge-card">
              <div className="challenge-header">
                <h3>{challenge.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span className={`badge badge-${challenge.price_tier}`}>
                    {challenge.price_tier === 'free' ? 'Free' : `$${challenge.price}`}
                  </span>
                  <span>{challenge.participant_count} participants</span>
                </div>
              </div>
              <div className="challenge-body">
                <p style={{ marginBottom: '16px', color: '#6c757d' }}>
                  {challenge.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                    Revenue: ${challenge.total_revenue?.toFixed(2) || '0.00'}
                  </span>
                  <Link 
                    to={`/challenge/${challenge.id}`} 
                    className="btn btn-secondary"
                    style={{ textDecoration: 'none' }}
                  >
                    View Details
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

export default Dashboard;
