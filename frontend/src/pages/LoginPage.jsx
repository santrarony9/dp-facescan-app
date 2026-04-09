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

  const handleSendOTP = async () => {
    if (!mobile || mobile.length < 10) return;
    setLoading(true);
    try {
      await authApi.sendOtp(mobile);
      setStep(2);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) return;
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(mobile, otp);
      localStorage.setItem('token', res.data.token);
      navigate('/upload-selfie');
    } catch (error) {
      alert(error.response?.data?.message || 'Invalid OTP');
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

        {step === 1 ? (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <input 
              type="tel"
              placeholder="Enter Mobile Number"
              className="input-field shadow-inner"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <button 
              onClick={handleSendOTP}
              disabled={loading || mobile.length < 10}
              className="btn-primary w-full shadow-[0_0_20px_rgba(212,175,55,0.15)] group"
            >
              {loading ? 'Sending...' : 'Request Access'}
              {!loading && <LogIn size={18} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <input 
              type="text"
              placeholder="Enter 6-digit OTP"
              className="input-field text-center tracking-[0.5em] text-2xl font-outfit font-bold text-[#D4AF37] placeholder:text-[#D4AF37]/30"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button 
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 6}
              className="btn-primary w-full shadow-[0_0_20px_rgba(212,175,55,0.15)]"
            >
              {loading ? 'Verifying...' : 'Verify Identity'}
            </button>
            <p 
              className="text-sm text-text-secondary cursor-pointer hover:text-[#D4AF37] transition-colors"
              onClick={() => setStep(1)}
            >
              ← Change phone number
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default OTPLogin;
