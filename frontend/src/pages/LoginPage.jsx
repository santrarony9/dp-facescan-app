import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '../api/api';

const OTPLogin = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!mobile || mobile.length < 10) return;
    setLoading(true);
    try {
      // Instant Login using the Master Bypass Code
      const res = await authApi.verifyOtp(mobile, '112233');
      localStorage.setItem('token', res.data.token);
      navigate('/upload-selfie');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
      {/* Dynamic Gold Blobs */}
      <div className="bg-blob w-96 h-96 bg-[#D4AF37] rounded-full top-0 left-0 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="bg-blob w-96 h-96 bg-[#FDE047] rounded-full bottom-0 right-0 translate-x-1/2 translate-y-1/2 animation-delay-2000"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-md text-center relative z-10"
      >
        <div className="mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-[#D4AF37]/20 to-[#FDE047]/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#D4AF37]/30 shadow-[0_0_30px_rgba(212,175,55,0.2)]"
          >
            <ShieldCheck className="text-[#D4AF37] w-10 h-10" />
          </motion.div>
          <h1 className="text-3xl font-outfit font-bold mb-3 tracking-tight text-white">Dreamline Exclusive</h1>
          <p className="text-text-secondary text-sm uppercase tracking-widest font-medium">VIP Photo Access</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <input 
            type="tel"
            placeholder="Enter Mobile Number"
            className="input-field shadow-inner"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button 
            onClick={handleLogin}
            disabled={loading || mobile.length < 10}
            className="btn-primary w-full shadow-[0_0_20px_rgba(212,175,55,0.15)] group"
          >
            {loading ? 'Authenticating...' : 'Enter Gallery'}
            {!loading && <LogIn size={18} className="transition-transform group-hover:translate-x-1" />}
          </button>
          <p className="text-xs text-[#D4AF37]/50 mt-4">
            * Testing Mode: No OTP required for quick access.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OTPLogin;
