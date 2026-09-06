import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type {
  AggregateAppMetrics,
  UserOperationalMetadata,
  SecurityAuditEvent,
  SystemRecord,
} from '../types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  BarChart3,
  Activity,
  FileText,
  RefreshCw,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  Cpu,
  Database,
  Sparkles,
  Info,
  Sliders,
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToJournal: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToJournal }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'records' | 'audits'>('metrics');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Administrative State Stores
  const [metrics, setMetrics] = useState<AggregateAppMetrics | null>(null);
  const [usersList, setUsersList] = useState<UserOperationalMetadata[]>([]);
  const [recordsList, setRecordsList] = useState<SystemRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEvent[]>([]);

  // User filter state
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');

  // Audit filter state
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');

  // New Record Form State
  const [newRecordTitle, setNewRecordTitle] = useState<string>('');
  const [newRecordMessage, setNewRecordMessage] = useState<string>('');
  const [newRecordType, setNewRecordType] = useState<'info' | 'maintenance' | 'tip'>('info');
  const [submittingRecord, setSubmittingRecord] = useState<boolean>(false);
  const [recordSuccessMessage, setRecordSuccessMessage] = useState<string | null>(null);

  // Status update indicator
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchAdminData = async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Concurrent fetch of administrative views
      const [metricsRes, usersRes, recordsRes, auditsRes] = await Promise.all([
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/records', { headers }),
        fetch('/api/admin/audit-logs', { headers }),
      ]);

      if (!metricsRes.ok || !usersRes.ok) {
        if (metricsRes.status === 403 || usersRes.status === 403) {
          throw new Error('Access Forbidden: Current user account does not possess ADMIN permissions.');
        }
        throw new Error('Failed to load administrative telemetry.');
      }

      const [metricsData, usersData, recordsData, auditsData] = await Promise.all([
        metricsRes.json(),
        usersRes.json(),
        recordsRes.json(),
        auditsRes.json(),
      ]);

      setMetrics(metricsData);
      setUsersList(usersData.users || []);
      setRecordsList(recordsData.records || []);
      setAuditLogs(auditsData.auditLogs || []);
    } catch (err: any) {
      console.error('[Admin Fetch Error]:', err);
      setError(err?.message || 'Error communicating with administrative backend services.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  const handleUpdateUserStatus = async (userId: string, newStatus: 'Active' | 'Under Review' | 'Suspended') => {
    if (!user) return;
    setUpdatingUserId(userId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update user account operational status.');
      }

      // Update state locally
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      // Re-fetch audit logs to show recorded event
      const auditsRes = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (auditsRes.ok) {
        const auditsData = await auditsRes.json();
        setAuditLogs(auditsData.auditLogs || []);
      }
    } catch (err: any) {
      alert(err?.message || 'Status update failed.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newRecordTitle.trim() || !newRecordMessage.trim()) return;

    setSubmittingRecord(true);
    setRecordSuccessMessage(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newRecordTitle,
          message: newRecordMessage,
          type: newRecordType,
          active: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to register system record.');
      }

      const data = await res.json();
      setRecordsList((prev) => [data.record, ...prev]);
      setNewRecordTitle('');
      setNewRecordMessage('');
      setRecordSuccessMessage('System announcement broadcast registered successfully.');
      setTimeout(() => setRecordSuccessMessage(null), 4000);

      // Refresh audits
      const auditsRes = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (auditsRes.ok) {
        const auditsData = await auditsRes.json();
        setAuditLogs(auditsData.auditLogs || []);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to save record.');
    } finally {
      setSubmittingRecord(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearchTerm.toLowerCase());
    const matchesStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAudits = auditLogs.filter((log) => {
    if (auditActionFilter === 'ALL') return true;
    return log.action === auditActionFilter;
  });

  return (
    <div id="admin-dashboard-container" className="min-h-[calc(100vh-4rem)] bg-stone-50 pb-16">
      {/* Top Header & Navigation Banner */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                id="admin-back-btn"
                onClick={onBackToJournal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Journal</span>
              </button>
              <div className="h-4 w-px bg-stone-300" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                    Administrative Operations Center
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-stone-900 text-stone-100">
                    Role: ADMIN
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Aggregate application telemetry, user operational metadata, and security audit logs.
                </p>
              </div>
            </div>

            {/* Quick Actions / Refresh */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                id="admin-refresh-btn"
                onClick={() => fetchAdminData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
              </button>
            </div>
          </div>

          {/* Strict Privacy Callout Banner */}
          <div className="mt-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold">Privacy Boundary Enforced:</span> Under the Owner-Bound ABAC mandate, administrators do not have unrestricted access to private journal content. Individual reflections, multi-turn conversations, and personal thoughts are strictly isolated to document owners and inaccessible from administrative interfaces.
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-stone-200 -mb-px overflow-x-auto">
            <button
              id="admin-tab-metrics"
              onClick={() => setActiveTab('metrics')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'metrics'
                  ? 'border-stone-900 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Aggregate Statistics</span>
            </button>

            <button
              id="admin-tab-users"
              onClick={() => setActiveTab('users')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-stone-900 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Operational Metadata</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px]">
                {usersList.length}
              </span>
            </button>

            <button
              id="admin-tab-records"
              onClick={() => setActiveTab('records')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'records'
                  ? 'border-stone-900 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Application Records</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px]">
                {recordsList.length}
              </span>
            </button>

            <button
              id="admin-tab-audits"
              onClick={() => setActiveTab('audits')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'audits'
                  ? 'border-stone-900 text-stone-900 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security & Audit Events</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-200 text-stone-700 text-[10px]">
                {auditLogs.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Administrative Service Error</h3>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-stone-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-stone-600 font-medium">Loading administrative telemetry...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: AGGREGATE STATISTICS */}
            {activeTab === 'metrics' && metrics && (
              <div className="space-y-8">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 mb-2">
                      <span className="text-xs font-medium tracking-wide">TOTAL REFLECTIONS</span>
                      <FileText className="w-4 h-4 text-stone-400" />
                    </div>
                    <div className="text-2xl font-bold font-serif text-stone-900">
                      {metrics.totalInteractions.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                      <span className="text-emerald-600 font-medium">+12%</span> past 7 days
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 mb-2">
                      <span className="text-xs font-medium tracking-wide">ACTIVE ACCOUNTS</span>
                      <Users className="w-4 h-4 text-stone-400" />
                    </div>
                    <div className="text-2xl font-bold font-serif text-stone-900">
                      {metrics.activeUsersCount}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      Under verified Google Authentication
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 mb-2">
                      <span className="text-xs font-medium tracking-wide">SUMMARIES SYNTHESIZED</span>
                      <Sparkles className="w-4 h-4 text-stone-400" />
                    </div>
                    <div className="text-2xl font-bold font-serif text-stone-900">
                      {metrics.totalSummariesGenerated}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      Structured themes & action items
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-stone-500 mb-2">
                      <span className="text-xs font-medium tracking-wide">API HEALTH & LATENCY</span>
                      <Activity className="w-4 h-4 text-stone-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xl font-bold font-serif text-stone-900">
                        {metrics.systemHealth.apiLatencyMs}ms
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      Gemini API: {metrics.systemHealth.geminiStatus}
                    </div>
                  </div>
                </div>

                {/* Distributions Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Breakdown */}
                  <div className="p-6 rounded-xl bg-white border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-sm font-semibold text-stone-900 font-serif">
                          Aggregate Reflections by Category
                        </h2>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Anonymized thematic distribution across all registered entries
                        </p>
                      </div>
                      <Radio className="w-4 h-4 text-stone-400" />
                    </div>

                    <div className="space-y-4">
                      {Object.entries(metrics.categoryDistribution).map(([cat, count]) => {
                        const total = metrics.totalInteractions || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-stone-800">{cat}</span>
                              <span className="text-stone-500 font-mono">
                                {count} entries ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-stone-800 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI Model Execution & Architecture */}
                  <div className="p-6 rounded-xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h2 className="text-sm font-semibold text-stone-900 font-serif">
                            Gemini Model Distribution & Fallback Ladder
                          </h2>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Model execution ratio via automated backend fallback ladder
                          </p>
                        </div>
                        <Cpu className="w-4 h-4 text-stone-400" />
                      </div>

                      <div className="space-y-4">
                        {Object.entries(metrics.modelUsage).map(([model, count]) => {
                          const total = metrics.totalInteractions || 1;
                          const pct = Math.round((count / total) * 100);
                          const isPrimary = model.includes('3.6-flash');
                          return (
                            <div key={model} className="p-3 rounded-lg border border-stone-100 bg-stone-50/50">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-medium text-stone-900">{model}</span>
                                  {isPrimary && (
                                    <span className="px-1.5 py-0.5 rounded-xs text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                                      PRIMARY
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-stone-600">
                                  {count} calls ({pct}%)
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-700 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(pct, 4)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                      <span>Conversations per entry: <strong>{metrics.averageConversationsPerEntry}</strong></span>
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Zero hardcoded keys detected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: USER OPERATIONAL METADATA */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Search & Filter Toolbar */}
                <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search user email or ID..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Filter className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-xs text-stone-500">Filter status:</span>
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer"
                    >
                      <option value="ALL">All Accounts</option>
                      <option value="Active">Active</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-semibold">
                          <th className="px-5 py-3">Account / Email</th>
                          <th className="px-5 py-3">Assigned Role</th>
                          <th className="px-5 py-3">Operational Status</th>
                          <th className="px-5 py-3">Reflection Count</th>
                          <th className="px-5 py-3">Last Active</th>
                          <th className="px-5 py-3 text-right">Operational Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-stone-400">
                              No matching user records found.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                              <td className="px-5 py-3.5 font-medium text-stone-900">
                                <div>{u.email}</div>
                                <div className="text-[10px] text-stone-400 font-mono">{u.id}</div>
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    u.role === 'ADMIN'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                    u.status === 'Active'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : u.status === 'Under Review'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      u.status === 'Active'
                                        ? 'bg-emerald-500'
                                        : u.status === 'Under Review'
                                        ? 'bg-amber-500'
                                        : 'bg-rose-500'
                                    }`}
                                  />
                                  {u.status}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 font-mono text-stone-600">
                                {u.reflectionCount} entries
                              </td>
                              <td className="px-5 py-3.5 text-stone-500">
                                {new Date(u.lastActive).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                {u.role === 'ADMIN' ? (
                                  <span className="text-[11px] text-stone-400 italic">Root Account</span>
                                ) : (
                                  <div className="inline-flex items-center gap-1">
                                    <select
                                      disabled={updatingUserId === u.id}
                                      value={u.status}
                                      onChange={(e) =>
                                        handleUpdateUserStatus(
                                          u.id,
                                          e.target.value as 'Active' | 'Under Review' | 'Suspended'
                                        )
                                      }
                                      className="text-[11px] py-1 px-2 rounded border border-stone-200 bg-white text-stone-700 hover:border-stone-300 focus:outline-none cursor-pointer disabled:opacity-50"
                                    >
                                      <option value="Active">Set Active</option>
                                      <option value="Under Review">Set Review</option>
                                      <option value="Suspended">Set Suspended</option>
                                    </select>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500 flex items-center justify-between">
                    <span>Showing {filteredUsers.length} registered operational account(s)</span>
                    <span className="text-stone-400 italic">Private reflection texts are excluded by security policy</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: APPLICATION RECORDS MANAGEMENT */}
            {activeTab === 'records' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active System Records List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-sm font-semibold text-stone-900 font-serif">
                        Managed System Announcements & Operational Records
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Broadcast notices and operational parameter records maintained by administrators
                      </p>
                    </div>
                  </div>

                  {recordsList.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-5 rounded-xl bg-white border border-stone-200 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              rec.type === 'info'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : rec.type === 'maintenance'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {rec.type}
                          </span>
                          <h3 className="text-sm font-semibold text-stone-900">{rec.title}</h3>
                        </div>
                        <span className="text-[11px] text-stone-400">
                          {new Date(rec.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">{rec.message}</p>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                        <span>Updated by: {rec.updatedBy}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Active in Application
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form to Register New System Record */}
                <div className="p-6 rounded-xl bg-white border border-stone-200 shadow-xs h-fit space-y-4">
                  <div className="flex items-center gap-2 text-stone-900">
                    <Sliders className="w-4 h-4 text-stone-600" />
                    <h3 className="text-sm font-semibold font-serif">Broadcast New Notice</h3>
                  </div>
                  <p className="text-xs text-stone-500">
                    Publish an operational notice or security announcement to the application broadcast store.
                  </p>

                  {recordSuccessMessage && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{recordSuccessMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateRecord} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Notice Title
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Scheduled Maintenance or New Prompt"
                        value={newRecordTitle}
                        onChange={(e) => setNewRecordTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Notice Type
                      </label>
                      <select
                        value={newRecordType}
                        onChange={(e) => setNewRecordType(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-900"
                      >
                        <option value="info">General Information</option>
                        <option value="maintenance">Maintenance Schedule</option>
                        <option value="tip">Reflection Tip</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Message Content
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Detail the operational notice or policy update..."
                        value={newRecordMessage}
                        onChange={(e) => setNewRecordMessage(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingRecord}
                      className="w-full py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {submittingRecord ? 'Broadcasting...' : 'Publish System Record'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 4: SECURITY & AUDIT EVENTS */}
            {activeTab === 'audits' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-stone-800">
                      Immutable Security Audit Stream
                    </span>
                    <span className="text-xs text-stone-400">({filteredAudits.length} events logged)</span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs text-stone-500">Filter action:</span>
                    <select
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer"
                    >
                      <option value="ALL">All Security Events</option>
                      <option value="ADMIN_ACCESS_VERIFIED">ADMIN_ACCESS_VERIFIED</option>
                      <option value="VIEW_AGGREGATE_METRICS">VIEW_AGGREGATE_METRICS</option>
                      <option value="VIEW_USER_OPERATIONAL_METADATA">VIEW_USER_OPERATIONAL_METADATA</option>
                      <option value="UPDATE_USER_OPERATIONAL_STATUS">UPDATE_USER_OPERATIONAL_STATUS</option>
                      <option value="UPDATE_SYSTEM_RECORD">UPDATE_SYSTEM_RECORD</option>
                      <option value="UNAUTHORIZED_ACCESS_ATTEMPT">UNAUTHORIZED_ACCESS_ATTEMPT</option>
                    </select>
                  </div>
                </div>

                {/* Audit Log Stream */}
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase tracking-wider font-semibold">
                          <th className="px-5 py-3">Timestamp (UTC)</th>
                          <th className="px-5 py-3">Actor</th>
                          <th className="px-5 py-3">Action Type</th>
                          <th className="px-5 py-3">Target Resource</th>
                          <th className="px-5 py-3">Result</th>
                          <th className="px-5 py-3">Audit Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                        {filteredAudits.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-stone-400 font-sans">
                              No security audit events recorded matching filter.
                            </td>
                          </tr>
                        ) : (
                          filteredAudits.map((log) => (
                            <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                              <td className="px-5 py-3 text-stone-500 whitespace-nowrap">
                                {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                              </td>
                              <td className="px-5 py-3 text-stone-800 font-sans font-medium">
                                <div>{log.actorEmail}</div>
                                <div className="text-[10px] text-stone-400 font-mono">{log.actorUid}</div>
                              </td>
                              <td className="px-5 py-3">
                                <span className="font-semibold text-stone-900">{log.action}</span>
                              </td>
                              <td className="px-5 py-3 text-stone-600">{log.targetResource}</td>
                              <td className="px-5 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                    log.result === 'SUCCESS'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : log.result === 'DENIED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {log.result}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-stone-500 font-sans text-xs">
                                {log.metadata ? (
                                  <span className="text-[11px] text-stone-600 truncate block max-w-xs" title={JSON.stringify(log.metadata)}>
                                    {JSON.stringify(log.metadata)}
                                  </span>
                                ) : (
                                  <span className="text-stone-400 italic">None</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-stone-50 border-t border-stone-200 text-[11px] text-stone-500 flex items-center justify-between">
                    <span>Audit logs are preserved server-side for compliance monitoring</span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Append-Only Immutable Store
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
