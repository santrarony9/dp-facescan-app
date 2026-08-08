import React, { useState } from 'react';
import { X, Copy, Check, Users, Lock, Unlock } from 'lucide-react';
import QRCode from 'react-qr-code';
import { adminApi } from '../api/api';

const ShareModal = ({ event, onClose, onUpdate }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [privacyEnabled, setPrivacyEnabled] = useState(event.guestPrivacyEnabled ?? true);
  const [isUpdating, setIsUpdating] = useState(false);

  const eventUrl = `https://app.dreamlineproduction.com/${event.slug}`;

  const copyToClipboard = async (text, setCopiedState) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const togglePrivacy = async () => {
    setIsUpdating(true);
    const newPrivacyState = !privacyEnabled;
    try {
      await adminApi.updateEvent(event._id, { guestPrivacyEnabled: newPrivacyState });
      setPrivacyEnabled(newPrivacyState);
      if (onUpdate) onUpdate();
    } catch (error) {
      alert('Failed to update privacy settings');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
          <h2 className="text-xl font-bold text-slate-800">Manage & Share</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Share Card */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Client Access</h3>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center space-y-4 shadow-sm">
                <div className="bg-white p-4 rounded-xl inline-block shadow-sm">
                  <QRCode value={eventUrl} size={150} fgColor="#1e3a8a" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">{event.name}</h4>
                  <p className="text-slate-500 text-sm">Scan to open the gallery</p>
                </div>
                
                <div className="pt-4 border-t border-blue-200/50 space-y-3">
                  <div className="flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-blue-100">
                    <span className="text-sm font-medium text-slate-600">PIN:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 tracking-widest">{event.clientPasskey || 'XXXXXX'}</span>
                      <button 
                        onClick={() => copyToClipboard(event.clientPasskey, setCopiedPin)}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                        title="Copy PIN"
                      >
                        {copiedPin ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => copyToClipboard(eventUrl, setCopiedLink)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {copiedLink ? <Check size={18} /> : <Copy size={18} />}
                    {copiedLink ? 'Link Copied!' : 'Copy Direct Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Privacy & Settings */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Guest Privacy</h3>
              
              <div className="space-y-4">
                {/* Option 1: Strict Privacy */}
                <button 
                  onClick={!privacyEnabled ? togglePrivacy : undefined}
                  disabled={isUpdating}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                    privacyEnabled ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-full mt-1 ${privacyEnabled ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Lock size={18} />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${privacyEnabled ? 'text-blue-900' : 'text-slate-700'}`}>Strict Privacy (Recommended)</h4>
                    <p className="text-sm text-slate-500 mt-1">Guests must log in with a selfie and will only see photos their face matches.</p>
                  </div>
                </button>

                {/* Option 2: Open Gallery */}
                <button 
                  onClick={privacyEnabled ? togglePrivacy : undefined}
                  disabled={isUpdating}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                    !privacyEnabled ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-full mt-1 ${!privacyEnabled ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Unlock size={18} />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${!privacyEnabled ? 'text-orange-900' : 'text-slate-700'}`}>Open Gallery</h4>
                    <p className="text-sm text-slate-500 mt-1">Guests can browse the entire gallery containing all event photos.</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Client Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500">Name</span>
                  <span className="font-medium text-slate-800">{event.clientName || 'Not Set'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium text-slate-800">{event.clientPhone || 'Not Set'}</span>
                </div>
                <p className="text-xs text-slate-400 mt-4 text-center">To update these details, use the Edit button on the main Event row.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
