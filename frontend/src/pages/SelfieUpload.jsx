import React, { useRef, useState } from 'react';
import { Camera, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { selfieApi, authApi } from '../api/api';
import { useParams, useNavigate } from 'react-router-dom';

const SelfieUpload = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); 
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    
    try {
      // 1. Get signed URL (using a placeholder eventId for now, should be from slug)
      // For now, let's assume we find the event by slug first or pass slug to api
      const { data } = await selfieApi.getUploadUrl('selfie', slug || 'default');
      
      // 2. Upload to S3
      await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      // 3. Notify backend
      await selfieApi.processSelfie(data.fileUrl, null, slug || 'default');
      setStatus('processing');

      // 4. Poll for status
      const poll = setInterval(async () => {
        try {
          const res = await authApi.getStatus();
          if (res.data.isProcessed) {
            clearInterval(poll);
            setStatus('complete');
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 3000);

    } catch (error) {
      alert('Upload failed. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Find Your Photos</h2>
        
        <div className="aspect-square w-full max-w-[300px] mx-auto mb-8 relative group">
          <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-full group-hover:border-primary/60 transition-colors animate-spin-slow"></div>
          <div className="absolute inset-4 overflow-hidden rounded-full bg-slate-800 flex items-center justify-center">
            {image ? (
              <img src={image} alt="Selfie" className="w-full h-full object-cover" />
            ) : (
              <Camera size={48} className="text-text-secondary opacity-50" />
            )}
          </div>
        </div>

        {status === 'idle' && (
          <div className="space-y-4">
            <input 
              type="file" 
              accept="image/*" 
              capture="user" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              className="btn-primary w-full justify-center bg-transparent border-2 border-primary text-primary"
            >
              Take a Selfie
              <Camera size={18} />
            </button>
            {image && (
              <button 
                onClick={handleUpload}
                className="btn-primary w-full justify-center"
              >
                Scan My Face
                <Upload size={18} />
              </button>
            )}
          </div>
        )}

        {status === 'uploading' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Uploading selfie...</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="text-center py-8">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3 }}
              />
            </div>
            <p className="text-lg font-medium">Comparing with event photos...</p>
            <p className="text-sm text-text-secondary">This usually takes a few seconds</p>
          </div>
        )}

        {status === 'complete' && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-xl font-bold mb-2">Success!</h3>
            <p className="mb-6">We found 12 photos of you.</p>
            <button className="btn-primary" onClick={() => window.location.href='/gallery'}>
              View My Gallery
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SelfieUpload;
