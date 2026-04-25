import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react';

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

  const deleteDispute = async (id) => {
    if (!window.confirm('Are you sure you want to completely delete this dispute? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/admin/disputes/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Failed to delete dispute');
      pushToast('success', 'Deleted', 'Dispute deleted successfully');
      loadDisputes();
    } catch (err) {
      pushToast('error', 'Error', err.message);
    }
  };

  if (loading) return <div className="text-gray-400">Loading disputes...</div>;

  const ongoingDisputes = disputes.filter(d => d.status === 'pending');
  const completedDisputes = disputes.filter(d => d.status !== 'pending');

  const DisputeCard = ({ dispute }) => (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 overflow-hidden mb-4">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Dispute for {dispute.targetType}</h3>
            <p className="text-sm text-gray-400">Reporter: {dispute.reporter?.name || 'Unknown'} | Reported: {dispute.reportedUser?.name || 'Unknown'}</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              dispute.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
              dispute.status === 'dismissed' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {dispute.status.toUpperCase()}
            </span>
            {dispute.status !== 'pending' && (
              <button onClick={() => deleteDispute(dispute._id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete Complete Dispute">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 mb-6">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Reason for Dispute</span>
          <p className="text-gray-300">{dispute.reason}</p>
        </div>
        
        {/* Chat Thread */}
        <div className="mb-6 space-y-3 max-h-64 overflow-y-auto pr-2">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Communication History</h4>
          {dispute.messages && dispute.messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] text-gray-500 mb-1 px-1">{msg.isAdmin ? 'You (Admin)' : (msg.sender?.name || 'User')} • {new Date(msg.createdAt).toLocaleTimeString()}</span>
              <div className={`p-3 rounded-2xl max-w-[85%] ${
                msg.isAdmin ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100 rounded-tr-sm' : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-sm'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {(!dispute.messages || dispute.messages.length === 0) && (
            <p className="text-sm text-gray-600 italic">No messages sent yet.</p>
          )}
        </div>
        
        {/* Admin Response Box */}
        {dispute.status === 'pending' && (
          <form 
            className="flex gap-2 mb-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const input = form.elements['chat-input'];
              const content = input.value;
              if (!content.trim()) return;
              
              try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/admin/disputes/${dispute._id}/message`, {
                  method: 'POST',
                  headers: authHeaders,
                  body: JSON.stringify({ content })
                });
                if (!res.ok) throw new Error('Failed to send text');
                input.value = '';
                loadDisputes();
              } catch (err) {
                pushToast('error', 'Error', err.message);
              }
            }}
          >
            <input 
              name="chat-input"
              type="text" 
              placeholder="Type a message to the user..." 
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all">Send</button>
          </form>
        )}

        {/* Resolution Actions */}
        {dispute.status === 'pending' && (
          <div className="flex gap-3 pt-4 border-t border-gray-700/50">
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
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Unresolved / Ongoing Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">Unresolved (Ongoing)</h2>
          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2.5 py-0.5 rounded-full font-bold">{ongoingDisputes.length}</span>
        </div>
        
        {ongoingDisputes.length === 0 ? (
          <div className="text-center py-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
            <CheckCircle className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No ongoing disputes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ongoingDisputes.map(dispute => <DisputeCard key={dispute._id} dispute={dispute} />)}
          </div>
        )}
      </section>

      {/* Resolved / Completed Section */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-2 pt-4 border-t border-gray-800">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-bold text-white">Resolved (Completed)</h2>
          <span className="bg-gray-800 text-gray-400 text-xs px-2.5 py-0.5 rounded-full font-bold">{completedDisputes.length}</span>
        </div>

        {completedDisputes.length === 0 ? (
          <div className="text-center py-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50">
            <p className="text-gray-500 text-sm">No completed disputes recorded</p>
          </div>
        ) : (
          <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
            {completedDisputes.map(dispute => <DisputeCard key={dispute._id} dispute={dispute} />)}
          </div>
        )}
      </section>
    </div>
  );
};

export default DisputesTab;
