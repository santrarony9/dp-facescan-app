import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import './index.css';

import ProtectedScanRoute from './components/ProtectedScanRoute';

// Lazy loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SelfieUpload = lazy(() => import('./pages/SelfieUpload'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const MerchandisePage = lazy(() => import('./pages/MerchandisePage'));
const AlbumProofingPage = lazy(() => import('./pages/AlbumProofingPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-amber-500 animate-spin" />
      <p className="text-slate-400 text-sm font-medium tracking-wide animate-pulse">Loading...</p>
    </div>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Full Home Gallery Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Public Entry Point - Camera First */}
          <Route path="/:slug" element={<SelfieUpload />} />

          {/* Protected Album Routes */}
          <Route path="/:slug/gallery" element={<GalleryPage />} />
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
      </Suspense>
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
