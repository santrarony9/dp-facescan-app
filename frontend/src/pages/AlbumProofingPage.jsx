import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import { galleryApi } from '../api/api';
import Navbar from '../components/Navbar';

const AlbumProofingPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [proof, setProof] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      const res = await galleryApi.getGallery(slug);
      setEvent(res.data.event);
      setProof(res.data.proof);
    } catch (error) {
      console.error('Failed to fetch proofing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await galleryApi.submitFeedback(event._id, comment);
      alert('Feedback submitted successfully!');
      setComment('');
      fetchData();
    } catch (error) {
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this album? This will notify the team that design is finalized.')) return;
    
    try {
      setSubmitting(true);
      await galleryApi.approveAlbum(event._id);
      alert('Album approved! Final production started.');
      fetchData();
    } catch (error) {
      alert('Approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#c5a059] italic font-black uppercase tracking-widest text-xs">Accessing Proofing Server...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-outfit p-4 sm:p-8 pt-24 pb-16">
      <Navbar />

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <button 
            onClick={() => navigate(`/${slug}/gallery`)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Gallery</span>
          </button>
          <div className="text-right">
             <h1 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight">{event?.name}</h1>
             <p className="text-xs text-[#c5a059] font-bold uppercase tracking-[0.2em]">Album Design Proofing</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PDF / Proof Viewer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card p-2 border-[#c5a059]/30 bg-zinc-950 rounded-2xl sm:rounded-3xl overflow-hidden aspect-[16/11] relative">
               {proof?.pdfUrl || event?.bannerUrl ? (
                 <iframe 
                    src={proof?.pdfUrl || event?.bannerUrl}
                    className="w-full h-full rounded-xl sm:rounded-2xl border-none"
                    title="Album Proof"
                 />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-3 p-4 text-center">
                    <AlertTriangle size={36} className="text-[#c5a059]" />
                    <p className="text-xs font-bold uppercase tracking-widest">No PDF Proof Uploaded Yet</p>
                 </div>
               )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-900/60 p-4 sm:p-6 rounded-2xl border border-white/10 gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${event?.albumStatus === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#c5a059]/10 text-[#c5a059]'}`}>
                    {event?.albumStatus === 'Approved' ? <CheckCircle size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest">Status</h4>
                    <p className="text-[11px] text-zinc-400">{event?.albumStatus || 'In Proofing'}</p>
                  </div>
                </div>
                {event?.albumStatus !== 'Approved' ? (
                  <button onClick={handleApprove} className="btn-primary py-3 px-6 rounded-full text-sm">Approve Album</button>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-sm bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                    <CheckCircle size={14} />
                    Verified & Approved
                  </div>
                )}
            </div>
          </div>

          {/* Feedback Section */}
          <div className="space-y-6">
            <div className="glass-card p-5 sm:p-6 border-white/10 bg-zinc-950 rounded-2xl sm:rounded-3xl">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare size={18} className="text-[#c5a059]" />
                <h3 className="text-base font-black italic uppercase">Submit Revision</h3>
              </div>
              
              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                <textarea 
                  className="input-field min-h-[120px] resize-none p-3 text-xs bg-white/5 border-white/10 focus:border-[#c5a059]" 
                  placeholder="Describe any page changes or photo requests..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={event?.albumStatus === 'Approved'}
                />
                <button 
                  type="submit" 
                  disabled={submitting || event?.albumStatus === 'Approved'}
                  className="btn-primary w-full py-3.5 rounded-full flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                >
                  <Send size={15} />
                  <span>Send Revision Request</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AlbumProofingPage;
