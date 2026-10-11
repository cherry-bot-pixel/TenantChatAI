import React, { useState, useEffect } from 'react';
import { User, Tenant, AuditLog } from '../types';
import { Shield, Building, FileText, AlertTriangle, Users, Search, Filter, RefreshCw, Power } from 'lucide-react';

interface AdminViewProps {
  user: User;
  onRefresh: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ user }) => {
  const [metrics, setMetrics] = useState<{
    totalTenants: number;
    totalDocuments: number;
    totalUsers: number;
    totalAuditLogs: number;
    securityIncidentsBlocked: number;
    tenants: any[];
  } | null>(null);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    const token = localStorage.getItem('tenant_ai_token');
    try {
      const [metricsRes, logsRes] = await Promise.all([
        fetch('/api/admin/metrics', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/logs?severity=${severityFilter}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [severityFilter]);

  const handleToggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    const token = localStorage.getItem('tenant_ai_token');
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = logs.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.userEmail.toLowerCase().includes(q) ||
      l.tenantId.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
              <span>Security Operations & Admin Console</span>
              <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                SECOPS AUDITOR
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Multi-tenant telemetry, company partitioning management, and immutable audit logging.
            </p>
          </div>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Tenants</span>
              <Building className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.totalTenants}</div>
            <p className="text-[11px] text-slate-500 mt-1">Independent organizations</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Indexed Documents</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.totalDocuments}</div>
            <p className="text-[11px] text-slate-500 mt-1">Isolated corporate files</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Enterprise Users</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{metrics.totalUsers}</div>
            <p className="text-[11px] text-slate-500 mt-1">Authenticated accounts</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Breaches Blocked</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{metrics.securityIncidentsBlocked}</div>
            <p className="text-[11px] text-slate-500 mt-1">Cross-tenant attempts thwarted</p>
          </div>
        </div>
      )}

      {/* Tenants Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
          <Building className="w-4 h-4 text-cyan-400" />
          <span>Tenant Organization Registry</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Tenant Name</th>
                <th className="px-4 py-3">Tenant Identifier</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Documents</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {metrics?.tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-slate-100">{t.name}</td>
                  <td className="px-4 py-3.5 font-mono text-cyan-300">{t.id}</td>
                  <td className="px-4 py-3.5 text-slate-400">{t.domain}</td>
                  <td className="px-4 py-3.5">{t.documentCount} files</td>
                  <td className="px-4 py-3.5">{t.userCount} users</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      t.status === 'active'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleToggleTenantStatus(t.id, t.status)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] border border-slate-700 transition-colors inline-flex items-center space-x-1"
                    >
                      <Power className="w-3 h-3" />
                      <span>{t.status === 'active' ? 'Suspend' : 'Activate'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational & Audit Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Immutable Security & Operational Audit Log</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Every authentication, document retrieval, and cross-tenant violation attempt is recorded.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter by severity */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Alerts (Attacks)</option>
              <option value="WARN">Warnings</option>
              <option value="INFO">Info Logs</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800 sticky top-0">
              <tr>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Tenant</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">HTTP</th>
                <th className="px-3 py-2">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-850/50 transition-colors ${
                    log.severity === 'CRITICAL'
                      ? 'bg-rose-950/20'
                      : log.severity === 'WARN'
                      ? 'bg-amber-950/10'
                      : ''
                  }`}
                >
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      log.severity === 'CRITICAL'
                        ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                        : log.severity === 'WARN'
                        ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-cyan-300 whitespace-nowrap">{log.tenantId}</td>
                  <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{log.userEmail}</td>
                  <td className="px-3 py-2 font-semibold text-slate-200">{log.action}</td>
                  <td className="px-3 py-2">
                    <span className={log.status >= 400 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-400 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
