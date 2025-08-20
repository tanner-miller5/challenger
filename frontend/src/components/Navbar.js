import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, Settings, Trophy, TrendingUp, Crown } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          <Trophy style={{ marginRight: '8px', display: 'inline' }} />
          Challenger
        </Link>
        
        <div className="navbar-nav">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/trending" className="nav-link">
            <TrendingUp size={18} style={{ marginRight: '4px' }} />
            Trending
          </Link>
          <Link to="/premium" className="nav-link">
            <Crown size={18} style={{ marginRight: '4px' }} />
            Premium
          </Link>
          <Link to="/create-challenge" className="nav-link">
            Create Challenge
          </Link>
          
          <div className="user-menu">
            <div 
              className="user-avatar"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            
            {showDropdown && (
              <div className="dropdown-menu">
                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <User size={16} style={{ marginRight: '8px' }} />
                  Profile
                </Link>
                <Link 
                  to="/settings" 
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings size={16} style={{ marginRight: '8px' }} />
                  Settings
                </Link>
                <button 
                  className="dropdown-item" 
                  onClick={handleLogout}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
                >
                  <LogOut size={16} style={{ marginRight: '8px' }} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
