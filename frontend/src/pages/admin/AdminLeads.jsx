import React from 'react';
import { Download, Users } from 'lucide-react';
import useAdminStore from '../../stores/useAdminStore';

const AdminLeads = () => {
  const { leads, loading } = useAdminStore();

  const downloadLeadsCSV = () => {
    const headers = ['Name', 'Mobile', 'Email', 'Joined Date'];
    const rows = leads.map(l => [
      l.fullName || 'N/A',
      l.mobile || 'N/A',
      l.email || 'N/A',
      new Date(l.createdAt).toLocaleDateString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dreamline_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Customer Directory</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage and export all captured leads</p>
        </div>
        <button 
          onClick={downloadLeadsCSV}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 whitespace-nowrap">Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Phone</th>
                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {leads.map((lead) => (
                <tr key={lead._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{lead.fullName || 'Unknown'}</td>
                  <td className="px-6 py-4 text-slate-600 font-mono font-medium">{lead.mobile}</td>
                  <td className="px-6 py-4 text-slate-600">{lead.email || <span className="text-slate-400 italic font-medium">None</span>}</td>
                  <td className="px-6 py-4 text-slate-500 text-right font-medium">{new Date(lead.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {leads.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <Users size={28} className="text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-700">No leads registered yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLeads;
