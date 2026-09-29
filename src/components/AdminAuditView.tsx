import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Search,
  KeyRound,
  Server,
  Lock,
  History,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  UserCheck,
  RotateCcw,
  Hash,
  Clock,
} from 'lucide-react';
import { Language, UserRole, Project } from '../types';
import { translations, roleDescriptions } from '../data/translations';
import { AdminAccessRequestsSection } from './AdminAccessRequestsSection';
import { getAccessRequests } from '../data/accessRequests';
import {
  AuditLogEntry,
  getStoredAuditLogs,
  initializeAuditLogIfEmpty,
  verifyAuditChain,
} from '../data/auditLog';

interface AdminAuditViewProps {
  projects: Project[];
  currentLang: Language;
  initialTab?: 'access_requests' | 'audit_logs' | 'security_rbac';
  initialSelectedRequestId?: string;
}

export const AdminAuditView: React.FC<AdminAuditViewProps> = ({
  projects,
  currentLang,
  initialTab = 'access_requests',
  initialSelectedRequestId,
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<'access_requests' | 'audit_logs' | 'security_rbac'>(
    initialTab
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  const [chainStatus, setChainStatus] = useState<'VALID' | 'BROKEN' | 'CHECKING'>('CHECKING');
  const [storedLogs, setStoredLogs] = useState<AuditLogEntry[]>([]);
  const [verificationDetails, setVerificationDetails] = useState<string>('');

  const [extraAuditLogs, setExtraAuditLogs] = useState<
    {
      projectId: string;
      projectName: string;
      id: string;
      timestamp: string;
      officerName: string;
      officerRole: string;
      action: string;
      fieldChanged?: string;
      oldValue?: string;
      newValue?: string;
      reason: string;
    }[]
  >([]);

  // Initialize and verify cryptographic chain from browser storage
  const loadAndVerifyChain = async () => {
    setChainStatus('CHECKING');
    try {
      const seedItems: {
        id: string;
        timestamp: string;
        projectId?: string;
        projectName?: string;
        officerName: string;
        officerRole: string;
        action: string;
        fieldChanged?: string;
        oldValue?: string;
        newValue?: string;
        reason: string;
      }[] = [];

      projects.forEach((p) => {
        p.auditTrail.forEach((a) => {
          seedItems.push({
            id: a.id,
            timestamp: a.timestamp,
            projectId: p.id,
            projectName: p.name,
            officerName: a.officerName,
            officerRole: a.officerRole,
            action: a.action,
            fieldChanged: a.fieldChanged,
            oldValue: a.oldValue,
            newValue: a.newValue,
            reason: a.reason,
          });
        });
      });

      seedItems.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      const chain = await initializeAuditLogIfEmpty(seedItems);
      const result = await verifyAuditChain(chain);

      setStoredLogs(chain);
      if (result.isValid) {
        setChainStatus('VALID');
        setVerificationDetails(
          `All ${chain.length} audit entries verified. Genesis-to-head SHA-256 hash pointers are intact.`
        );
      } else {
        setChainStatus('BROKEN');
        setVerificationDetails(
          result.brokenAtIndex !== undefined
            ? `Integrity failure at entry index ${result.brokenAtIndex}: cryptographic digest or pointer mismatch.`
            : 'Integrity failure: one or more audit entries do not match their cryptographic digest.'
        );
      }
    } catch (e) {
      console.error('Audit verification error', e);
      setChainStatus('BROKEN');
      setVerificationDetails('Unable to complete SHA-256 verification of audit storage.');
    }
  };

  useEffect(() => {
    loadAndVerifyChain();
  }, [projects]);

  // Collect all audit entries across projects + extra authorization actions
  const allAuditLogs = React.useMemo(() => {
    if (storedLogs.length > 0) {
      return [...storedLogs].reverse();
    }

    const list: {
      projectId?: string;
      projectName?: string;
      id: string;
      timestamp: string;
      officerName: string;
      officerRole: string;
      action: string;
      fieldChanged?: string;
      oldValue?: string;
      newValue?: string;
      reason: string;
      hash?: string;
      prevHash?: string;
    }[] = [...extraAuditLogs];

    projects.forEach((p) => {
      p.auditTrail.forEach((a) => {
        list.push({
          projectId: p.id,
          projectName: p.name,
          ...a,
        });
      });
    });

    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [storedLogs, projects, extraAuditLogs]);

  const filteredLogs = allAuditLogs.filter((log) => {
    if (selectedRoleFilter !== 'ALL' && log.officerRole !== selectedRoleFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const mProject =
        (log.projectName?.toLowerCase() || '').includes(q) ||
        (log.projectId?.toLowerCase() || '').includes(q);
      const mOfficer = log.officerName.toLowerCase().includes(q);
      const mAction = log.action.toLowerCase().includes(q);
      const mReason = log.reason.toLowerCase().includes(q);
      if (!mProject && !mOfficer && !mAction && !mReason) return false;
    }
    return true;
  });

  const rolesList: UserRole[] = [
    'DISTRICT_OFFICER',
    'STATE_OFFICER',
    'PROJECT_OFFICER',
    'MINISTRY_OFFICER',
    'VERIFICATION_OFFICER',
    'COMPETENT_AUTHORITY',
    'ML_DATA_TEAM',
    'SYSTEM_ADMIN',
  ];

  const pendingRequestsCount = getAccessRequests().filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#123B63]" />
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              {t.navAdminAudit}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access boundaries, officer access authorization, and append-only audit log.
          </p>
        </div>

        <div className="bg-blue-50 text-[#123B63] px-3 py-1.5 rounded text-xs font-semibold border border-blue-200 flex items-center gap-2">
          <Server className="w-3.5 h-3.5" />
          <span>System Active</span>
        </div>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('access_requests')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'access_requests'
              ? 'border-[#123B63] text-[#123B63] bg-white rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4 text-[#123B63]" />
          <span>Access Requests & Authorization</span>
          {pendingRequestsCount > 0 && (
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-amber-300">
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'audit_logs'
              ? 'border-[#123B63] text-[#123B63] bg-white rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <History className="w-4 h-4 text-[#123B63]" />
          <span>Append-only Audit Log</span>
          <span className="text-[10px] text-slate-400 font-mono">({allAuditLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security_rbac')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'security_rbac'
              ? 'border-[#123B63] text-[#123B63] bg-white rounded-t'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Lock className="w-4 h-4 text-[#123B63]" />
          <span>Security & RBAC Architecture</span>
        </button>
      </div>

      {/* ================= TAB 1: ACCESS REQUESTS ================= */}
      {activeTab === 'access_requests' && (
        <AdminAccessRequestsSection
          projects={projects}
          initialSelectedRequestId={initialSelectedRequestId}
          onAuditLogAdded={(newLog) => {
            setExtraAuditLogs((prev) => [newLog, ...prev]);
          }}
        />
      )}

      {/* ================= TAB 3: SECURITY & RBAC ARCHITECTURE ================= */}
      {activeTab === 'security_rbac' && (
        <div className="space-y-6">
          {/* Security Status Panel (Prompt Mandate #10) */}
          <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900">
                  System Security & Compliance Status
                </h2>
              </div>
          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
            SIH Evaluation Mode
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Authentication
            </span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Role-Based Authentication</span>
            </div>
            <p className="text-[10px] text-slate-500">Local credential validation with role-based claim binding.</p>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Role-Based Access
            </span>
            <div className="font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enabled</span>
            </div>
            <p className="text-[10px] text-slate-500">Enforces strict jurisdiction and tab boundaries per persona.</p>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Audit Logging
            </span>
            <div className="font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enabled</span>
            </div>
            <p className="text-[10px] text-slate-500">Cryptographically ordered immutable actions & orders.</p>
          </div>

          <div className="p-3 rounded border border-blue-200 bg-blue-50/50 space-y-1">
            <span className="text-[10px] text-[#123B63] font-bold uppercase tracking-wider block">
              Data Encryption
            </span>
            <div className="font-bold text-[#123B63] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Standard Browser Store</span>
            </div>
            <p className="text-[10px] text-slate-600">Client-side persistence with SHA-256 integrity hashing.</p>
          </div>

          <div className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Govt Identity (SSO)
            </span>
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>SSO Ready (Parichay / MeriPehchan)</span>
            </div>
            <p className="text-[10px] text-slate-500">Integration endpoints configured for SAML2.0 authentication.</p>
          </div>
        </div>
      </div>

      {/* Role-Based Access Control Architecture (RBAC) */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#123B63]" />
            Configured Role Permissions & Statutory Boundaries
          </h2>
          <span className="text-xs text-slate-500">8 Authorized Personas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {rolesList.map((r) => {
            const info = roleDescriptions[r];
            return (
              <div
                key={r}
                className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{info.title}</span>
                  <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.2 rounded text-slate-700">
                    {r}
                  </span>
                </div>
                <div className="text-[11px] text-blue-900 font-medium">
                  {info.dept} &bull; {info.jurisdiction}
                </div>
                <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
                  {info.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )}

  {/* ================= TAB 2: AUDIT LOGS ================= */}
  {activeTab === 'audit_logs' && (
    <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-[#123B63]" />
            Append-only audit log
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically chained SHA-256 audit trail of officer decisions, evidence scrutiny, and parameter updates.
          </p>
        </div>

        {/* Cryptographic Chain Integrity Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {chainStatus === 'VALID' ? (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-2.5 py-1.5 rounded font-bold flex items-center gap-1.5 shadow-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Chain: VALID (SHA-256 intact)</span>
            </div>
          ) : chainStatus === 'BROKEN' ? (
            <div className="bg-red-50 border border-red-300 text-red-800 text-xs px-2.5 py-1.5 rounded font-bold flex items-center gap-1.5 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Chain: BROKEN (Hash mismatch)</span>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-300 text-slate-700 text-xs px-2.5 py-1.5 rounded font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500 animate-spin shrink-0" />
              <span>Verifying chain...</span>
            </div>
          )}

          <button
            type="button"
            onClick={loadAndVerifyChain}
            className="flex items-center gap-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1.5 rounded font-semibold transition"
            title="Recompute all SHA-256 digests and check back-pointers"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-verify Chain</span>
          </button>
        </div>
      </div>

      {verificationDetails && (
        <div
          className={`text-[11px] px-3 py-1.5 rounded border ${
            chainStatus === 'VALID'
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-red-50/60 border-red-200 text-red-900'
          }`}
        >
          <strong>Chain Integrity Note:</strong> {verificationDetails}
        </div>
      )}

      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row gap-3 text-xs pt-1">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search audit trail by project, officer, action or reason..."
            className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300"
          />
        </div>

        <select
          value={selectedRoleFilter}
          onChange={(e) => setSelectedRoleFilter(e.target.value)}
          className="p-1.5 rounded border border-slate-300 bg-white"
        >
          <option value="ALL">All Roles</option>
          {rolesList.map((r) => (
            <option key={r} value={r}>
              {roleDescriptions[r].title}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#123B63] text-white uppercase text-[10px] font-bold">
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Project</th>
              <th className="py-2.5 px-3">Officer & Role</th>
              <th className="py-2.5 px-3">Action Recorded</th>
              <th className="py-2.5 px-3">Field Change</th>
              <th className="py-2.5 px-3">Reason / Justification</th>
              <th className="py-2.5 px-3 font-mono">SHA-256 Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No matching audit entries found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-mono text-[10px] text-[#123B63] font-bold">
                      {log.projectId || 'SYSTEM'}
                    </div>
                    <div className="text-slate-800 font-semibold line-clamp-1">
                      {log.projectName || 'Administrative Action'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{log.officerName}</div>
                    <div className="text-[10px] text-slate-500">{log.officerRole}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-[11px]">
                    {log.fieldChanged ? (
                      <span>
                        {log.fieldChanged}:{' '}
                        <span className="line-through text-slate-400">
                          {log.oldValue}
                        </span>{' '}
                        &rarr;{' '}
                        <strong className="text-[#123B63]">{log.newValue}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-400">&mdash;</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs text-[11px]">
                    {log.reason}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                    <div className="flex items-center gap-1" title={`Hash: ${log.hash}\nPrev: ${log.prevHash}`}>
                      <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-medium">
                        {log.hash ? `${log.hash.slice(0, 8)}...` : 'N/A'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )}
  </div>
  );
};
