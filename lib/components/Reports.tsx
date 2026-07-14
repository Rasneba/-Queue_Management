'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3, Users, Stethoscope, Clock, Filter, Calendar,
  RefreshCw, Download, ChevronDown, Activity, TrendingUp,
  FileText, Heart, UserCheck
} from 'lucide-react';

type ReportType = 'triage' | 'reception' | 'doctor';
type DatePreset = 'today' | 'week' | 'month' | 'custom';

interface TriageReport {
  byPriority: { priority: string; count: number; avgScore: number }[];
  totalPatients: number;
  completedPatients: number;
  avgWaitMinutes: number;
}

interface ReceptionReport {
  checkInsByHour: { hour: number; count: number }[];
  statusBreakdown: { status: string; count: number }[];
}

interface DoctorReport {
  byDoctor: {
    doctorName: string;
    totalShifts: number;
    totalMinutes: number;
    totalPatientsTreated: number;
    avgPatientsPerShift: number;
  }[];
  allStaff: string[];
}

interface ReportsProps {
  onBack?: () => void;
}

function getDateRange(preset: DatePreset): { from: string; to: string } {
  const today = new Date();
  const to = today.toISOString().split('T')[0];
  let from: string;

  switch (preset) {
    case 'today':
      from = to;
      break;
    case 'week': {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      from = d.toISOString().split('T')[0];
      break;
    }
    case 'month': {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 1);
      from = d.toISOString().split('T')[0];
      break;
    }
    default:
      from = to;
  }
  return { from, to };
}

const PRIORITY_COLORS: Record<string, string> = {
  Emergency: 'bg-rose-500',
  High: 'bg-amber-500',
  Medium: 'bg-blue-500',
  Low: 'bg-slate-400',
};

const STATUS_COLORS: Record<string, string> = {
  Waiting: 'bg-blue-500',
  Called: 'bg-amber-500',
  Serving: 'bg-indigo-500',
  Completed: 'bg-emerald-500',
  NoShow: 'bg-rose-400',
};

