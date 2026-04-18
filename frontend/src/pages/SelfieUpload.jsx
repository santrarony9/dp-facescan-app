import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { selfieApi, authApi } from '../api/api';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

const SelfieUpload = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, complete, error
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
      const { data } = await selfieApi.getUploadUrl('selfie', slug || 'default');
      
      await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      await selfieApi.processSelfie(data.fileUrl, null, slug || 'default');
      setStatus('processing');

      const poll = setInterval(async () => {
        try {
          const res = await authApi.getStatus();
          if (res.data.isProcessed) {
            clearInterval(poll);
            setStatus('complete');
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#D4AF37', '#FDE047', '#FFFFFF']
            });
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 3000);

    } catch (error) {
      console.error('Upload failed', error);
      setStatus('error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]"
    >
      {/* Background Ambience */}
      <div className="bg-blob w-[600px] h-[600px] bg-primary/10 top-1/2 left-0 -translate-y-1/2 -translate-x-1/2" />
      <div className="bg-blob w-[500px] h-[500px] bg-primary-bright/5 bottom-0 right-0 translate-x-1/4 translate-y-1/4" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div
             initial={{ y: -20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
          >
            <h2 className="text-4xl font-outfit font-extrabold mb-3 tracking-tight text-white uppercase italic">
              Face <span className="text-primary">Scanner</span>
            </h2>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold">Biometric Auth Module</p>
          </motion.div>
        </div>
        
        <div className="relative aspect-square w-full max-w-[320px] mx-auto mb-10">
          {/* Futuristic Scanning Ring */}
          <div className="absolute inset-0 border-[1px] border-primary/20 rounded-full" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-10px] border-t-2 border-primary/40 rounded-full border-dashed"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-20px] border-l-2 border-primary/10 rounded-full"
          />
          
          <div className="absolute inset-4 overflow-hidden rounded-full bg-zinc-900/50 flex items-center justify-center border border-primary/30 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] relative group">
            <AnimatePresence mode="wait">
              {image ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <img src={image} alt="Selfie" className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]" />
                  {status === 'processing' && (
                    <div className="absolute inset-0 animate-scan" />
                  )}
                  {status === 'complete' && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                       <CheckCircle2 className="w-16 h-16 text-primary drop-shadow-[0_0_15px_rgba(212,175,55,1)]" />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <Camera size={64} className="text-primary/40 group-hover:text-primary transition-colors duration-500" />
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em]">Ready for input</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="min-h-[140px] flex flex-col justify-center">
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
                className="btn-primary w-full bg-transparent border-2 border-primary/50 text-primary hover:bg-primary/10 shadow-none group"
              >
                Capture Identity
                <Camera size={20} className="group-hover:rotate-12 transition-transform" />
              </button>
              
              {image && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleUpload}
                  className="btn-primary w-full"
                >
                  Initialize Scan
                  <Sparkles size={20} />
                </motion.button>
              )}
            </motion.div>
          )}

          {status === 'uploading' && (
            <div className="text-center py-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-primary font-outfit uppercase tracking-widest text-sm font-bold">Encrypting Data...</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center py-4">
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mb-6">
                <motion.div 
                  className="h-full bg-gradient-to-r from-primary-dim via-primary-bright to-primary-dim"
                  animate={{ 
                    x: ['-100%', '100%'],
                    width: ['30%', '30%']
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <p className="text-white font-outfit uppercase tracking-[0.2em] text-sm font-bold italic">Processing Neural Match...</p>
              <p className="text-zinc-500 text-[10px] mt-2 font-medium">Matching face against database</p>
            </div>
          )}

          {status === 'complete' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <h3 className="text-2xl font-outfit font-extrabold text-white mb-4 uppercase italic">Identity Verified</h3>
              <button 
                className="btn-primary w-full shadow-[0_0_30px_rgba(212,175,55,0.4)]" 
                onClick={() => navigate(`/${slug}/gallery`)}
              >
                Access VIP Gallery
              </button>
            </motion.div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-white font-bold mb-4">Authentication Failed</p>
              <button onClick={() => setStatus('idle')} className="text-primary text-sm font-bold uppercase tracking-widest hover:underline">
                Try Again
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SelfieUpload;
