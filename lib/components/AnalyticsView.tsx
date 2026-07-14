'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart2, TrendingUp, Clock, Users, CheckCircle, Activity,
  FileText, Search, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Patient, Department, Priority } from '@/lib/types';
import { KPICard, Card, StatusBadge, PriorityBadge } from './ui';
import { deptColor, DEPT_GRADIENTS } from '@/lib/utils/dept-colors';

interface AnalyticsViewProps {
  patients: Patient[];
}

const STATUS_COLORS: Record<string, string> = {
  Waiting: "#64748b",
  Called: "#f59e0b",
  Serving: "#3b82f6",
  Completed: "#10b981",
  NoShow: "#f43f5e",
};

export default function AnalyticsView({ patients }: AnalyticsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const stats = useMemo(() => {
    const waiting = patients.filter(p => p.status === 'Waiting');
    const called = patients.filter(p => p.status === 'Called');
    const serving = patients.filter(p => p.status === 'Serving');
    const completed = patients.filter(p => p.status === 'Completed');
    const noShow = patients.filter(p => p.status === 'NoShow');

    let totalWaitTime = 0;
    let countCompleted = 0;
    completed.forEach(p => {
      if (p.calledTime && p.checkInTime) {
        totalWaitTime += Math.floor((new Date(p.calledTime).getTime() - new Date(p.checkInTime).getTime()) / 60000);
        countCompleted++;
      }
    });

    const activeCount = waiting.length + called.length + serving.length;
    const total = patients.length;

    return {
      totalWaiting: waiting.length + called.length,
      totalServedToday: completed.length,
      avgWait: countCompleted > 0 ? Math.round(totalWaitTime / countCompleted) : 0,
      noShowRate: total > 0 ? Math.round((noShow.length / total) * 100) : 0,
      activeCount,
    };
  }, [patients]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [patients]);

  const deptData = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach(p => {
      if (p.status !== 'Completed' && p.status !== 'NoShow') {
        counts[p.recommendedDepartment] = (counts[p.recommendedDepartment] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [patients]);

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach(p => {
      if (p.status !== 'Completed' && p.status !== 'NoShow') {
        counts[p.triagePriority] = (counts[p.triagePriority] || 0) + 1;
      }
    });
    const order = ['Emergency', 'High', 'Medium', 'Low'];
    return order.filter(p => counts[p]).map(name => ({ name, value: counts[name] || 0 }));
  }, [patients]);

  const hourlyData = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    for (let h = 8; h <= 18; h++) hourCounts[h] = 0;
    patients.forEach(p => {
      const h = new Date(p.checkInTime).getHours();
      if (hourCounts[h] !== undefined) hourCounts[h]++;
    });
    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: `${hour}:00`,
      checkins: count,
    }));
  }, [patients]);

  const deptPerfData = useMemo(() => {
    const depts: Record<string, { count: number; totalWait: number; completed: number }> = {};
    patients.forEach(p => {
      if (!depts[p.recommendedDepartment]) depts[p.recommendedDepartment] = { count: 0, totalWait: 0, completed: 0 };
      depts[p.recommendedDepartment].count++;
      if (p.status === 'Completed' && p.calledTime && p.checkInTime) {
        depts[p.recommendedDepartment].totalWait += Math.floor((new Date(p.calledTime).getTime() - new Date(p.checkInTime).getTime()) / 60000);
        depts[p.recommendedDepartment].completed++;
      }
    });
    return Object.entries(depts).map(([dept, d]) => ({
      dept,
      visits: d.count,
      avgWait: d.completed > 0 ? Math.round(d.totalWait / d.completed) : 0,
      throughput: d.completed > 0 ? Math.round((60 / Math.max(d.totalWait / d.completed, 1)) * 10) / 10 : 0,
    }));
  }, [patients]);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.recommendedDepartment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Users className="w-5 h-5" />}
          value={stats.totalWaiting}
          label="Active Queue"
          sub="Waiting + Called"
          gradient="from-teal-500 to-emerald-500"
        />
        <KPICard
          icon={<Clock className="w-5 h-5" />}
          value={`${stats.avgWait}m`}
          label="Avg Wait Time"
          sub="Intake to room"
          gradient="from-indigo-500 to-blue-500"
        />
        <KPICard
          icon={<CheckCircle className="w-5 h-5" />}
          value={stats.totalServedToday}
          label="Discharged Today"
          sub="Completed consultations"
          gradient="from-emerald-500 to-teal-500"
        />
        <KPICard
          icon={<AlertTriangle className="w-5 h-5" />}
          value={`${stats.noShowRate}%`}
          label="No-Show Rate"
          sub="Missed appointments"
          gradient="from-rose-500 to-pink-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visit Outcomes Donut */}
        <Card className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Visit Outcomes
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <text x="50%" y="48%" textAnchor="middle" className="fill-slate-800 text-2xl font-extrabold">
                  {patients.length}
                </text>
                <text x="50%" y="56%" textAnchor="middle" className="fill-slate-400 text-[10px] font-bold uppercase">
                  Total
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Peak Hours Area Chart */}
        <Card className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Check-in Activity by Hour
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorCheckins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                <Area type="monotone" dataKey="checkins" stroke="#10b981" strokeWidth={2} fill="url(#colorCheckins)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Load Bar */}
        <Card className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Active Patients by Department
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Priority Distribution */}
        <Card className="p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Priority Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={
                      entry.name === "Emergency" ? "#f43f5e" :
                      entry.name === "High" ? "#f59e0b" :
                      entry.name === "Medium" ? "#3b82f6" : "#94a3b8"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Department Performance Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Department Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="text-left px-6 py-3">Department</th>
                <th className="text-right px-6 py-3">Visits</th>
                <th className="text-right px-6 py-3">Avg Wait</th>
                <th className="text-right px-6 py-3">Throughput</th>
                <th className="text-right px-6 py-3">Load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deptPerfData.map((d) => (
                <tr key={d.dept} className="hover:bg-slate-50/50">
                  <td className="px-6 py-3 font-bold text-slate-700">{d.dept}</td>
                  <td className="px-6 py-3 text-right font-mono font-bold text-slate-800">{d.visits}</td>
                  <td className="px-6 py-3 text-right font-mono text-slate-600">{d.avgWait}m</td>
                  <td className="px-6 py-3 text-right font-mono text-slate-600">{d.throughput}/hr</td>
                  <td className="px-6 py-3 text-right">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-auto">
                      <div
                        className={`h-full rounded-full ${DEPT_GRADIENTS[deptColor(d.dept)]} bg-gradient-to-r`}
                        style={{ width: `${Math.min((d.visits / Math.max(...deptPerfData.map(x => x.visits))) * 100, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Patient Ledger */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Patient Ledger
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="text-left px-6 py-3">Ticket</th>
                <th className="text-left px-6 py-3">Patient</th>
                <th className="text-left px-6 py-3">Department</th>
                <th className="text-left px-6 py-3">Priority</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No records found.</td></tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 font-mono font-bold text-slate-900">{p.id}</td>
                    <td className="px-6 py-3 font-bold text-slate-700">{p.name}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {p.recommendedDepartment}
                      </span>
                    </td>
                    <td className="px-6 py-3"><PriorityBadge priority={p.triagePriority} /></td>
                    <td className="px-6 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-3 text-right font-mono text-slate-400">
                      {new Date(p.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
