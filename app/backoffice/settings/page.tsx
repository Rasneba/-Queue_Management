'use client';
import { useState, useEffect, useCallback } from 'react';
import { Settings, Plus, Trash2, Building2, Shield, Monitor, AlertCircle, CheckCircle } from 'lucide-react';

interface SettingItem {
  id: number;
  name: string;
  created_at: string;
}

type TabType = 'department' | 'role' | 'desk';

const TABS: { key: TabType; label: string; icon: typeof Building2 }[] = [
  { key: 'department', label: 'Departments', icon: Building2 },
  { key: 'role', label: 'Roles', icon: Shield },
  { key: 'desk', label: 'Desks', icon: Monitor },
];

const PLACEHOLDERS: Record<TabType, string> = {
  department: 'e.g. Urology',
  role: 'e.g. Nurse',
  desk: 'e.g. Desk 5',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('department');
  const [items, setItems] = useState<Record<TabType, SettingItem[]>>({
    department: [],
    role: [],
    desk: [],
  });
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchItems = useCallback(async (category: TabType) => {
    try {
      const res = await fetch(`/api/settings?category=${category}`);
      if (res.ok) {
        const data = await res.json();
        setItems(prev => ({ ...prev, [category]: data }));
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems('department');
    fetchItems('role');
    fetchItems('desk');
  }, [fetchItems]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newName.trim()) { setError('Name is required'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeTab, name: newName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add');
        return;
      }
      setSuccess(`"${newName.trim()}" added to ${activeTab}s`);
      setNewName('');
      fetchItems(activeTab);
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try {
      await fetch(`/api/settings/${id}`, { method: 'DELETE' });
      fetchItems(activeTab);
    } catch { /* silent */ }
  };

  const currentItems = items[activeTab];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          System Parameters
        </h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Manage departments, roles, and desks used across the system</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          const count = items[t.key].length;
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setError(''); setSuccess(''); setNewName(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === t.key
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                activeTab === t.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-xl">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex items-end gap-3">
        <div className="flex-1 max-w-md">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Name
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            placeholder={PLACEHOLDERS[activeTab]}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !newName.trim()}
          className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-xl transition-all shadow-sm ${
            newName.trim() && !submitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          {submitting ? 'Adding...' : 'Add'}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm font-bold">Loading...</div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <p className="text-sm font-bold text-slate-500">No {activeTab}s found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-100">
                <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">#</th>
                <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Name</th>
                <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Added</th>
                <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, i) => (
                <tr key={item.id} className={`border-t border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 text-slate-400 font-medium">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                      title={`Remove ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
