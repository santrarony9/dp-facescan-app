import React from 'react';
import { Calendar, Image as ImageIcon, Users } from 'lucide-react';
import useAdminStore from '../../stores/useAdminStore';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
  const { events, loading, getTotalPhotos, getTotalFaces } = useAdminStore();
  const totalPhotos = getTotalPhotos();
  const totalFaces = getTotalFaces();

  const stats = [
    { label: 'Total Events', value: events.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Photos Uploaded', value: totalPhotos, icon: ImageIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Processed Faces', value: totalFaces, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx} 
            whileHover={{ scale: 1.02 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)] flex flex-col items-center sm:items-start text-center sm:text-left"
          >
            <div className="flex items-center justify-between w-full mb-4">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</h4>
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              {loading ? '...' : stat.value}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Activity</h3>
        <p className="text-slate-500 text-sm">Activity logs will appear here...</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
