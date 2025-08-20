import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Upload, Tag, DollarSign } from 'lucide-react';
import axios from 'axios';

const CreateChallenge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priceTier: 'free',
    price: 0,
    taggedUsers: '',
    videoFile: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      videoFile: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const challengeData = new FormData();
      challengeData.append('title', formData.title);
      challengeData.append('description', formData.description);
      challengeData.append('category', formData.category);
      challengeData.append('price_tier', formData.priceTier);
      challengeData.append('price', formData.price);
      challengeData.append('tagged_users', formData.taggedUsers);
      
      if (formData.videoFile) {
        challengeData.append('video', formData.videoFile);
      }

      const response = await axios.post('/api/challenges', challengeData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate(`/challenge/${response.data.id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-secondary"
          style={{ marginBottom: '16px' }}
        >
          <ArrowLeft size={20} style={{ marginRight: '8px' }} />
          Back
        </button>
        <h1>Create New Challenge</h1>
        <p style={{ color: '#6c757d' }}>
          Set up your challenge and start building your community
        </p>
      </div>

      <div className="card">
        {error && (
          <div style={{ 
            background: '#f8d7da', 
            color: '#721c24', 
            padding: '12px', 
            borderRadius: '6px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Challenge Title *</label>
              <input
                type="text"
                name="title"
                className="form-control"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter a catchy challenge title"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                <option value="dance">Dance</option>
                <option value="fitness">Fitness</option>
                <option value="comedy">Comedy</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              className="form-control"
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your challenge in detail..."
              required
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label>
                <DollarSign size={16} style={{ marginRight: '4px' }} />
                Price Tier *
              </label>
              <select
                name="priceTier"
                className="form-control"
                value={formData.priceTier}
                onChange={handleInputChange}
                required
              >
                <option value="free">Free</option>
                <option value="premium">Premium ($0.99 - $2.99)</option>
                <option value="exclusive">Exclusive ($5.00 - $9.99)</option>
              </select>
            </div>

            {formData.priceTier !== 'free' && (
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  name="price"
                  className="form-control"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0.99"
                  max={formData.priceTier === 'premium' ? '2.99' : '9.99'}
                  step="0.01"
                  required={formData.priceTier !== 'free'}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>
              <Tag size={16} style={{ marginRight: '4px' }} />
              Tag Users (optional)
            </label>
            <input
              type="text"
              name="taggedUsers"
              className="form-control"
              value={formData.taggedUsers}
              onChange={handleInputChange}
              placeholder="Enter usernames separated by commas (e.g. user1, user2, user3)"
            />
            <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
              Tagged users will receive invitations to participate in your challenge
            </small>
          </div>

          <div className="form-group">
            <label>
              <Upload size={16} style={{ marginRight: '4px' }} />
              Challenge Video (optional)
            </label>
            <input
              type="file"
              name="video"
              className="form-control"
              onChange={handleFileChange}
              accept="video/*"
            />
            <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
              Upload a demonstration video to show participants what to do
            </small>
          </div>

          <div className="revenue-info">
            <h4 style={{ marginBottom: '12px' }}>Revenue Sharing</h4>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>You receive 60% of all viewing fees</li>
              <li>Early participants get 25% distributed based on join order</li>
              <li>Platform fee: 15%</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '140px' }}
            >
              {loading ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallenge;
