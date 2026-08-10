import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, Clock, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
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

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-blue-600 font-bold uppercase tracking-widest text-sm">Accessing Proofing Server...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-outfit p-4 sm:p-8 pt-24 pb-16">
      <Navbar />

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
          <button 
            onClick={() => navigate(`/${slug}/gallery`)}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors w-fit bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-bold uppercase tracking-wider">Back to Gallery</span>
          </button>
          <div className="text-left sm:text-right">
             <h1 className="text-xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900">{event?.name}</h1>
             <p className="text-sm text-blue-600 font-bold uppercase tracking-[0.1em] mt-1">Album Design Proofing</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* PDF / Proof Viewer */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="lg:col-span-2 space-y-4 lg:space-y-6"
          >
            <div className="bg-white p-2 sm:p-4 border border-slate-200 rounded-3xl overflow-hidden aspect-[16/11] relative shadow-sm">
               {proof?.pdfUrl || event?.bannerUrl ? (
                 <iframe 
                    src={proof?.pdfUrl || event?.bannerUrl}
                    className="w-full h-full rounded-2xl border border-slate-100 bg-slate-50"
                    title="Album Proof"
                 />
               ) : (
                 <div className="w-full h-full rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-slate-400 gap-4 p-4 text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <AlertTriangle size={32} className="text-amber-500" />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No PDF Proof Uploaded Yet</p>
                 </div>
               )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${event?.albumStatus === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                    {event?.albumStatus === 'Approved' ? <CheckCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Status</h4>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{event?.albumStatus || 'In Proofing'}</p>
                  </div>
                </div>
                {event?.albumStatus !== 'Approved' ? (
                  <button onClick={handleApprove} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl text-sm transition-colors shadow-sm">
                    Approve Album
                  </button>
                ) : (
                  <div className="w-full sm:w-auto flex justify-center items-center gap-2 text-emerald-700 font-bold uppercase text-sm bg-emerald-50 px-6 py-3.5 rounded-xl border border-emerald-200">
                    <CheckCircle size={16} />
                    Verified & Approved
                  </div>
                )}
            </div>
          </motion.div>

          {/* Feedback Section */}
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 border border-slate-200 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-lg font-extrabold uppercase text-slate-900">Submit Revision</h3>
              </div>
              
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <textarea 
                  className="w-full min-h-[160px] resize-none p-4 text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 placeholder:text-slate-400" 
                  placeholder="Describe any page changes, photo swaps, or edits you would like..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={event?.albumStatus === 'Approved'}
                />
                <button 
                  type="submit" 
                  disabled={submitting || event?.albumStatus === 'Approved'}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
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
