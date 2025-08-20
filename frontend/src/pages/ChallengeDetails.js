import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Users, DollarSign, Share2, Heart, MessageCircle } from 'lucide-react';
import axios from 'axios';

const ChallengeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [participating, setParticipating] = useState(false);

  useEffect(() => {
    fetchChallengeDetails();
  }, [id]);

  const fetchChallengeDetails = async () => {
    try {
      const [challengeRes, participantsRes] = await Promise.all([
        axios.get(`/api/challenges/${id}`),
        axios.get(`/api/challenges/${id}/participants`)
      ]);
      
      setChallenge(challengeRes.data);
      setParticipants(participantsRes.data);
    } catch (error) {
      console.error('Error fetching challenge details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await axios.post(`/api/challenges/${id}/purchase`);
      fetchChallengeDetails(); // Refresh data
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setPurchasing(false);
    }
  };

  const handleParticipate = async () => {
    setParticipating(true);
    try {
      await axios.post(`/api/challenges/${id}/participate`);
      fetchChallengeDetails(); // Refresh data
    } catch (error) {
      console.error('Participation failed:', error);
    } finally {
      setParticipating(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading challenge...</div>;
  }

  if (!challenge) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <h3>Challenge not found</h3>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <button 
        onClick={() => navigate(-1)} 
        className="btn btn-secondary"
        style={{ marginBottom: '24px' }}
      >
        <ArrowLeft size={20} style={{ marginRight: '8px' }} />
        Back
      </button>

      <div className="grid grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div className="challenge-header">
            <h1>{challenge.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
              <span className={`badge badge-${challenge.price_tier}`}>
                {challenge.price_tier === 'free' ? 'Free' : `$${challenge.price}`}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={16} />
                {participants.length} participants
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={16} />
                ${challenge.total_revenue?.toFixed(2) || '0.00'} earned
              </span>
            </div>
          </div>

          <div className="challenge-body">
            <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
              {challenge.description}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <strong>Category:</strong> {challenge.category}
              <br />
              <strong>Created by:</strong> @{challenge.creator_username}
              <br />
              <strong>Created:</strong> {new Date(challenge.created_at).toLocaleDateString()}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {!challenge.has_purchased && challenge.price_tier !== 'free' && (
                <button 
                  className="btn btn-primary"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? 'Purchasing...' : `Purchase for $${challenge.price}`}
                </button>
              )}
              
              {(challenge.has_purchased || challenge.price_tier === 'free') && !challenge.is_participant && (
                <button 
                  className="btn btn-primary"
                  onClick={handleParticipate}
                  disabled={participating}
                >
                  {participating ? 'Joining...' : 'Join Challenge'}
                </button>
              )}

              <button className="btn btn-secondary">
                <Share2 size={18} style={{ marginRight: '8px' }} />
                Share
              </button>
              
              <button className="btn btn-secondary">
                <Heart size={18} style={{ marginRight: '8px' }} />
                Like
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          {challenge.video_url ? (
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <video 
                controls 
                style={{ width: '100%', borderRadius: '8px' }}
                poster={challenge.thumbnail_url}
              >
                <source src={challenge.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div style={{ 
              background: '#f8f9fa', 
              height: '200px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <Play size={48} style={{ color: '#6c757d' }} />
            </div>
          )}
          
          <h3>Challenge Tree</h3>
          <div className="challenge-tree">
            <div className="tree-node">
              <strong>@{challenge.creator_username}</strong> (Creator)
              <span style={{ marginLeft: 'auto', color: '#28a745' }}>
                60% revenue share
              </span>
            </div>
            {participants.slice(0, 5).map((participant, index) => (
              <div key={participant.id} className="tree-node">
                @{participant.username} (Participant #{index + 1})
                <span style={{ marginLeft: 'auto', color: '#6c757d' }}>
                  {Math.max(0, 25 - index * 3)}% share
                </span>
              </div>
            ))}
            {participants.length > 5 && (
              <div style={{ textAlign: 'center', color: '#6c757d', marginTop: '8px' }}>
                +{participants.length - 5} more participants
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>
          <MessageCircle size={24} style={{ marginRight: '8px' }} />
          Participants ({participants.length})
        </h3>
        
        {participants.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6c757d', padding: '32px' }}>
            No participants yet. Be the first to join this challenge!
          </p>
        ) : (
          <div className="grid grid-3">
            {participants.map((participant) => (
              <div key={participant.id} className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    marginRight: '12px'
                  }}>
                    {participant.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong>@{participant.username}</strong>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      Joined {new Date(participant.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {participant.submission_video_url && (
                  <video 
                    controls 
                    style={{ width: '100%', borderRadius: '6px', marginTop: '8px' }}
                  >
                    <source src={participant.submission_video_url} type="video/mp4" />
                  </video>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDetails;
