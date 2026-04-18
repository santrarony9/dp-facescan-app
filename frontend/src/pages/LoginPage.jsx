import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, ShieldCheck, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '../api/api';

const LoginPage = () => {
  const [mobile, setMobile] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const handleLogin = async () => {
    if (!mobile || mobile.length < 10) return;
    if (!fullName || !email) {
      alert('Name & Email are required for VIP access');
      return;
    }

    setLoading(true);
    try {
      // Use the master OTP for easy verification as requested
      const res = await authApi.verifyOtp(mobile, '112233', fullName, email);
      const token = res.data.token;
      
      localStorage.setItem('token', token);
      localStorage.setItem('userName', fullName); // Store for personalized experience
      localStorage.setItem('userMobile', mobile);
      
      console.log('Login successful, redirecting...');
      
      // Navigate to the intended path (decoded) or admin if none
      if (redirectPath) {
        const decodedPath = decodeURIComponent(redirectPath);
        navigate(decodedPath);
      } else {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Authentication Error:', error);
      const msg = error.response?.data?.message || 'Login failed. Connection error.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]"
    >
      {/* Dynamic Background Blobs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="bg-blob w-[500px] h-[500px] bg-primary/20 rounded-full top-0 left-0 -translate-x-1/2 -translate-y-1/2"
      />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], x: [0, -40, 0], y: [0, 60, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="bg-blob w-[400px] h-[400px] bg-primary-bright/10 rounded-full bottom-0 right-0 translate-x-1/2 translate-y-1/2"
      />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-md text-center relative z-10"
      >
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
             <ShieldCheck className="text-primary w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black mb-1 text-white uppercase italic">Dreamline VIP</h1>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold">Registration & Neural Access</p>
        </div>

        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
            <input 
              type="text" 
              placeholder="Your Name" 
              className="input-field" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Mobile Number</label>
            <input 
              type="tel" 
              placeholder="10-digit number" 
              className="input-field" 
              value={mobile}
              onChange={e => setMobile(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              placeholder="example@mail.com" 
              className="input-field" 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <button 
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full py-5 rounded-3xl mt-4"
          >
            {loading ? 'Securing Session...' : 'Authorize & Enter Gallery'}
          </button>
        </div>

          <div className="pt-4">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">
              By entering, you agree to our <br />
              <span className="text-primary/50 hover:text-primary cursor-pointer transition-colors">Premium Privacy Terms</span>
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-center w-full"
      >
        <p className="text-zinc-600 text-xs font-medium tracking-[0.2em] uppercase">Powered by Dreamline AI Intelligence</p>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;

