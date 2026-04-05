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
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md text-center"
      >
        <div className="mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to Dreamline</h1>
          <p className="text-text-secondary">Sign in to find your event photos</p>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <input 
              type="tel"
              placeholder="Enter Mobile Number"
              className="input-field"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <button 
              onClick={handleSendOTP}
              disabled={loading || mobile.length < 10}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Sending...' : 'Send OTP'}
              {!loading && <LogIn size={18} />}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input 
              type="text"
              placeholder="Enter 6-digit OTP"
              className="input-field text-center tracking-[0.5em] text-xl font-bold"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button 
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 6}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <p 
              className="text-sm text-primary cursor-pointer hover:underline"
              onClick={() => setStep(1)}
            >
              Change phone number
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default OTPLogin;
