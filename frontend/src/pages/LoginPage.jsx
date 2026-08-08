import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, KeyRound, ArrowRight, Sparkles, Camera } from 'lucide-react';
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
  const eventSlug = searchParams.get('event');

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token && eventSlug) {
      if (role === 'admin') {
        navigate(redirectPath ? decodeURIComponent(redirectPath) : `/${eventSlug}/gallery`);
        return;
      }
      if (role === 'client') {
        try {
          const base64Url = token.split('.')[1];
          let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const payload = JSON.parse(jsonPayload);
          
          if (payload.eventSlug === eventSlug || payload.role === 'admin') {
            navigate(redirectPath ? decodeURIComponent(redirectPath) : `/${eventSlug}/gallery`);
          }
        } catch (e) {
          console.error("Token decode failed", e);
        }
      }
    }
  }, [eventSlug, navigate, redirectPath]);

  const handlePasskeyLogin = async (e) => {
    if (e) e.preventDefault();
    if (!passkey || passkey.length < 4) {
      setErrorMsg('Please enter your passkey.');
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-24 pb-12 relative overflow-hidden bg-slate-50 font-outfit text-slate-900">
      <Navbar />

      {/* Clean Background Gradient */}
      <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-blue-50 to-slate-50 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 my-auto text-center bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm"
      >
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
             <KeyRound size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Secure Access
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-2">
            Enter your secure passkey to view your album
          </p>
        </div>

        <form onSubmit={handlePasskeyLogin} className="space-y-5 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Passkey
            </label>
            <div className="relative">
              <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="password" 
                placeholder="••••••" 
                className="w-full pl-12 py-3.5 text-base sm:text-lg bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all tracking-[0.5em] font-bold text-center text-slate-900" 
                value={passkey}
                onChange={e => setPasskey(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-red-500 text-xs font-bold text-center pt-1">{errorMsg}</p>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Unlocking...' : 'Unlock Gallery'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="pt-6 border-t border-slate-100 mt-8 flex flex-col items-center gap-4 text-sm">
          {searchParams.get('event') && (
            <button 
              onClick={() => navigate(`/${searchParams.get('event')}/selfie`)}
              className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Camera size={18} />
              Guest? Find Photos via Face Scan
            </button>
          )}
          
          <div className="flex w-full items-center justify-between mt-2">
            <span className="text-slate-400 font-medium text-xs">Demo Passkey: <span className="font-bold text-slate-600">112233</span></span>
            <button 
              onClick={() => navigate('/')} 
              className="text-blue-600 hover:text-blue-700 font-bold text-xs"
            >
              Back to Albums
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
