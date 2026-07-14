'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Users, UserPlus, Stethoscope, AlertCircle, CheckCircle } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  createdAt: string;
  isActive: boolean;
}

const ROLES = ['Reception', 'Triage', 'Doctor'] as const;
const DEPARTMENTS = [
  'General Medicine', 'Pediatrics', 'Cardiology', 'Orthopedics', 'Emergency',
  'Neurology', 'Oncology', 'Gynecology', 'Ophthalmology', 'ENT', 'Dermatology'
];

const ROLE_COLORS: Record<string, string> = {
  Reception: 'bg-blue-50 text-blue-700 border-blue-200',
  Triage: 'bg-amber-50 text-amber-700 border-amber-200',
  Doctor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<string>('Reception');
  const [formPassword, setFormPassword] = useState('');
  const [formDept, setFormDept] = useState('General Medicine');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('All');

  const fetchStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/staff');
      if (res.ok) setStaff(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!formName.trim() || !formPassword) {
      setFormError('Name and password are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), role: formRole, password: formPassword, department: formDept }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || 'Failed to add staff');
        return;
      }
      setFormSuccess(`${formName.trim()} registered as ${formRole}`);
      setFormName('');
      setFormPassword('');
      setShowForm(false);
      fetchStaff();
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove ${name} from staff?`)) return;
    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      fetchStaff();
    } catch { /* silent */ }
  };

  const filtered = filterRole === 'All' ? staff : staff.filter(s => s.role === filterRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Staff Management
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Register and manage hospital staff accounts</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess(''); }}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-sm"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Register Staff
        </button>
      </div>

      {formSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-xl">
          <CheckCircle className="w-4 h-4 shrink-0" /> {formSuccess}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">New Staff Registration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                placeholder="e.g. Dr. Abebe Bekele"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                placeholder="Set login password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
              <select
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50">
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="flex items-center gap-2">
        {['All', ...ROLES].map(r => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filterRole === r
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {r}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-slate-400 font-bold">{filtered.length} staff</span>
      </div>

      {/* Staff List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm font-bold">Loading staff...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
          <Users className="w-10 h-10 mx-auto text-slate-200 mb-2" />
          <p className="text-sm font-bold text-slate-500">No staff registered yet</p>
          <p className="text-xs text-slate-400 mt-1">Click &quot;Register Staff&quot; to add the first team member</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-100">
                <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Name</th>
                <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Role</th>
                <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Department</th>
                <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Registered</th>
                <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className={`border-t border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-3 font-bold text-slate-800">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold border ${ROLE_COLORS[s.role] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{s.department}</td>
                  <td className="px-4 py-3 text-slate-400 font-medium">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                      title="Remove staff"
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
