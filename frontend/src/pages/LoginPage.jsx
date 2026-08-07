import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, KeyRound, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '../api/api';
import Navbar from '../components/Navbar';

const LoginPage = () => {
  const [passkey, setPasskey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const handlePasskeyLogin = async (e) => {
    if (e) e.preventDefault();
    if (!passkey || passkey.length < 4) {
      setErrorMsg('Please enter your 6-digit passkey.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');

    try {
      const eventSlug = searchParams.get('event');
      const res = await authApi.passkeyLogin(passkey, eventSlug);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'client');
      
      if (redirectPath) {
        navigate(decodeURIComponent(redirectPath));
      } else {
        const targetSlug = res.data.eventSlug || eventSlug;
        navigate(`/${targetSlug}/gallery`);
      }
    } catch (error) {
      console.error('Login Error:', error);
      setErrorMsg(error.response?.data?.message || 'Invalid Passkey. Try demo code 112233.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-24 pb-12 relative overflow-hidden bg-[#050505] font-outfit">
      <Navbar />

      {/* Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-[#c5a059]/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md relative z-10 my-auto text-center"
      >
        <div className="mb-6 sm:mb-8">
          <div className="w-12 h-12 rounded-full bg-[#c5a059]/10 border border-[#c5a059]/40 flex items-center justify-center mx-auto mb-3 text-[#c5a059] shadow-[0_0_20px_rgba(197,160,89,0.2)]">
             <KeyRound size={24} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight italic">
            DREAMLINE <span className="text-[#c5a059]">PASSKEY</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-[0.25em] font-bold mt-1">
            Fast 1-Step Album Verification
          </p>
        </div>

        <form onSubmit={handlePasskeyLogin} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-black text-zinc-400 uppercase tracking-widest ml-1">
              Enter 6-Digit Passkey
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c5a059]" />
              <input 
                type="password" 
                placeholder="••••••" 
                className="input-field pl-11 py-3 text.sm sm:text-base bg-white/5 border-white/10 focus:border-[#c5a059] tracking-[0.5em] font-bold text-center" 
                value={passkey}
                onChange={e => setPasskey(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-red-400 text-xs font-bold text-center pt-1">{errorMsg}</p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-xs rounded-full mt-4 shadow-[0_10px_25px_rgba(197,160,89,0.35)]"
          >
            {loading ? 'Unlocking Album...' : 'Unlock & Access Gallery'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between text-sm">
          <span className="text-zinc-500 font-bold uppercase tracking-wider">Demo Code: <span className="text-[#c5a059]">112233</span></span>
          <button 
            onClick={() => navigate('/')} 
            className="text-zinc-400 hover:text-white font-bold uppercase tracking-wider underline"
          >
            Browse All Albums
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
