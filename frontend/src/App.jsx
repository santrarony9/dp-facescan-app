import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LoginPage from './pages/LoginPage';
import SelfieUpload from './pages/SelfieUpload';
import GalleryPage from './pages/GalleryPage';
import AdminPanel from './pages/AdminPanel';
import MerchandisePage from './pages/MerchandisePage';
import './index.css';

// ... Protected Route Component code ...

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
        <Route 
          path="/merchandise" 
          element={
            <ProtectedScanRoute>
              <MerchandisePage />
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