export default function Reports({ onBack }: ReportsProps) {
  const [reportType, setReportType] = useState<ReportType>('triage');
  const [datePreset, setDatePreset] = useState<DatePreset>('month');
  const [customFrom, setCustomFrom] = useState(() => getDateRange('month').from);
  const [customTo, setCustomTo] = useState(() => getDateRange('month').to);
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const [triageData, setTriageData] = useState<TriageReport | null>(null);
  const [receptionData, setReceptionData] = useState<ReceptionReport | null>(null);
  const [doctorData, setDoctorData] = useState<DoctorReport | null>(null);

  const dateRange = datePreset === 'custom'
    ? { from: customFrom, to: customTo }
    : getDateRange(datePreset);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      });
      if (staffFilter !== 'all') params.set('staff', staffFilter);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.triage) setTriageData(data.triage);
      if (data.reception) setReceptionData(data.reception);
      if (data.doctor) setDoctorData(data.doctor);
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  }, [reportType, dateRange.from, dateRange.to, staffFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const allStaffList = doctorData?.allStaff || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wider"
            >
              &larr; Back
            </button>
          )}
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Analytics & Reports
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Performance insights and operational metrics
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
        {/* Report Type Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-0.5">
          {([
            { key: 'triage', label: 'Triage', icon: Heart },
            { key: 'reception', label: 'Reception', icon: UserCheck },
            { key: 'doctor', label: 'Doctor Perf.', icon: Stethoscope },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setReportType(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                reportType === key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Date Preset */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DatePreset)}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Range */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <span className="text-slate-400 text-[10px] font-bold">to</span>
            <input
              type="date"
              className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        )}

        {/* Staff Filter (for doctor reports) */}
        {reportType === 'doctor' && allStaffList.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
            >
              <option value="all">All Staff</option>
              {allStaffList.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Refresh */}
        <button
          type="button"
          onClick={fetchReport}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-blue-600 uppercase tracking-wider transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Report Content */}
      {loading && !triageData && !receptionData && !doctorData ? (
        <div className="text-center py-20 text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-slate-300" />
          <p className="text-sm font-bold">Loading report data...</p>
        </div>
      ) : (
        <motion.div
          key={`${reportType}-${datePreset}-${staffFilter}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* TRIAGE REPORT */}
          {reportType === 'triage' && triageData && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Patients</span>
                  <div className="text-2xl font-black text-blue-700 mt-1">{triageData.totalPatients}</div>
                </div>
                <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{triageData.completedPatients}</div>
                </div>
                <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Wait</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">{triageData.avgWaitMinutes}m</div>
                </div>
                <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</span>
                  <div className="text-2xl font-black text-indigo-700 mt-1">
                    {triageData.totalPatients > 0
                      ? Math.round((triageData.completedPatients / triageData.totalPatients) * 100)
                      : 0}%
                  </div>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Triage Priority Distribution
                </h3>
                <div className="space-y-3">
                  {triageData.byPriority.map((item) => {
                    const maxCount = Math.max(...triageData.byPriority.map(p => p.count), 1);
                    const pct = Math.round((item.count / maxCount) * 100);
                    return (
                      <div key={item.priority} className="flex items-center gap-3">
                        <span className="w-24 text-[11px] font-bold text-slate-600 shrink-0">{item.priority}</span>
                        <div className="flex-1 h-7 bg-slate-50 rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full rounded-lg transition-all duration-500 ${PRIORITY_COLORS[item.priority] || 'bg-slate-400'}`}
                            style={{ width: `${pct}%`, opacity: 0.85 }}
                          />
                          <span className="absolute inset-0 flex items-center px-3 text-[11px] font-black text-slate-700">
                            {item.count} patients &middot; Avg Score: {item.avgScore}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* RECEPTION REPORT */}
          {reportType === 'reception' && receptionData && (
            <div className="space-y-5">
              {/* Status Breakdown */}
              <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Patient Status Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {receptionData.statusBreakdown.map((item) => (
                    <div
                      key={item.status}
                      className="p-3 rounded-xl border border-slate-100 text-center"
                    >
                      <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${STATUS_COLORS[item.status] || 'bg-slate-400'}`} />
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.status}</span>
                      <span className="block text-xl font-black text-slate-800 mt-0.5">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Check-ins by Hour */}
              <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Check-ins by Hour of Day
                </h3>
                {receptionData.checkInsByHour.length > 0 ? (
                  <div className="flex items-end gap-1 h-40">
                    {Array.from({ length: 24 }, (_, h) => {
                      const found = receptionData.checkInsByHour.find(ch => ch.hour === h);
                      const count = found?.count || 0;
                      const maxCount = Math.max(...receptionData.checkInsByHour.map(ch => ch.count), 1);
                      const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      return (
                        <div key={h} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[8px] font-bold text-slate-400">{count || ''}</span>
                          <div
                            className="w-full bg-blue-500 rounded-t-md transition-all duration-300"
                            style={{ height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%`, opacity: 0.8 }}
                          />
                          <span className="text-[7px] font-bold text-slate-400">{h}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">No check-in data for this period.</p>
                )}
              </div>
            </div>
          )}

          {/* DOCTOR PERFORMANCE REPORT */}
          {reportType === 'doctor' && doctorData && (
            <div className="space-y-5">
              {doctorData.byDoctor.length > 0 ? (
                <>
                  {/* Summary Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Doctors</span>
                      <div className="text-2xl font-black text-blue-700 mt-1">{doctorData.byDoctor.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Shifts</span>
                      <div className="text-2xl font-black text-indigo-700 mt-1">
                        {doctorData.byDoctor.reduce((s, d) => s + d.totalShifts, 0)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Patients Treated</span>
                      <div className="text-2xl font-black text-emerald-700 mt-1">
                        {doctorData.byDoctor.reduce((s, d) => s + d.totalPatientsTreated, 0)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Active Hours</span>
                      <div className="text-2xl font-black text-amber-600 mt-1">
                        {Math.floor(doctorData.byDoctor.reduce((s, d) => s + d.totalMinutes, 0) / 60)}h{" "}
                        {doctorData.byDoctor.reduce((s, d) => s + d.totalMinutes, 0) % 60}m
                      </div>
                    </div>
                  </div>

                  {/* Doctor Table */}
                  <div className="bg-white rounded-[20px] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-blue-600" />
                        Individual Doctor Performance
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-left">
                            <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px]">Doctor</th>
                            <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">Shifts</th>
                            <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">Hours</th>
                            <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">Patients</th>
                            <th className="px-4 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] text-center">Avg/Shift</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doctorData.byDoctor.map((doc, i) => (
                            <tr key={doc.doctorName} className={`border-t border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                              <td className="px-4 py-3 font-bold text-slate-800">{doc.doctorName}</td>
                              <td className="px-4 py-3 text-center font-mono text-slate-600">{doc.totalShifts}</td>
                              <td className="px-4 py-3 text-center font-mono text-slate-600">
                                {Math.floor(doc.totalMinutes / 60)}h {doc.totalMinutes % 60}m
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-black border border-emerald-100">
                                  {doc.totalPatientsTreated}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-blue-700">
                                {doc.avgPatientsPerShift}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-[20px] border border-slate-100">
                  <Stethoscope className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                  <div className="text-sm font-bold text-slate-600 uppercase tracking-widest">No Doctor Data</div>
                  <p className="text-xs text-slate-400 mt-1">No doctor shift sessions found for this period.</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
