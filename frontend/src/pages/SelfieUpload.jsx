import React, { useRef, useState } from 'react';
import { Camera, CheckCircle2, Loader2, Sparkles, XCircle, ArrowRight, User, Phone, ScanLine, KeyRound } from 'lucide-react';
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
      const authRes = await authApi.guestRegister(mobile, fullName, '');
      const token = authRes.data.token;
      
      // Store credentials locally
      localStorage.setItem('token', token);
      localStorage.setItem('role', 'guest');
      localStorage.setItem('userName', fullName);
      localStorage.setItem('userMobile', mobile);

      // 2. Upload Image payload
      const { data } = await selfieApi.getUploadUrl('selfie', slug || 'default', file.type);
      
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
              colors: ['#2563eb', '#60a5fa', '#ffffff'] // blue theme confetti
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-24 pb-12 relative overflow-hidden bg-slate-50 font-outfit text-slate-900">
      <Navbar />

      {/* Clean Background Gradient */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-50 to-slate-50 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10 text-center my-auto bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm"
      >
        <div className="mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 border border-blue-200 rounded-full text-blue-700 text-xs font-bold uppercase tracking-widest mb-4">
            <ScanLine size={14} className="text-blue-600" />
            AI FACE SCAN
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {step === 'camera' ? (
              <>Find Your <span className="text-blue-600">Photos</span></>
            ) : (
              <>Guest <span className="text-blue-600">Details</span></>
            )}
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-2">
            {step === 'camera' ? 'Capture a selfie to instantly find photos of you' : 'Enter your details to reveal your photos'}
          </p>
        </div>
        
        {/* Dynamic Viewfinder Frame */}
        <div className={`relative mx-auto mb-8 transition-all duration-500 flex items-center justify-center ${step === 'camera' ? 'w-48 h-48 sm:w-56 sm:h-56' : 'w-28 h-28 opacity-90'}`}>
          
          {/* Animated Scanner Ring */}
          <div className="absolute inset-0 border border-slate-200 rounded-full shadow-inner bg-slate-50" />
          
          {step === 'camera' && (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 border-t-2 border-blue-400 rounded-full border-dashed"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 border-l-2 border-blue-200 rounded-full"
              />
            </>
          )}
          
          <div className="absolute inset-3 overflow-hidden rounded-full bg-slate-100 flex items-center justify-center border border-white shadow-sm z-10 group">
            <AnimatePresence mode="wait">
              {image ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full absolute inset-0"
                >
                  <img src={image} alt="Selfie" className="w-full h-full object-cover" />
                  {status === 'processing' && (
                    <div className="absolute inset-0 bg-blue-500/20 animate-pulse flex items-center justify-center">
                      <div className="w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-scan" />
                    </div>
                  )}
                  {status === 'complete' && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-sm">
                       <CheckCircle2 className="w-14 h-14 text-blue-600 drop-shadow-md" />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full absolute inset-0 flex flex-col items-center justify-center gap-2 p-2"
                >
                  <Camera size={40} className="text-slate-300 group-hover:text-blue-500 transition-colors duration-300" />
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center leading-tight">Tap to<br/>Scan</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic Action Controls */}
        <div className="min-h-[130px] flex flex-col justify-center">
          
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
                className={`w-full py-3.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  image 
                    ? 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100' 
                    : 'bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20'
                }`}
              >
                {image ? 'Retake Photo' : 'Open Camera'}
                <Camera size={18} />
              </button>
              
              {image && (
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleConfirmPhoto}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-3"
                >
                  Confirm & Next
                  <ArrowRight size={18} />
                </motion.button>
              )}
              
              {!image && (
                <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-2">
                  <p className="text-xs font-medium text-slate-500 text-center">Face scan unavailable?</p>
                  <button 
                    onClick={() => navigate(`/login?event=${slug}`)}
                    className="w-full py-3.5 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <KeyRound size={18} />
                    Login with PIN instead
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: REGISTRATION FORM */}
          {step === 'registration' && status === 'idle' && (
            <form onSubmit={handleSubmitRegistration} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    className="w-full pl-12 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="tel" 
                    placeholder="10-digit number" 
                    className="w-full pl-12 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900" 
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-6"
              >
                Scan Database & Reveal Gallery
                <Sparkles size={18} />
              </button>
            </form>
          )}

          {/* UPLOAD & PROCESSING STATE */}
          {status === 'uploading' && (
            <div className="text-center py-6">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-blue-600 uppercase tracking-widest text-xs font-bold">Uploading Biometrics...</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center py-6">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-5">
                <motion.div 
                  className="h-full bg-blue-500"
                  animate={{ 
                    x: ['-100%', '100%'],
                    width: ['40%', '40%']
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <p className="text-slate-900 uppercase tracking-widest text-sm font-extrabold mb-1">Analyzing Face...</p>
              <p className="text-slate-500 text-xs font-medium">Scanning photos in event gallery</p>
            </div>
          )}

          {status === 'complete' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-6"
            >
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Face Matched!</h3>
              <p className="text-slate-500 text-sm font-medium">Opening your personal gallery...</p>
            </motion.div>
          )}

          {status === 'error' && (
            <div className="text-center py-5 border border-red-100 bg-red-50 rounded-xl mt-4">
              <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-slate-900 text-sm font-bold mb-3">Processing Error</p>
              <button 
                onClick={() => {
                   setStatus('idle');
                   setStep('camera');
                }} 
                className="text-blue-600 text-xs font-bold uppercase tracking-wider hover:underline"
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
