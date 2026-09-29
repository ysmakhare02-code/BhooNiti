import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Building,
  MapPin,
  FileCheck,
  Key,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { AccessRequest, Project, UserRole } from '../types';
import {
  getAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
  requestCorrectionForAccess,
  ROLE_CARD_CONFIG,
} from '../data/accessRequests';

interface AdminAccessRequestsSectionProps {
  projects: Project[];
  initialSelectedRequestId?: string;
  onAuditLogAdded?: (log: {
    projectId: string;
    projectName: string;
    id: string;
    timestamp: string;
    officerName: string;
    officerRole: string;
    action: string;
    reason: string;
  }) => void;
}

export const AdminAccessRequestsSection: React.FC<AdminAccessRequestsSectionProps> = ({
  projects,
  initialSelectedRequestId,
  onAuditLogAdded,
}) => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Approval Modal/Form State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [assignedUsername, setAssignedUsername] = useState('');
  const [assignedRole, setAssignedRole] = useState<UserRole>('DISTRICT_OFFICER');
  const [assignedJurisdiction, setAssignedJurisdiction] = useState('');
  const [assignedScope, setAssignedScope] = useState('');
  const [assignedProjectId, setAssignedProjectId] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('demo123');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // Reject / Correction Dialog State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionInstructions, setCorrectionInstructions] = useState('');

  const loadRequests = () => {
    const list = getAccessRequests();
    setRequests(list);
    if (initialSelectedRequestId) {
      const match = list.find((r) => r.id === initialSelectedRequestId);
      if (match) setSelectedRequest(match);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [initialSelectedRequestId]);

  const openApproveModal = (req: AccessRequest) => {
    setSelectedRequest(req);
    // Suggest clean username from applicant name
    const rawClean = req.fullName
      .toLowerCase()
      .replace(/^(shri|smt|dr|er|ias|ips)\s+/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 16);
    const suggestedUsername = rawClean || 'officer_' + req.id.slice(-4);

    setAssignedUsername(suggestedUsername);
    setAssignedRole(req.requestedRole as UserRole);

    let juris = req.district ? `${req.district} District, ${req.state}` : req.state || 'National Jurisdiction';
    if (req.requestedRole === 'ML_DATA_TEAM') {
      juris = req.technicalTeam || 'NIC AI Center of Excellence';
    }
    setAssignedJurisdiction(juris);
    setAssignedScope(req.requestedScope || 'Authorized Scope');
    setAssignedProjectId(req.projectId || projects[0]?.id || '');
    setTemporaryPassword('demo123');
    setAdminRemarks(`Approved under administrative review for ${req.organization}.`);
    setApprovalFeedback(null);
    setShowApproveModal(true);
  };

  const handleConfirmApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (!assignedUsername.trim()) {
      alert('Please assign a valid username for the account.');
      return;
    }

    const res = approveAccessRequest(selectedRequest.id, {
      assignedRole,
      assignedJurisdiction: assignedJurisdiction.trim(),
      assignedScope: assignedScope.trim(),
      assignedUsername: assignedUsername.trim(),
      assignedProjectId: assignedRole === 'PROJECT_OFFICER' ? assignedProjectId : undefined,
      temporaryPassword: temporaryPassword.trim(),
      adminRemarks: adminRemarks.trim(),
      reviewedBy: 'System Administrator (Venkatesh Rao, NIC)',
    });

    if (res.success && res.request) {
      loadRequests();
      setSelectedRequest(res.request);
      setShowApproveModal(false);
      setApprovalFeedback(
        `Account activated! Officer can now sign in with username "${res.request.assignedUsername}" and password "${res.request.temporaryPassword}".`
      );

      // Log in audit trail
      if (onAuditLogAdded) {
        onAuditLogAdded({
          projectId: res.request.assignedProjectId || 'SYSTEM-ADMIN',
          projectName: 'BhooNiti Security & RBAC Access Control',
          id: `AUD-ACC-${Date.now().toString().slice(-6)}`,
          timestamp: res.request.reviewedAt || new Date().toISOString(),
          officerName: 'Venkatesh Rao (System Admin)',
          officerRole: 'SYSTEM_ADMIN',
          action: `Access Request ${res.request.id} Approved & Account Activated`,
          reason: `Assigned Role: ${assignedRole} | Jurisdiction: ${assignedJurisdiction} | Scope: ${assignedScope}. ${adminRemarks}`,
        });
      }
    } else {
      alert(res.error || 'Failed to approve request.');
    }
  };

  const handleConfirmRejection = () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      alert('Please state the reason for rejecting this access request.');
      return;
    }

    rejectAccessRequest(
      selectedRequest.id,
      rejectionReason.trim(),
      'System Administrator (Venkatesh Rao)'
    );

    if (onAuditLogAdded) {
      onAuditLogAdded({
        projectId: 'SYSTEM-ADMIN',
        projectName: 'BhooNiti Security & RBAC Access Control',
        id: `AUD-ACC-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        officerName: 'Venkatesh Rao (System Admin)',
        officerRole: 'SYSTEM_ADMIN',
        action: `Access Request ${selectedRequest.id} Rejected`,
        reason: `Rejection justification: ${rejectionReason}`,
      });
    }

    setShowRejectModal(false);
    setRejectionReason('');
    loadRequests();
  };

  const handleConfirmCorrection = () => {
    if (!selectedRequest) return;
    if (!correctionInstructions.trim()) {
      alert('Please provide instructions for the requested correction.');
      return;
    }

    requestCorrectionForAccess(
      selectedRequest.id,
      correctionInstructions.trim(),
      'System Administrator (Venkatesh Rao)'
    );

    if (onAuditLogAdded) {
      onAuditLogAdded({
        projectId: 'SYSTEM-ADMIN',
        projectName: 'BhooNiti Security & RBAC Access Control',
        id: `AUD-ACC-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        officerName: 'Venkatesh Rao (System Admin)',
        officerRole: 'SYSTEM_ADMIN',
        action: `Correction Requested for Request ${selectedRequest.id}`,
        reason: `Correction instructions: ${correctionInstructions}`,
      });
    }

    setShowCorrectionModal(false);
    setCorrectionInstructions('');
    loadRequests();
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  const filteredRequests = requests.filter((req) => {
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    if (roleFilter !== 'ALL' && req.requestedRole !== roleFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchId = req.id.toLowerCase().includes(q);
      const matchName = req.fullName.toLowerCase().includes(q);
      const matchEmail = req.officialEmail.toLowerCase().includes(q);
      const matchOrg = req.organization.toLowerCase().includes(q);
      const matchState = req.state?.toLowerCase().includes(q);
      const matchDist = req.district?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchEmail && !matchOrg && !matchState && !matchDist) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#123B63]" />
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Officer Access Requests & Account Provisioning
            </h2>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-300">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin review cycle: Select Role &rarr; Dynamic Information &rarr; Admin Review &rarr; Role Assignment &rarr; Account Activation.
          </p>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strict Admin-Gated Authorization (No Public Self-Registration)</span>
        </div>
      </div>

      {/* Success Feedback Banner */}
      {approvalFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-950 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{approvalFeedback}</span>
          </div>
          <button
            onClick={() => setApprovalFeedback(null)}
            className="text-emerald-800 hover:text-emerald-950 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-xs flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Request ID, applicant name, email, organization, or district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#123B63]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#123B63] bg-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">🟡 Pending Verification</option>
              <option value="APPROVED">🟢 Approved & Active</option>
              <option value="REJECTED">🔴 Rejected</option>
              <option value="CORRECTION_REQUESTED">🟠 Correction Requested</option>
            </select>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#123B63] bg-white font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value="STATE_OFFICER">State Officer</option>
            <option value="DISTRICT_OFFICER">District Officer</option>
            <option value="PROJECT_OFFICER">Project Officer</option>
            <option value="VERIFICATION_OFFICER">Verification Officer</option>
            <option value="COMPETENT_AUTHORITY">Competent Authority</option>
            <option value="ML_DATA_TEAM">ML / Data Team</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#123B63] text-white uppercase text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3">Request ID</th>
                <th className="py-2.5 px-3">Applicant & Designation</th>
                <th className="py-2.5 px-3">Requested Role</th>
                <th className="py-2.5 px-3">Jurisdiction / Scope</th>
                <th className="py-2.5 px-3">Date Submitted</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No access requests matching current filters.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const roleCfg = ROLE_CARD_CONFIG[req.requestedRole];
                  return (
                    <tr key={req.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#123B63] whitespace-nowrap">
                        {req.id}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{req.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {req.designation} &bull; {req.organization}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{req.officialEmail}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            roleCfg?.badgeColor || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {roleCfg?.title || req.requestedRole}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-medium text-slate-800 truncate">
                          {req.requestedScope}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {req.state ? `${req.state}${req.district ? ` / ${req.district}` : ''}` : req.technicalTeam}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                        {req.submittedAt}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {req.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Verification
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Approved & Active
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Rejected
                          </span>
                        )}
                        {req.status === 'CORRECTION_REQUESTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300">
                            <AlertTriangle className="w-3 h-3 text-orange-600" />
                            Correction Requested
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRequest(req)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition"
                            title="View submitted details"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>

                          {req.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => openApproveModal(req)}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold flex items-center gap-1 transition shadow-xs"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Authorize</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= DETAILS MODAL / DRAWER ================= */}
      {selectedRequest && !showApproveModal && !showRejectModal && !showCorrectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#123B63] text-white px-5 py-3.5 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold font-serif text-base">
                  ACCESS REQUEST DETAILS &mdash; {selectedRequest.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-300 hover:text-white font-bold text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Status Bar */}
              <div className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Current Lifecycle Status
                  </span>
                  <div className="font-bold text-sm text-slate-900">
                    {selectedRequest.status === 'PENDING' && '🟡 Pending Administrator Verification'}
                    {selectedRequest.status === 'APPROVED' && '🟢 Approved & Account Activated'}
                    {selectedRequest.status === 'REJECTED' && '🔴 Request Rejected'}
                    {selectedRequest.status === 'CORRECTION_REQUESTED' && '🟠 Correction Requested'}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Submitted At</span>
                  <span className="font-mono text-slate-600 font-semibold">
                    {selectedRequest.submittedAt}
                  </span>
                </div>
              </div>

              {/* Applicant Profile */}
              <div className="border border-slate-200 rounded p-3.5 space-y-2">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#123B63]" />
                  <span>Applicant Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Full Name:</span>
                    <strong className="text-slate-900">{selectedRequest.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Official Email:</span>
                    <span className="font-mono text-slate-800">{selectedRequest.officialEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Mobile Number:</span>
                    <span className="font-mono text-slate-800">{selectedRequest.mobileNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Official Designation:</span>
                    <span className="text-slate-900 font-medium">{selectedRequest.designation}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 text-[11px] block">Organization:</span>
                    <span className="text-slate-900">{selectedRequest.organization}</span>
                  </div>
                </div>
              </div>

              {/* Role & Jurisdiction Scope */}
              <div className="border border-slate-200 rounded p-3.5 space-y-2">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#123B63]" />
                  <span>Requested Role & Jurisdiction Scope</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Requested Role:</span>
                    <span className="font-bold text-[#123B63]">
                      {ROLE_CARD_CONFIG[selectedRequest.requestedRole]?.title || selectedRequest.requestedRole}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Requested Scope:</span>
                    <span className="font-bold text-slate-800">{selectedRequest.requestedScope}</span>
                  </div>

                  {selectedRequest.state && (
                    <div>
                      <span className="text-slate-500 text-[11px] block">State:</span>
                      <span className="text-slate-900">{selectedRequest.state}</span>
                    </div>
                  )}
                  {selectedRequest.district && (
                    <div>
                      <span className="text-slate-500 text-[11px] block">District:</span>
                      <span className="text-slate-900">{selectedRequest.district}</span>
                    </div>
                  )}
                  {selectedRequest.tehsil && (
                    <div>
                      <span className="text-slate-500 text-[11px] block">Tehsil:</span>
                      <span className="text-slate-900">{selectedRequest.tehsil}</span>
                    </div>
                  )}
                  {selectedRequest.departmentDivision && (
                    <div>
                      <span className="text-slate-500 text-[11px] block">Division:</span>
                      <span className="text-slate-900">{selectedRequest.departmentDivision}</span>
                    </div>
                  )}

                  {/* Project specific */}
                  {selectedRequest.projectName && (
                    <div className="col-span-2 p-2 bg-amber-50 rounded border border-amber-200">
                      <span className="text-[10px] uppercase font-bold text-amber-900 block">
                        Assigned Project
                      </span>
                      <div className="font-bold text-slate-900">
                        {selectedRequest.projectId}: {selectedRequest.projectName}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Type: {selectedRequest.projectType} &bull; Resp: {selectedRequest.assignmentResponsibility}
                      </div>
                    </div>
                  )}

                  {/* Verification specific */}
                  {selectedRequest.verificationScopes && (
                    <div className="col-span-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-900 block mb-1">
                        Requested Verification Scopes
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedRequest.verificationScopes.map((s) => (
                          <span key={s} className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical ML specific */}
                  {selectedRequest.technicalTeam && (
                    <div className="col-span-2 p-2 bg-cyan-50 rounded border border-cyan-200">
                      <span className="text-[10px] uppercase font-bold text-cyan-900 block">
                        Technical Scope ({selectedRequest.technicalTeam})
                      </span>
                      <div className="text-[11px] text-slate-700 mt-0.5">
                        Data Scope: {selectedRequest.requestedDataScopes?.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Justification Reason */}
              <div className="border border-slate-200 rounded p-3.5 space-y-1">
                <span className="text-slate-500 text-[11px] font-bold block">
                  Official Justification Reason:
                </span>
                <p className="text-slate-800 text-xs italic bg-slate-50 p-2 rounded">
                  "{selectedRequest.reasonForAccess}"
                </p>
              </div>

              {/* Approval Info (If already approved) */}
              {selectedRequest.status === 'APPROVED' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded space-y-1">
                  <span className="text-emerald-900 font-bold uppercase tracking-wider text-[10px] block">
                    Account Activation Details
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Assigned Username:</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {selectedRequest.assignedUsername}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Temporary Password:</span>
                      <span className="font-mono text-slate-800">
                        {selectedRequest.temporaryPassword || 'demo123'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Assigned Role:</span>
                      <span className="font-bold text-slate-900">{selectedRequest.assignedRole}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Authorized By:</span>
                      <span className="text-slate-800">{selectedRequest.reviewedBy}</span>
                    </div>
                  </div>
                  {selectedRequest.adminRemarks && (
                    <div className="pt-1 text-[11px] text-slate-600">
                      Remarks: {selectedRequest.adminRemarks}
                    </div>
                  )}
                </div>
              )}

              {/* Rejection / Correction Info */}
              {selectedRequest.adminRemarks && selectedRequest.status !== 'APPROVED' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded space-y-1">
                  <span className="font-bold text-amber-900 text-xs block">
                    Administrator Review Notes:
                  </span>
                  <p className="text-slate-800 text-xs">{selectedRequest.adminRemarks}</p>
                  <div className="text-[10px] text-slate-400">
                    Recorded by {selectedRequest.reviewedBy} on {selectedRequest.reviewedAt}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-5 py-3 rounded-b-lg border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedRequest.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRejectModal(true);
                      }}
                      className="px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded text-xs font-bold transition"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCorrectionModal(true);
                      }}
                      className="px-3 py-2 border border-orange-300 text-orange-700 hover:bg-orange-50 rounded text-xs font-bold transition"
                    >
                      Request Correction
                    </button>
                    <button
                      type="button"
                      onClick={() => openApproveModal(selectedRequest)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Authorize & Activate Account</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= APPROVE & ACTIVATE ACCOUNT MODAL ================= */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full flex flex-col border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#123B63] text-white px-5 py-3.5 rounded-t-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold font-serif text-base">
                  AUTHORIZE & ACTIVATE ACCOUNT
                </h3>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-slate-300 hover:text-white font-bold text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-[#123B63] space-y-1">
                <div className="font-bold">Applicant: {selectedRequest.fullName}</div>
                <div className="text-[11px] text-slate-600">
                  Requested: <strong>{selectedRequest.requestedRole}</strong> &bull; {selectedRequest.organization}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Assigned Username <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={assignedUsername}
                    onChange={(e) => setAssignedUsername(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#123B63]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Used by the officer to sign in.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Temporary Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-[#123B63]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Initial password provided to officer.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    Assigned Role <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B63] bg-white font-medium"
                  >
                    <option value="DISTRICT_OFFICER">District Officer (Collector & LAO)</option>
                    <option value="STATE_OFFICER">State Officer (Principal Secretary / Directorate)</option>
                    <option value="PROJECT_OFFICER">Project Officer (PIU Implementing Agency)</option>
                    <option value="VERIFICATION_OFFICER">Verification Officer (Statutory Scrutiny)</option>
                    <option value="COMPETENT_AUTHORITY">Competent / Authorized Authority (CALA / SDM)</option>
                    <option value="ML_DATA_TEAM">ML / Data Team (Model Drift & Metrics)</option>
                    <option value="MINISTRY_OFFICER">Ministry Officer (National Infrastructure)</option>
                  </select>
                  <span className="text-[10px] text-slate-500">
                    Admin can assign the requested role or choose an alternative based on verification.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    Assigned Jurisdiction <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={assignedJurisdiction}
                    onChange={(e) => setAssignedJurisdiction(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B63]"
                  />
                  <span className="text-[10px] text-slate-500">
                    The dashboard will strictly enforce access within this jurisdiction.
                  </span>
                </div>

                {assignedRole === 'PROJECT_OFFICER' && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">
                      Assigned Project <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={assignedProjectId}
                      onChange={(e) => setAssignedProjectId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B63] bg-white"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id}: {p.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-amber-800 block mt-0.5">
                      Security constraint: Project Officer access is explicitly scoped to this assigned project.
                    </span>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    Assigned Scope
                  </label>
                  <input
                    type="text"
                    value={assignedScope}
                    onChange={(e) => setAssignedScope(e.target.value)}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B63]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">
                    Administrative Remarks / Gazette Order Reference
                  </label>
                  <textarea
                    rows={2}
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    placeholder="e.g. Approved per Gazette notification S.O. 412(E) / Office order No. 892/2026."
                    className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs focus:ring-2 focus:ring-[#123B63]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirm & Activate Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REJECT MODAL ================= */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-300 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5" />
              <h3 className="font-bold text-base font-serif">
                Reject Access Request {selectedRequest.id}
              </h3>
            </div>

            <p className="text-slate-600">
              Please provide the statutory or administrative reason for rejecting this access request.
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Rejection Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Official identity or gazette appointment could not be verified with the District Revenue Directorate."
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded font-bold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CORRECTION REQUEST MODAL ================= */}
      {showCorrectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4 border border-slate-300 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base font-serif">
                Request Correction &mdash; {selectedRequest.id}
              </h3>
            </div>

            <p className="text-slate-600">
              Specify what additional clarification or documentation is required from the officer.
            </p>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Correction Instructions <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={3}
                value={correctionInstructions}
                onChange={(e) => setCorrectionInstructions(e.target.value)}
                placeholder="e.g. Please specify your exact SLAO division and upload your gazetted CALA designation order reference."
                className="w-full px-3 py-2 rounded border border-slate-300 text-xs focus:ring-2 focus:ring-orange-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCorrection}
                className="px-4 py-1.5 bg-orange-700 hover:bg-orange-800 text-white rounded font-bold shadow-xs"
              >
                Send Correction Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
