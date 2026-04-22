import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const DisputesTab = ({ authHeaders, pushToast }) => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDisputes = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/admin/disputes`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setDisputes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, [authHeaders]);

  const resolveDispute = async (id, status, resolutionNote) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/admin/disputes/${id}/resolve`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status, resolutionNote }),
      });
      if (!res.ok) throw new Error('Failed to resolve dispute');
      pushToast('success', 'Resolved', `Dispute marked as ${status}`);
      loadDisputes();
    } catch (err) {
      pushToast('error', 'Error', err.message);
    }
  };

  if (loading) return <div className="text-gray-400">Loading disputes...</div>;

  if (disputes.length === 0) return (
    <div className="text-center py-12 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
      <AlertTriangle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
      <p className="text-gray-500">No open disputes</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {disputes.map(dispute => (
        <div key={dispute._id} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700/50">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Dispute for {dispute.targetType}</h3>
              <p className="text-sm text-gray-400">Reporter: {dispute.reporter?.name || 'Unknown'} | Reported: {dispute.reportedUser?.name || 'Unknown'}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              dispute.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
              dispute.status === 'dismissed' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {dispute.status.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-300 mb-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">{dispute.reason}</p>
          
          {dispute.status === 'pending' && (
            <div className="flex gap-3">
              <button onClick={() => {
                const note = prompt('Resolution note:');
                if (note) resolveDispute(dispute._id, 'resolved', note);
              }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-medium transition-all">
                <CheckCircle className="w-4 h-4" /> Resolve in favor of Reporter
              </button>
              <button onClick={() => {
                const note = prompt('Resolution note:');
                if (note) resolveDispute(dispute._id, 'dismissed', note);
              }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl text-sm font-medium transition-all border border-gray-600">
                <XCircle className="w-4 h-4" /> Dismiss Dispute
              </button>
            </div>
          )}
          {dispute.resolutionNote && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-400"><span className="font-semibold">Resolution Note:</span> {dispute.resolutionNote}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DisputesTab;
