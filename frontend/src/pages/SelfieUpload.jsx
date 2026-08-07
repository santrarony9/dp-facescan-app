import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, Sparkles, XCircle, ArrowRight, User, Phone, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { selfieApi, authApi } from '../api/api';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Navbar from '../components/Navbar';

const SelfieUpload = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  
  // Custom Flow States
  const [step, setStep] = useState('camera'); // 'camera' or 'registration'
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, complete, error
  
  // Registration States
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  
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

  const handleConfirmPhoto = () => {
    if (image && file) {
      setStep('registration');
    }
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    if (!fullName || !mobile || mobile.length < 10) {
      alert("Please enter a valid Name and Mobile Number.");
      return;
    }

    setStatus('uploading');
    
    try {
      // 1. Silent Local Authentication
      const authRes = await authApi.verifyOtp(mobile, '112233', fullName, '');
      const token = authRes.data.token;
      
      // Store credentials locally
      localStorage.setItem('token', token);
      localStorage.setItem('role', 'guest');
      localStorage.setItem('userName', fullName);
      localStorage.setItem('userMobile', mobile);

      // 2. Upload Image payload
      const { data } = await selfieApi.getUploadUrl('selfie', slug || 'default');
      
      await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      // 3. Process Neural Match
      await selfieApi.processSelfie(data.fileUrl, null, slug || 'default');
      setStatus('processing');

      // 4. Poll for match completion
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
              colors: ['#c5a059', '#e5be75', '#ffffff']
            });
            
            setTimeout(() => {
               navigate(`/${slug}/gallery`);
            }, 2000);
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 2500);

    } catch (error) {
      console.error('Onboarding failed', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-24 pb-12 relative overflow-hidden bg-[#050505] font-outfit">
      <Navbar />

      {/* Ambient Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] bg-[#c5a059]/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-md relative z-10 text-center my-auto"
      >
        <div className="mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-full text-[#c5a059] text-xs font-black uppercase tracking-[0.25em] mb-3">
            <ScanLine size={12} />
            BIOMETRIC AI ENGINE
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight">
            {step === 'camera' ? (
              <>Face <span className="text-[#c5a059]">Scan</span></>
            ) : (
              <>Guest <span className="text-[#c5a059]">Details</span></>
            )}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-[0.2em] font-bold mt-1">
            {step === 'camera' ? 'Capture photo to unlock your album' : 'Enter your name to reveal photos'}
          </p>
        </div>
        
        {/* Dynamic Viewfinder Frame */}
        <div className={`relative mx-auto mb-6 sm:mb-8 transition-all duration-500 ${step === 'camera' ? 'w-48 h-48 sm:w-56 sm:h-56' : 'w-28 h-28 opacity-80'}`}>
          
          {/* Animated Gold Scanner Ring */}
          <div className="absolute inset-0 border border-[#c5a059]/30 rounded-full" />
          {step === 'camera' && (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 border-t-2 border-[#c5a059]/60 rounded-full border-dashed"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 border-l-2 border-[#c5a059]/20 rounded-full"
              />
            </>
          )}
          
          <div className="absolute inset-3 overflow-hidden rounded-full bg-zinc-950 flex items-center justify-center border border-[#c5a059]/40 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] relative group">
            <AnimatePresence mode="wait">
              {image ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <img src={image} alt="Selfie" className="w-full h-full object-cover" />
                  {status === 'processing' && (
                    <div className="absolute inset-0 bg-[#c5a059]/20 animate-pulse flex items-center justify-center">
                      <div className="w-full h-1 bg-[#c5a059] shadow-[0_0_15px_#c5a059] animate-scan" />
                    </div>
                  )}
                  {status === 'complete' && (
                    <div className="absolute inset-0 bg-[#c5a059]/20 flex items-center justify-center backdrop-blur-xs">
                       <CheckCircle2 className="w-12 h-12 text-[#c5a059] drop-shadow-[0_0_15px_rgba(197,160,89,1)]" />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2 p-4"
                >
                  <Camera size={44} className="text-[#c5a059]/60 group-hover:text-[#c5a059] transition-colors duration-300" />
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Tap to Scan</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Action Controls */}
        <div className="min-h-[120px] flex flex-col justify-center">
          
          {/* STEP 1: CAMERA SHUTTER */}
          {step === 'camera' && status === 'idle' && (
            <div className="space-y-3">
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
                className="btn-primary w-full py-3.5 bg-transparent border border-[#c5a059]/60 text-[#c5a059] hover:bg-[#c5a059]/10 shadow-none text-xs"
              >
                {image ? 'Retake Photo' : 'Open Camera'}
                <Camera size={16} />
              </button>
              
              {image && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleConfirmPhoto}
                  className="btn-primary w-full py-4 text-xs shadow-[0_10px_25px_rgba(197,160,89,0.35)]"
                >
                  Confirm & Next
                  <ArrowRight size={16} />
                </motion.button>
              )}
            </div>
          )}

          {/* STEP 2: REGISTRATION FORM */}
          {step === 'registration' && status === 'idle' && (
            <form onSubmit={handleSubmitRegistration} className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5a059]/60" />
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    className="input-field pl-11 py-3 text-xs bg-white/5 border-white/10 focus:border-[#c5a059]" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5a059]/60" />
                  <input 
                    type="tel" 
                    placeholder="10-digit number" 
                    className="input-field pl-11 py-3 text-xs bg-white/5 border-white/10 focus:border-[#c5a059]" 
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="btn-primary w-full py-4 text-xs mt-4 shadow-[0_10px_25px_rgba(197,160,89,0.35)]"
              >
                Scan Database & Reveal Gallery
                <Sparkles size={16} />
              </button>
            </form>
          )}

          {/* UPLOAD & PROCESSING STATE */}
          {status === 'uploading' && (
            <div className="text-center py-4">
              <Loader2 className="w-10 h-10 text-[#c5a059] animate-spin mx-auto mb-3" />
              <p className="text-[#c5a059] uppercase tracking-widest text-xs font-bold">Uploading Biometric Payload...</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center py-4">
              <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mb-4 border border-white/5">
                <motion.div 
                  className="h-full bg-[#c5a059]"
                  animate={{ 
                    x: ['-100%', '100%'],
                    width: ['40%', '40%']
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <p className="text-white uppercase tracking-[0.2em] text-xs font-black italic">Matching Neural Embeddings...</p>
              <p className="text-zinc-500 text-xs mt-1 font-medium">Scanning photos in event gallery</p>
            </div>
          )}

          {status === 'complete' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-3"
            >
              <h3 className="text-xl font-black text-white mb-1 uppercase italic">Face Matched!</h3>
              <p className="text-zinc-400 text-sm uppercase tracking-widest">Opening personal gallery...</p>
            </motion.div>
          )}

          {status === 'error' && (
            <div className="text-center py-3">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <p className="text-white text-xs font-bold mb-3">Processing Error</p>
              <button 
                onClick={() => {
                   setStatus('idle');
                   setStep('camera');
                }} 
                className="text-[#c5a059] text-sm font-black uppercase tracking-widest hover:underline"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SelfieUpload;
