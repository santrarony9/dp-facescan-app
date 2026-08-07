import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SelfieUpload from './pages/SelfieUpload';
import GalleryPage from './pages/GalleryPage';
import AdminPanel from './pages/AdminPanel';
import MerchandisePage from './pages/MerchandisePage';
import AlbumProofingPage from './pages/AlbumProofingPage';
import './index.css';

import ProtectedScanRoute from './components/ProtectedScanRoute';

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Full Home Gallery Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Public Entry Point - Camera First */}
        <Route path="/:slug" element={<SelfieUpload />} />

        {/* Protected Album Routes */}
        <Route 
          path="/:slug/gallery" 
          element={
            <ProtectedScanRoute>
              <GalleryPage />
            </ProtectedScanRoute>
          } 
        />
        <Route 
          path="/:slug/gallery/proofing" 
          element={
            <ProtectedScanRoute>
              <AlbumProofingPage />
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
        <Route path="*" element={<Navigate to="/" />} />
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
