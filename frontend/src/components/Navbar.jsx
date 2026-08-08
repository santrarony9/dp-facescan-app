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
      {/* Clean Light Theme Floating Pill Navbar */}
      <nav className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl rounded-full bg-white/90 backdrop-blur-xl border border-slate-200 py-2.5 px-4 sm:px-6 flex justify-between items-center shadow-sm">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-1.5 text-left">
          <span className="font-outfit font-black text-base sm:text-lg tracking-tight text-slate-900 uppercase">
            DREAMLINE <span className="text-blue-600 text-xs sm:text-sm font-bold">PRODUCTION<sup>®</sup></span>
          </span>
        </Link>

        {/* Desktop Quick Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-bold uppercase tracking-[0.1em] text-slate-600">
          <a 
            href="https://dreamlineproduction.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-blue-600 transition-colors"
          >
            Main Website
          </a>
          {token && role === 'guest' && (
            <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600">
              <Sparkles size={12} />
              VIP GUEST
            </span>
          )}
          {token && role === 'client' && (
            <span className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-600">
              CLIENT
            </span>
          )}
          {token ? (
            <button 
              onClick={handleLogout}
              className="hover:text-red-500 transition-colors flex items-center gap-1 font-bold"
            >
              <LogOut size={14} />
              Exit
            </button>
          ) : (
            <Link to="/login" className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm py-1.5 px-4 text-xs font-bold uppercase rounded-full transition-colors">
              VIP Portal
            </Link>
          )}
        </div>

        {/* Mobile Action & Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {token && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 truncate max-w-[90px]">
              {userName || role}
            </span>
          )}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-full text-slate-600 bg-slate-50 border border-slate-200 active:scale-95 transition-all"
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
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] md:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[80vw] max-w-[300px] bg-white border-l border-slate-200 z-[60] p-6 pt-20 flex flex-col justify-between md:hidden shadow-2xl"
            >
              <div className="space-y-5 text-left">
                <div className="pb-4 border-b border-slate-100">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                    Dreamline AI Platform
                  </p>
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase">
                    {userName ? `Hi, ${userName}` : 'VIP Access'}
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  <a 
                    href="https://dreamlineproduction.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center justify-between hover:bg-slate-100"
                  >
                    Main Website <span>↗</span>
                  </a>

                  {token ? (
                    <button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bold text-xs uppercase tracking-wider flex items-center justify-between mt-2 hover:bg-red-100"
                    >
                      <span>Sign Out</span>
                      <LogOut size={16} />
                    </button>
                  ) : (
                    <Link 
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-3.5 bg-blue-600 text-white hover:bg-blue-700 text-center text-xs font-bold uppercase rounded-xl transition-colors mt-2 shadow-sm"
                    >
                      VIP Portal Login
                    </Link>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-slate-400 text-xs font-bold tracking-wider uppercase">
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
