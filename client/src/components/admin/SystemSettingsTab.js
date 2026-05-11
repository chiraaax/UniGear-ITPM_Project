import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle } from 'lucide-react';

const SystemSettingsTab = ({ authHeaders, pushToast }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/admin/settings`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [authHeaders]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000/api'}/admin/settings`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      pushToast('success', 'Saved', 'System settings updated successfully.');
    } catch (err) {
      pushToast('error', 'Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading settings...</div>;
  if (!settings) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-8 border-b border-gray-700/50 pb-4">System Settings</h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <div>
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              Maintenance Mode
              {settings.maintenanceMode && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
            </h3>
            <p className="text-sm text-gray-400">Lock the site for all non-admin users.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={settings.maintenanceMode || false} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} />
            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <label className="block text-sm font-medium text-gray-300 mb-2">Stale Items Threshold (Days)</label>
          <input 
            type="number" 
            value={settings.staleItemDays || 30} 
            onChange={e => setSettings({...settings, staleItemDays: Number(e.target.value)})}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">How many days until a pending item is considered stale.</p>
        </div>

        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <label className="block text-sm font-medium text-gray-300 mb-2">Allowed Rental Categories (comma separated)</label>
          <input 
            type="text" 
            value={(settings.allowedRentalCategories || []).join(', ')} 
            onChange={e => setSettings({...settings, allowedRentalCategories: e.target.value.split(',').map(s => s.trim())})}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <label className="block text-sm font-medium text-gray-300 mb-2">Allowed Task Categories (comma separated)</label>
          <input 
            type="text" 
            value={(settings.allowedTaskCategories || []).join(', ')} 
            onChange={e => setSettings({...settings, allowedTaskCategories: e.target.value.split(',').map(s => s.trim())})}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="pt-6">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsTab;
