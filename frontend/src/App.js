import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateChallenge from './pages/CreateChallenge';
import ChallengeDetails from './pages/ChallengeDetails';
import Profile from './pages/Profile';
import TrendingChallenges from './pages/TrendingChallenges';
import PremiumChallenges from './pages/PremiumChallenges';
import { AuthProvider, useAuth } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/create-challenge" element={user ? <CreateChallenge /> : <Navigate to="/login" />} />
        <Route path="/challenge/:id" element={user ? <ChallengeDetails /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/trending" element={user ? <TrendingChallenges /> : <Navigate to="/login" />} />
        <Route path="/premium" element={user ? <PremiumChallenges /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;
