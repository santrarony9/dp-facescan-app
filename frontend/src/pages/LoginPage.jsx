import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, ShieldCheck, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '../api/api';

const LoginPage = () => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const handleLogin = async () => {
    if (!mobile || mobile.length < 10) return;
    setLoading(true);
    try {
      // Use the master OTP for easy verification as requested
      const res = await authApi.verifyOtp(mobile, '112233');
      const token = res.data.token;
      
      localStorage.setItem('token', token);
      
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
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="bg-blob w-[500px] h-[500px] bg-primary/20 rounded-full top-0 left-0 -translate-x-1/2 -translate-y-1/2"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, -40, 0],
          y: [0, 60, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="bg-blob w-[400px] h-[400px] bg-primary-bright/10 rounded-full bottom-0 right-0 translate-x-1/2 translate-y-1/2"
      />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card w-full max-w-md text-center relative z-10"
      >
        {/* Luxury Header */}
        <div className="mb-10">
          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 15 }}
            className="w-24 h-24 bg-gradient-to-br from-primary/30 to-black rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/40 shadow-[0_0_40px_rgba(212,175,55,0.2)]"
          >
            <ShieldCheck className="text-primary w-12 h-12 drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-5xl font-outfit font-black mb-3 tracking-tighter text-white uppercase italic leading-none">
              Dreamline <span className="text-primary drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">VIP</span>
            </h1>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-primary/40"></div>
              <p className="text-primary/60 text-[10px] uppercase tracking-[0.4em] font-black">Neural Access Node</p>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-primary/40"></div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="tel"
              placeholder="Enter Mobile Number"
              className="input-field pl-12 text-lg tracking-wide"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <button 
            onClick={handleLogin}
            disabled={loading || mobile.length < 10}
            className="btn-primary w-full group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? 'Authenticating...' : 'Enter Gallery'}
              {!loading && <LogIn size={20} className="transition-transform group-hover:translate-x-1" />}
            </span>
            {/* Gloss shine effect */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 translate-x-[-150%]"
              animate={{ translateX: ['-150%', '150%'] }}
              transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
            />
          </button>

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

