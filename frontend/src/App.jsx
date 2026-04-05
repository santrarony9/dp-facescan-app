import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SelfieUpload from './pages/SelfieUpload';
import GalleryPage from './pages/GalleryPage';
import AdminPanel from './pages/AdminPanel';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/:slug/scan" element={<SelfieUpload />} />
          <Route path="/:slug/gallery" element={<GalleryPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
