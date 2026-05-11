import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, MessageSquare, Package, Clock } from 'lucide-react';

const UserProfileDrawer = ({ user, onClose, authHeaders, pushToast }) => {
  const [details, setDetails] = useState({ rentals: [], tasks: [] });
  const [loading, setLoading] = useState(true);

  const loadDetails = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/admin/users/${user._id}/details`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadDetails();
  }, [user, authHeaders]);

  const issueWarning = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/admin/users/${user._id}/warn`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      pushToast('success', 'Warning Issued', `User now has ${data.warnings} warnings.`);
      user.warnings = data.warnings; // Optimistic update
    } catch (err) {
      pushToast('error', 'Error', err.message);
    }
  };

  const sendMessage = async () => {
    const msg = prompt('Enter message to send to user:');
    if (!msg) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/admin/users/${user._id}/message`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      pushToast('success', 'Message Sent', 'User has been notified.');
    } catch (err) {
      pushToast('error', 'Error', err.message);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full h-full bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              User Profile
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-white">{user.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isSuspended ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {user.isSuspended ? 'Suspended' : 'Active'}
                </span>
              </div>
              <p className="text-gray-400 mb-4">{user.email}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Warnings</p>
                  <p className="text-xl font-semibold text-white flex items-center gap-2">
                    {user.warnings || 0}
                    {(user.warnings || 0) >= 3 && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                  </p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                  <p className="text-xs text-gray-500 mb-1">Trust Score</p>
                  <p className="text-xl font-semibold text-white">{user.trustScore?.toFixed(1) || 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={issueWarning} className="flex-1 flex items-center justify-center gap-2 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-xl transition-all font-medium text-sm">
                  <AlertTriangle className="w-4 h-4" /> Issue Warning
                </button>
                <button onClick={sendMessage} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl transition-all font-medium text-sm">
                  <MessageSquare className="w-4 h-4" /> Message User
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-gray-500 text-center py-8">Loading history...</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Recent Rentals ({details.rentals.length})
                  </h4>
                  <div className="space-y-3">
                    {details.rentals.slice(0, 5).map(r => (
                      <div key={r._id} className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/30 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-white font-medium truncate w-48">{r.title}</p>
                          <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-300">{r.moderationStatus}</span>
                      </div>
                    ))}
                    {details.rentals.length === 0 && <p className="text-sm text-gray-500">No rentals created.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Recent Tasks ({details.tasks.length})
                  </h4>
                  <div className="space-y-3">
                    {details.tasks.slice(0, 5).map(t => (
                      <div key={t._id} className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/30 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-white font-medium truncate w-48">{t.description}</p>
                          <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-gray-900 border border-gray-700 text-gray-300">{t.moderationStatus}</span>
                      </div>
                    ))}
                    {details.tasks.length === 0 && <p className="text-sm text-gray-500">No tasks created.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfileDrawer;
