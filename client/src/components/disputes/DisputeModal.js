import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const DisputeModal = ({ targetType, targetId, reportedUserId, onClose, pushToast, onSubmitted }) => {
  const { token, theme } = useAuth();
  const isLight = theme === 'light';
  
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const normalizedReportedUserId =
    typeof reportedUserId === 'string' ? reportedUserId : reportedUserId?._id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      pushToast('error', 'Error', 'Reason is required to open a dispute.');
      return;
    }
    if (!targetId || !normalizedReportedUserId) {
      pushToast('error', 'Error', 'Missing dispute target details. Please refresh and try again.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reportedUser: normalizedReportedUserId,
          reason: reason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit dispute');

      pushToast('success', 'Dispute Opened', 'Your dispute has been sent to the administration. You can track it in your profile.');
      if (onSubmitted) onSubmitted(data);
      onClose();
    } catch (err) {
      pushToast('error', 'Submission Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${isLight ? 'bg-slate-900/40' : 'bg-black/70'}`}>
      <div 
        className={`relative w-full max-w-md p-6 rounded-3xl shadow-2xl overflow-hidden ${
          isLight ? 'bg-white border border-slate-200' : 'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50'
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
        
        <button 
          onClick={onClose} 
          className={`absolute top-4 right-4 p-2 rounded-full transition-all ${
            isLight ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-600' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-500/10 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Open Dispute</h2>
            <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Report a problem with this {targetType.toLowerCase()}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Please describe the issue in detail
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., The item was damaged upon receipt..."
              className={`w-full p-4 rounded-2xl resize-none h-32 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all ${
                isLight 
                  ? 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400' 
                  : 'bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500'
              }`}
            />
          </div>
          
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                isLight 
                  ? 'text-slate-600 hover:bg-slate-100' 
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeModal;
