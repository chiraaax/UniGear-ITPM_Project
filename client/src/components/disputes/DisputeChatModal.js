import React, { useEffect, useState } from 'react';
import { X, Send, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const DisputeChatModal = ({ dispute, onClose, refreshDisputes, pushToast }) => {
  const { token, user, theme } = useAuth();
  const isLight = theme === 'light';
  
  const [activeDispute, setActiveDispute] = useState(dispute);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setActiveDispute(dispute);
  }, [dispute]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSending(true);
      const res = await fetch(`${API_BASE}/disputes/${dispute._id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to send message');
      
      setContent('');
      setActiveDispute(data);
      refreshDisputes(); // Refresh dashboard data (which passes new dispute obj)
    } catch (err) {
      if (pushToast) pushToast('error', 'Error', err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm ${isLight ? 'bg-slate-900/40' : 'bg-black/70'}`}>
      <div 
        className={`relative w-full max-w-2xl h-[80vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden ${
          isLight ? 'bg-white border border-slate-200' : 'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50'
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isLight ? 'border-slate-200' : 'border-slate-700/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activeDispute.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : activeDispute.status === 'resolved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Dispute #{activeDispute._id.substring(activeDispute._id.length - 6)}</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Status: <span className="uppercase font-semibold">{activeDispute.status}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full transition-all ${
              isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Reason Context */}
        <div className={`p-4 text-sm ${isLight ? 'bg-slate-50 border-b border-slate-200' : 'bg-slate-900/50 border-b border-slate-700/50'}`}>
          <p className={`${isLight ? 'text-slate-600' : 'text-slate-300'}`}><span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>Original Reason:</span> {activeDispute.reason}</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeDispute.messages && activeDispute.messages.map((msg, idx) => {
            const isMe = msg.sender?._id === user._id || msg.sender === user._id;
            const isSystem = msg.isAdmin;
            
            return (
              <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className={`text-[10px] mb-1 px-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isSystem ? 'Admin System' : (msg.sender?.name || 'User')} • {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    isSystem 
                      ? 'bg-red-500/10 border border-red-500/20 text-red-100 rounded-tl-sm' 
                      : isMe 
                        ? 'bg-blue-600 text-white rounded-tr-sm shadow-md'
                        : `${isLight ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-800 text-slate-200 border border-slate-700'} rounded-tl-sm`
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                </div>
              </div>
            );
          })}
          {(!activeDispute.messages || activeDispute.messages.length === 0) && (
            <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-2">
              <span className="text-4xl text-slate-500">💬</span>
              <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>No messages yet. Send a message to the admin.</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        {activeDispute.status === 'pending' ? (
          <form onSubmit={handleSend} className={`p-4 border-t flex gap-2 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-700/50 bg-slate-900/50'}`}>
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message to Admin..."
              className={`flex-1 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                isLight ? 'bg-white border border-slate-300' : 'bg-slate-800 border border-slate-600 text-white'
              }`}
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center w-10 h-10"
            >
              <Send size={18} />
            </button>
          </form>
        ) : (
          <div className={`p-4 text-center text-sm ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>
            This dispute is marked as {activeDispute.status}. Messaging is disabled.
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeChatModal;
