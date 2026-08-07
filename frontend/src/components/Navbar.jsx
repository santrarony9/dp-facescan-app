import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('userName');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <>
      {/* Signature Dreamline Floating Pill Navbar */}
      <nav className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl rounded-full bg-black/90 backdrop-blur-xl border border-white/10 py-2 px-4 sm:px-6 flex justify-between items-center shadow-2xl">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-1.5 text-left">
          <span className="font-outfit font-black text-base sm:text-lg tracking-tight text-white uppercase">
            DREAMLINE <span className="text-[#c5a059] text-xs sm:text-sm font-bold">PRODUCTION<sup>®</sup></span>
          </span>
        </Link>

        {/* Desktop Quick Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-black uppercase tracking-[0.2em] text-white/80">
          <a 
            href="https://dreamlineproduction.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-[#c5a059] transition-colors"
          >
            Main Website
          </a>
          {token && role === 'guest' && (
            <span className="flex items-center gap-1 px-3 py-1 bg-[#c5a059]/10 border border-[#c5a059]/30 rounded-full text-[#c5a059]">
              <Sparkles size={12} />
              VIP GUEST
            </span>
          )}
          {token && role === 'client' && (
            <span className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
              CLIENT
            </span>
          )}
          {token ? (
            <button 
              onClick={handleLogout}
              className="hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <LogOut size={13} />
              Exit
            </button>
          ) : (
            <Link to="/login" className="btn-primary py-1.5 px-4 text-xs">
              VIP Portal
            </Link>
          )}
        </div>

        {/* Mobile Action & Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {token && (
            <span className="text-xs font-bold text-[#c5a059] bg-[#c5a059]/10 px-2 py-0.5 rounded-full border border-[#c5a059]/20 truncate max-w-[90px]">
              {userName || role}
            </span>
          )}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-full text-white bg-white/5 border border-white/10 active:scale-95 transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[55] md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[80vw] max-w-[300px] bg-[#0a0a0a] border-l border-white/10 z-[60] p-6 pt-20 flex flex-col justify-between md:hidden"
            >
              <div className="space-y-5 text-left">
                <div className="pb-3 border-b border-white/10">
                  <p className="text-xs font-black text-[#c5a059] uppercase tracking-[0.2em] mb-1">
                    Dreamline AI Platform
                  </p>
                  <h3 className="text-lg font-black text-white uppercase italic">
                    {userName ? `Hi, ${userName}` : 'VIP Access'}
                  </h3>
                </div>

                <div className="flex flex-col gap-2.5">
                  <a 
                    href="https://dreamlineproduction.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-widest flex items-center justify-between"
                  >
                    Main Website <span>↗</span>
                  </a>

                  {token ? (
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-bold text-xs uppercase tracking-widest flex items-center justify-between mt-2"
                    >
                      <span>Sign Out</span>
                      <LogOut size={15} />
                    </button>
                  ) : (
                    <Link 
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary w-full py-3 text-center text-xs mt-2"
                    >
                      VIP Portal Login
                    </Link>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 text-center">
                <p className="text-zinc-500 text-xs font-bold tracking-[0.2em] uppercase">
                  © Dreamline Production
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
