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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
      {/* Dynamic Gold Blobs */}
      <div className="bg-blob w-[500px] h-[500px] bg-[#D4AF37] rounded-full top-1/2 left-0 -translate-y-1/2 -translate-x-1/3"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-outfit font-bold mb-2 tracking-tight text-white">Find Your Photos</h2>
          <p className="text-text-secondary text-sm">Upload a selfie to unlock your gallery</p>
        </div>
        
        <div className="aspect-square w-full max-w-[280px] mx-auto mb-8 relative group">
          {/* Outer glowing ring */}
          <div className="absolute inset-0 border-2 border-dashed border-[#D4AF37]/40 rounded-full group-hover:border-[#D4AF37] transition-all duration-500 animate-spin-slow shadow-[0_0_30px_rgba(212,175,55,0.15)]"></div>
          
          <div className="absolute inset-3 overflow-hidden rounded-full bg-[#111] flex items-center justify-center border border-[#D4AF37]/20 shadow-inner relative">
            {image ? (
              <>
                <img src={image} alt="Selfie" className="w-full h-full object-cover" />
                {status === 'processing' && (
                  <div className="absolute inset-0 animate-scan"></div>
                )}
              </>
            ) : (
              <Camera size={48} className="text-[#D4AF37] opacity-60" />
            )}
          </div>
        </div>

        {status === 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
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
              className="w-full py-4 rounded-xl border border-[#D4AF37]/50 text-[#D4AF37] font-bold hover:bg-[#D4AF37]/10 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.1)]"
            >
              Take a Selfie
              <Camera size={20} />
            </button>
            {image && (
              <button 
                onClick={handleUpload}
                className="btn-primary w-full shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                Scan My Face
                <Upload size={20} />
              </button>
            )}
          </motion.div>
        )}

        {status === 'uploading' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4 drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
            <p className="text-lg font-outfit text-white font-medium tracking-wide">Secure Uploading...</p>
          </motion.div>
        )}

        {status === 'processing' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="w-full h-1 bg-[#222] rounded-full overflow-hidden mb-5">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FDE047]"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'linear' }}
              />
            </div>
            <p className="text-lg font-outfit font-medium text-white">Authenticating Profile...</p>
            <p className="text-sm text-[#D4AF37]/70 mt-1">AI Face Match in progress</p>
          </motion.div>
        )}

        {status === 'complete' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
            className="text-center py-6"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
               <CheckCircle2 className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </motion.div>
            <h3 className="text-2xl font-outfit font-bold mb-2 text-white">Access Granted</h3>
            <p className="mb-8 text-text-secondary">Your high-resolution photos are ready.</p>
            <button className="btn-primary w-full shadow-[0_0_20px_rgba(212,175,55,0.2)]" onClick={() => navigate(`/${slug}/gallery`)}>
              View VIP Gallery
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SelfieUpload;
