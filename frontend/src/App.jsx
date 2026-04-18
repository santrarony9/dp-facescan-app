import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LoginPage from './pages/LoginPage';
import SelfieUpload from './pages/SelfieUpload';
import GalleryPage from './pages/GalleryPage';
import AdminPanel from './pages/AdminPanel';
import './index.css';

// Protected Route Component
const ProtectedScanRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    // Save the intended path to redirect back after login
    // Use encodeURIComponent to safely pass the path
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Slugs */}
        <Route 
          path="/:slug/scan" 
          element={
            <ProtectedScanRoute>
              <SelfieUpload />
            </ProtectedScanRoute>
          } 
        />
        <Route 
          path="/:slug/gallery" 
          element={
            <ProtectedScanRoute>
              <GalleryPage />
            </ProtectedScanRoute>
          } 
        />
        
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;


