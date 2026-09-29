import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  MapPin,
  Building,
  AlertTriangle,
  History,
  CheckSquare,
  Plus,
  Scale,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  RotateCcw,
  Check,
  Building2,
  Gavel,
  Send,
  AlertCircle,
  Edit3,
  X,
} from 'lucide-react';
import {
  Project,
  Language,
  UserRole,
  VerificationStatus,
  ActionItem,
  AuditEntry,
  AuthorityDecision,
  AuthUser,
  ProjectDataUpdate,
} from '../types';
import { translations, stageTranslations, roleDescriptions } from '../data/translations';
import { calculateProjectRisk } from '../data/riskEngine';
import { ROLE_PERMISSIONS } from '../data/permissions';
import { appendAuditLogEntry } from '../data/auditLog';

interface ProjectDetailViewProps {
  project: Project;
  currentLang: Language;
  currentRole: UserRole;
  currentUser?: AuthUser;
  onBack: () => void;
  backLabel?: string;
  onUpdateProject: (updatedProject: Project) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  currentLang,
  currentRole,
  currentUser,
  onBack,
  backLabel,
  onUpdateProject,
}) => {
  const t = translations[currentLang];
  const roleInfo = roleDescriptions[currentRole] || roleDescriptions.DISTRICT_OFFICER;
  const userPerms = ROLE_PERMISSIONS[currentRole] || {
    tabs: [],
    canUpdateData: false,
    canVerify: false,
    canRecordDecision: false,
    canCreateAction: false,
    canViewAudit: false,
    canViewModel: false,
  };

  // Local state for interactive What-If Simulation
  const [compProgressSim, setCompProgressSim] = useState<number>(
    Math.round((project.compensationPaidCr / project.compensationTotalCr) * 100)
  );
  const [approvalDelaySim, setApprovalDelaySim] = useState<number>(project.approvalDelayDays);
  const [legalCasesSim, setLegalCasesSim] = useState<number>(project.legalDisputesCount);
  const [rrProgressSim, setRrProgressSim] = useState<number>(project.rrProgressPct);
  const [possessionSim, setPossessionSim] = useState<number>(project.possessionProgressPct);
  const [simulationResult, setSimulationResult] = useState<{
    simulatedScore: number;
    delta: number;
  } | null>(null);

  // Per-document verification notes state
  const [docRemarks, setDocRemarks] = useState<Record<string, string>>({});
  const [docErrors, setDocErrors] = useState<Record<string, string>>({});
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Competent Authority Decision Form State
  const [decisionType, setDecisionType] = useState<AuthorityDecision['decisionType']>(
    'Direct Special Disbursement Camp'
  );
  const [orderNumberInput, setOrderNumberInput] = useState<string>(
    project.authorityDecision?.orderNumber || ''
  );
  const [orderNumberError, setOrderNumberError] = useState<string | null>(null);
  const [statutoryRef, setStatutoryRef] = useState('RFCTLARR Act 2013 / Section 30 & Schedule 1');
  const [decisionInstructions, setDecisionInstructions] = useState(
    'Direct Sub-Divisional Officer (Haveli) and SLAO Pune to convene a 3-day special land acquisition settlement camp at Wagholi & Lonikand with district bank officials to complete 100% DBT disbursement.'
  );
  const [reviewMilestone, setReviewMilestone] = useState('2026-10-02');
  const [decisionRecorded, setDecisionRecorded] = useState(false);

  // Project Officer Data Update Submission State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [proposedCompPaid, setProposedCompPaid] = useState<number>(project.compensationPaidCr);
  const [proposedDelayDays, setProposedDelayDays] = useState<number>(project.approvalDelayDays);
  const [proposedRrPct, setProposedRrPct] = useState<number>(project.rrProgressPct);
  const [proposedPossessionPct, setProposedPossessionPct] = useState<number>(project.possessionProgressPct);
  const [proposedDocPct, setProposedDocPct] = useState<number>(project.documentationCompletenessPct);
  const [updateJustification, setUpdateJustification] = useState<string>('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null);

  // Verification Officer Data Review State
  const [reviewRemarks, setReviewRemarks] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  // New Action Item state
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('SLAO Haveli Sub-Division');
  const [newActionDueDate, setNewActionDueDate] = useState('2026-10-05');
  const [newActionPriority, setNewActionPriority] = useState<'High' | 'Medium' | 'Urgent'>('High');

  // Handle What-If Recalculation
  const handleRecalculateSimulation = () => {
    const simulatedPaid = (compProgressSim / 100) * project.compensationTotalCr;
    const simCalc = calculateProjectRisk({
      ...project,
      compensationPaidCr: simulatedPaid,
      approvalDelayDays: approvalDelaySim,
      legalDisputesCount: legalCasesSim,
      rrProgressPct: rrProgressSim,
      possessionProgressPct: possessionSim,
    });

    const delta = simCalc.delayProbability - project.delayProbability;
    setSimulationResult({
      simulatedScore: simCalc.delayProbability,
      delta,
    });
  };

  const handleResetSimulation = () => {
    const origComp = Math.round(
      (project.compensationPaidCr / project.compensationTotalCr) * 100
    );
    setCompProgressSim(origComp);
    setApprovalDelaySim(project.approvalDelayDays);
    setLegalCasesSim(project.legalDisputesCount);
    setRrProgressSim(project.rrProgressPct);
    setPossessionSim(project.possessionProgressPct);
    setSimulationResult(null);
  };

  // Handle Per-Document Verification (Verification Officer / SLAO role)
  const handleVerifyDocument = async (docId: string, status: 'Verified' | 'Correction Requested') => {
    const doc = project.evidenceDocuments.find((d) => d.id === docId);
    if (!doc) return;

    const remarks = (docRemarks[docId] || doc.remarks || '').trim();
    if (!remarks) {
      setDocErrors((prev) => ({
        ...prev,
        [docId]: 'Officer scrutiny remarks are mandatory for statutory evidence verification.',
      }));
      return;
    }
    setDocErrors((prev) => {
      const copy = { ...prev };
      delete copy[docId];
      return copy;
    });

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    const updatedDocuments = project.evidenceDocuments.map((d) => {
      if (d.id === docId) {
        return {
          ...d,
          status,
          remarks,
          verifiedBy: currentUser?.username || roleInfo.title,
          verifiedDate: timestamp.slice(0, 10),
        };
      }
      return d;
    });

    // Recompute overall project verification status
    const allVerified = updatedDocuments.every((d) => d.status === 'Verified');
    const anyCorrection = updatedDocuments.some((d) => d.status === 'Correction Requested');
    const newProjectStatus: VerificationStatus = allVerified
      ? 'VERIFIED'
      : anyCorrection
      ? 'CORRECTION_REQUESTED'
      : 'PENDING';

    const newAuditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp,
      officerName: currentUser?.username || roleInfo.title,
      officerRole: currentRole,
      action: `Document Scrutiny: "${doc.title}" marked as ${status}`,
      fieldChanged: `Evidence Document: ${doc.title}`,
      oldValue: doc.status,
      newValue: status,
      reason: remarks,
    };

    const updatedProject: Project = {
      ...project,
      verificationStatus: newProjectStatus,
      evidenceDocuments: updatedDocuments,
      auditTrail: [newAuditEntry, ...project.auditTrail],
    };

    onUpdateProject(updatedProject);
    try {
      await appendAuditLogEntry({
        id: newAuditEntry.id,
        timestamp,
        projectId: project.id,
        projectName: project.name,
        officerName: newAuditEntry.officerName,
        officerRole: currentRole,
        action: newAuditEntry.action,
        fieldChanged: newAuditEntry.fieldChanged,
        oldValue: newAuditEntry.oldValue,
        newValue: newAuditEntry.newValue,
        reason: remarks,
      });
    } catch (e) {
      console.error('Failed to append to audit log', e);
    }

    setVerificationFeedback(`Document "${doc.title}" successfully recorded as "${status}".`);
    setTimeout(() => setVerificationFeedback(null), 4000);
  };

  // Handle Project Officer Data Update Submission (Status: PENDING)
  const handleSubmitDataUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateJustification.trim()) {
      setUpdateError('Official justification is mandatory for submitting a project data update.');
      return;
    }
    setUpdateError(null);

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    const newUpdate: ProjectDataUpdate = {
      id: `UPD-${Date.now()}`,
      submittedBy: currentUser?.username || roleInfo.title,
      submittedRole: currentRole,
      submittedAt: timestamp,
      compensationPaidCr: Number(proposedCompPaid),
      approvalDelayDays: Number(proposedDelayDays),
      rrProgressPct: Number(proposedRrPct),
      possessionProgressPct: Number(proposedPossessionPct),
      documentationCompletenessPct: Number(proposedDocPct),
      justification: updateJustification.trim(),
      status: 'PENDING',
    };

    const newAuditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp,
      officerName: currentUser?.username || roleInfo.title,
      officerRole: currentRole,
      action: 'Data Update Proposal Submitted (Status: PENDING)',
      fieldChanged: 'Project Milestone Metrics',
      oldValue: `Paid ₹${project.compensationPaidCr}Cr, Delay ${project.approvalDelayDays}d`,
      newValue: `Proposed Paid ₹${proposedCompPaid}Cr, Delay ${proposedDelayDays}d`,
      reason: updateJustification.trim(),
    };

    const updatedProject: Project = {
      ...project,
      pendingDataUpdate: newUpdate,
      auditTrail: [newAuditEntry, ...project.auditTrail],
    };

    onUpdateProject(updatedProject);
    try {
      await appendAuditLogEntry({
        id: newAuditEntry.id,
        timestamp,
        projectId: project.id,
        projectName: project.name,
        officerName: newAuditEntry.officerName,
        officerRole: currentRole,
        action: newAuditEntry.action,
        fieldChanged: newAuditEntry.fieldChanged,
        oldValue: newAuditEntry.oldValue,
        newValue: newAuditEntry.newValue,
        reason: updateJustification.trim(),
      });
    } catch (e) {
      console.error('Failed to append audit entry', e);
    }

    setShowUpdateModal(false);
    setUpdateSuccessMsg('Data update proposal submitted with status PENDING. Awaiting verification by Verification Officer (SLAO).');
    setTimeout(() => setUpdateSuccessMsg(null), 6000);
  };

  // Handle Verification Officer Approval or Rejection of Data Update
  const handleReviewDataUpdate = async (decision: 'APPROVE' | 'REJECT') => {
    if (!project.pendingDataUpdate || project.pendingDataUpdate.status !== 'PENDING') return;

    if (!reviewRemarks.trim()) {
      setReviewError('Verification scrutiny remarks are mandatory to approve or reject milestone updates.');
      return;
    }
    setReviewError(null);

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    const pending = project.pendingDataUpdate;

    if (decision === 'APPROVE') {
      const updatedCompPaid = pending.compensationPaidCr;
      const updatedCompPending = Math.max(0, project.compensationTotalCr - updatedCompPaid);
      const updatedApprovalDelay = pending.approvalDelayDays;
      const updatedRrPct = pending.rrProgressPct;
      const updatedPossessionPct = pending.possessionProgressPct;
      const updatedDocPct = pending.documentationCompletenessPct;

      const recalculation = calculateProjectRisk({
        ...project,
        compensationPaidCr: updatedCompPaid,
        compensationPendingCr: updatedCompPending,
        approvalDelayDays: updatedApprovalDelay,
        rrProgressPct: updatedRrPct,
        possessionProgressPct: updatedPossessionPct,
        documentationCompletenessPct: updatedDocPct,
      });

      const reviewedUpdate: ProjectDataUpdate = {
        ...pending,
        status: 'APPROVED',
        reviewedBy: currentUser?.username || roleInfo.title,
        reviewedAt: timestamp,
        reviewRemarks: reviewRemarks.trim(),
      };

      const newAuditEntry: AuditEntry = {
        id: `AUD-${Date.now()}`,
        timestamp,
        officerName: currentUser?.username || roleInfo.title,
        officerRole: currentRole,
        action: 'Data Update Approved & Applied (Risk Recalculated)',
        fieldChanged: 'Statutory Project Metrics',
        oldValue: `Risk Score: ${project.riskScore}, Delay: ${project.delayProbability}%`,
        newValue: `New Risk Score: ${recalculation.riskScore}, Delay: ${recalculation.delayProbability}%`,
        reason: reviewRemarks.trim(),
      };

      const updatedProject: Project = {
        ...project,
        compensationPaidCr: updatedCompPaid,
        compensationPendingCr: updatedCompPending,
        approvalDelayDays: updatedApprovalDelay,
        rrProgressPct: updatedRrPct,
        possessionProgressPct: updatedPossessionPct,
        documentationCompletenessPct: updatedDocPct,
        riskScore: recalculation.riskScore,
        delayProbability: recalculation.delayProbability,
        riskLevel: recalculation.riskLevel,
        topRiskFactors: recalculation.topRiskFactors,
        positiveFactors: recalculation.positiveFactors,
        stageRisks: recalculation.stageRisks,
        lastUpdatedDate: new Date().toISOString().slice(0, 10),
        pendingDataUpdate: reviewedUpdate,
        auditTrail: [newAuditEntry, ...project.auditTrail],
      };

      onUpdateProject(updatedProject);
      try {
        await appendAuditLogEntry({
          id: newAuditEntry.id,
          timestamp,
          projectId: project.id,
          projectName: project.name,
          officerName: newAuditEntry.officerName,
          officerRole: currentRole,
          action: newAuditEntry.action,
          fieldChanged: newAuditEntry.fieldChanged,
          oldValue: newAuditEntry.oldValue,
          newValue: newAuditEntry.newValue,
          reason: reviewRemarks.trim(),
        });
      } catch (e) {
        console.error(e);
      }

      setReviewSuccessMsg('Data update approved! Project parameters updated and risk profile recomputed.');
      setReviewRemarks('');
      setTimeout(() => setReviewSuccessMsg(null), 6000);
    } else {
      const reviewedUpdate: ProjectDataUpdate = {
        ...pending,
        status: 'REJECTED',
        reviewedBy: currentUser?.username || roleInfo.title,
        reviewedAt: timestamp,
        reviewRemarks: reviewRemarks.trim(),
      };

      const newAuditEntry: AuditEntry = {
        id: `AUD-${Date.now()}`,
        timestamp,
        officerName: currentUser?.username || roleInfo.title,
        officerRole: currentRole,
        action: 'Data Update Proposal Rejected',
        fieldChanged: 'Data Update Proposal',
        oldValue: 'PENDING',
        newValue: 'REJECTED',
        reason: reviewRemarks.trim(),
      };

      const updatedProject: Project = {
        ...project,
        pendingDataUpdate: reviewedUpdate,
        auditTrail: [newAuditEntry, ...project.auditTrail],
      };

      onUpdateProject(updatedProject);
      try {
        await appendAuditLogEntry({
          id: newAuditEntry.id,
          timestamp,
          projectId: project.id,
          projectName: project.name,
          officerName: newAuditEntry.officerName,
          officerRole: currentRole,
          action: newAuditEntry.action,
          fieldChanged: newAuditEntry.fieldChanged,
          oldValue: newAuditEntry.oldValue,
          newValue: newAuditEntry.newValue,
          reason: reviewRemarks.trim(),
        });
      } catch (e) {
        console.error(e);
      }

      setReviewSuccessMsg('Data update proposal rejected. Milestone values remain unchanged.');
      setReviewRemarks('');
      setTimeout(() => setReviewSuccessMsg(null), 6000);
    }
  };

  // Handle Competent Authority Decision Submission (Manual Order Number Required)
  const handleRecordAuthorityDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumberInput.trim()) {
      setOrderNumberError('Competent Authority Decision / Order Reference Number is mandatory. Manual entry required.');
      return;
    }
    setOrderNumberError(null);

    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';
    const orderNo = orderNumberInput.trim();

    const decision: AuthorityDecision = {
      id: `DEC-${Date.now()}`,
      recordedBy: currentUser?.username || roleInfo.title,
      authorityTitle: 'Competent Authority for Land Acquisition (CALA)',
      orderNumber: orderNo,
      date: timestamp,
      decisionType,
      statutoryReference: statutoryRef,
      instructions: decisionInstructions,
      reviewMilestoneDate: reviewMilestone,
    };

    const newAuditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp,
      officerName: currentUser?.username || roleInfo.title,
      officerRole: currentRole,
      action: `Authority Decision Recorded: ${orderNo}`,
      fieldChanged: 'Authority Decision Record',
      oldValue: project.authorityDecision ? project.authorityDecision.orderNumber : 'None',
      newValue: orderNo,
      reason: decisionInstructions,
    };

    const updatedProject: Project = {
      ...project,
      authorityDecision: decision,
      auditTrail: [newAuditEntry, ...project.auditTrail],
    };

    onUpdateProject(updatedProject);
    try {
      await appendAuditLogEntry({
        id: newAuditEntry.id,
        timestamp,
        projectId: project.id,
        projectName: project.name,
        officerName: newAuditEntry.officerName,
        officerRole: currentRole,
        action: newAuditEntry.action,
        fieldChanged: newAuditEntry.fieldChanged,
        oldValue: newAuditEntry.oldValue,
        newValue: newAuditEntry.newValue,
        reason: decisionInstructions,
      });
    } catch (e) {
      console.error(e);
    }

    setDecisionRecorded(true);
    setTimeout(() => setDecisionRecorded(false), 5000);
  };

  // Handle Add Action Item
  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    const newAction: ActionItem = {
      id: `ACT-${Date.now()}`,
      title: newActionTitle.trim(),
      recommendationSource: 'Officer Assigned Task',
      assignedOfficer: newActionAssignee,
      assignedRole: 'Project LAO',
      dueDate: newActionDueDate,
      status: 'In Progress',
      priority: newActionPriority,
      notes: 'Initiated via Decision Support Portal.',
      createdDate: timestamp,
    };

    const newAuditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN') + ' IST',
      officerName: roleInfo.title,
      officerRole: currentRole,
      action: `Created Action Item: ${newAction.title}`,
      reason: 'Administrative risk mitigation follow-up.',
    };

    const updatedProject: Project = {
      ...project,
      actionItems: [newAction, ...project.actionItems],
      auditTrail: [newAuditEntry, ...project.auditTrail],
    };

    onUpdateProject(updatedProject);
    setNewActionTitle('');
    setShowAddAction(false);
  };

  const handleUpdateActionStatus = (actionId: string, newStatus: ActionItem['status']) => {
    const updatedActions = project.actionItems.map((act) =>
      act.id === actionId ? { ...act, status: newStatus } : act
    );

    const newAuditEntry: AuditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN') + ' IST',
      officerName: roleInfo.title,
      officerRole: currentRole,
      action: `Action Item ${actionId} Status changed to ${newStatus}`,
      reason: 'Officer progress update.',
    };

    onUpdateProject({
      ...project,
      actionItems: updatedActions,
      auditTrail: [newAuditEntry, ...project.auditTrail],
    });
  };

  const isFlagship = project.id === 'NH-MH-001';

  return (
    <div className="space-y-6 pb-16">
      {/* Back Button Navigation */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123B63] hover:text-blue-900 bg-white hover:bg-blue-50 border border-slate-300 px-3 py-1.5 rounded transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel || 'Back'}</span>
        </button>
      </div>

      {/* Project Statutory Dossier Header */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#123B63] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {project.id}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {project.type}
              </span>
              {isFlagship && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  Flagship Project
                </span>
              )}
              {project.verificationStatus === 'VERIFIED' ? (
                <span className="inline-flex items-center gap-1 text-[#287D4A] font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Check className="w-3 h-3 text-[#287D4A]" />
                  <span>Verified Dossier ✓</span>
                </span>
              ) : (
                <span className="text-amber-800 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Verification Pending
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
              {project.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.tehsil} Tehsil, {project.district} District, {project.state}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {project.agency}
              </span>
              <span>&bull;</span>
              <span>
                Last Updated: <strong>{project.lastUpdatedDate}</strong>
              </span>
            </div>
          </div>

          {/* Current Stage Badge */}
          <div className="self-start md:self-auto bg-slate-50 border border-slate-200 px-3.5 py-2 rounded text-right shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              {t.currentStageLabel}
            </div>
            <div className="text-sm font-bold text-[#123B63] mt-0.5">
              {stageTranslations[currentLang]?.[project.currentStage] || project.currentStage}
            </div>
            <div className="text-[11px] text-slate-500">
              {project.daysAtCurrentStage} days at this statutory stage
            </div>
          </div>
        </div>

        {/* Statutory Scope Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Land Required vs Acquired
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {project.landAcquiredHectares} / {project.landRequiredHectares} Ha
            </span>
            <span className="text-[11px] text-slate-500 block">
              ({Math.round((project.landAcquiredHectares / project.landRequiredHectares) * 100)}% RoW acquired)
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Compensation Sanctioned
            </span>
            <span className="font-bold text-slate-900 text-sm">
              ₹{project.compensationPaidCr} / ₹{project.compensationTotalCr} Cr
            </span>
            <span className="text-[11px] text-slate-500 block">
              (₹{project.compensationPendingCr} Cr pending disbursement)
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Affected Population
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {project.affectedFamilies.toLocaleString('en-IN')} Families
            </span>
            <span className="text-[11px] text-slate-500 block">
              {project.landownersCount.toLocaleString('en-IN')} Title Holders
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Court / Tribunal Disputes
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {project.legalDisputesCount} Petitions ({project.legalSeverity} Severity)
            </span>
            <span className="text-[11px] text-slate-500 block">
              {project.approvalDelayDays} days approval lag
            </span>
          </div>
        </div>

        {/* Project Officer Data Update Trigger & Pending Proposal Review */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {project.pendingDataUpdate && project.pendingDataUpdate.status === 'PENDING' ? (
              <span className="inline-flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Milestone update proposal pending scrutiny by Verification Officer (SLAO)
              </span>
            ) : (
              <span>Statutory metrics are authenticated against state land revenue records.</span>
            )}
          </div>

          {userPerms.canUpdateData && (
            <button
              onClick={() => {
                setProposedCompPaid(project.compensationPaidCr);
                setProposedDelayDays(project.approvalDelayDays);
                setProposedRrPct(project.rrProgressPct);
                setProposedPossessionPct(project.possessionProgressPct);
                setProposedDocPct(project.documentationCompletenessPct);
                setUpdateJustification('');
                setUpdateError(null);
                setShowUpdateModal(true);
              }}
              className="inline-flex items-center gap-1.5 bg-[#123B63] hover:bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded transition shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Submit Milestone Data Update</span>
            </button>
          )}
        </div>

        {/* Success message banners */}
        {updateSuccessMsg && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-[#123B63]" />
            <span>{updateSuccessMsg}</span>
          </div>
        )}

        {reviewSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{reviewSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* PENDING DATA UPDATE VERIFICATION CARD */}
      {project.pendingDataUpdate && project.pendingDataUpdate.status === 'PENDING' && (
        <div className="bg-amber-50/70 border-2 border-amber-400 rounded-md p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pending Milestone Data Update Proposal (Governance Gate)
                </h3>
                <p className="text-xs text-slate-600">
                  Submitted by <strong>{project.pendingDataUpdate.submittedBy}</strong> ({project.pendingDataUpdate.submittedRole}) on {project.pendingDataUpdate.submittedAt}
                </p>
              </div>
            </div>
            <span className="bg-amber-200 text-amber-900 font-bold text-[11px] px-2.5 py-0.5 rounded uppercase tracking-wider">
              Status: PENDING SCRUTINY
            </span>
          </div>

          <div className="bg-white p-3 rounded border border-amber-200 text-xs">
            <span className="font-bold text-slate-700 block mb-1">Field Justification / Gazette Reference:</span>
            <p className="text-slate-800 italic">"{project.pendingDataUpdate.justification}"</p>
          </div>

          {/* Comparison Table */}
          <div className="border border-amber-200 rounded overflow-hidden bg-white text-xs">
            <table className="w-full text-left">
              <thead className="bg-amber-100/60 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Statutory Metric</th>
                  <th className="py-2 px-3">Current Active Value</th>
                  <th className="py-2 px-3 text-[#123B63]">Proposed Milestone Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 text-slate-700">
                <tr>
                  <td className="py-2 px-3 font-medium">Compensation Paid</td>
                  <td className="py-2 px-3">₹{project.compensationPaidCr} Cr ({Math.round((project.compensationPaidCr / project.compensationTotalCr) * 100)}%)</td>
                  <td className="py-2 px-3 font-bold text-[#123B63]">₹{project.pendingDataUpdate.compensationPaidCr} Cr ({Math.round((project.pendingDataUpdate.compensationPaidCr / project.compensationTotalCr) * 100)}%)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Approval Delay</td>
                  <td className="py-2 px-3">{project.approvalDelayDays} days</td>
                  <td className="py-2 px-3 font-bold text-[#123B63]">{project.pendingDataUpdate.approvalDelayDays} days</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">R&R Progress</td>
                  <td className="py-2 px-3">{project.rrProgressPct}%</td>
                  <td className="py-2 px-3 font-bold text-[#123B63]">{project.pendingDataUpdate.rrProgressPct}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Land Possession</td>
                  <td className="py-2 px-3">{project.possessionProgressPct}%</td>
                  <td className="py-2 px-3 font-bold text-[#123B63]">{project.pendingDataUpdate.possessionProgressPct}%</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium">Documentation Completeness</td>
                  <td className="py-2 px-3">{project.documentationCompletenessPct}%</td>
                  <td className="py-2 px-3 font-bold text-[#123B63]">{project.pendingDataUpdate.documentationCompletenessPct}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Verification Officer Decision Form */}
          {userPerms.canVerify ? (
            <div className="bg-white p-3.5 rounded border border-amber-300 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Verification Officer Scrutiny Desk (SLAO)
                </span>
                <span className="text-[11px] text-slate-500">
                  Active Officer: <strong>{currentUser?.username || roleInfo.title}</strong>
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Statutory Scrutiny Remarks (Mandatory for audit trail):
                </label>
                <input
                  type="text"
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="e.g., Verified against treasury DBT scrolls & Talathi possession panchnama dated 2026-09-20."
                  className="w-full text-xs p-2 rounded border border-slate-300 focus:ring-1 focus:ring-[#123B63] focus:outline-none"
                />
                {reviewError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">{reviewError}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleReviewDataUpdate('APPROVE')}
                  className="inline-flex items-center gap-1.5 bg-[#287D4A] hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded transition shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Recalculate Risk</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewDataUpdate('REJECT')}
                  className="inline-flex items-center gap-1.5 bg-[#C62828] hover:bg-red-800 text-white text-xs font-bold px-3.5 py-1.5 rounded transition shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject Proposal</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-900 bg-amber-100/70 p-2.5 rounded border border-amber-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-800 shrink-0" />
              <span>
                This proposal is awaiting verification by the <strong>Verification Officer (SLAO)</strong>. Only authorized verification officers can approve and trigger risk recalculation.
              </span>
            </div>
          )}
        </div>
      )}

      {/* MODAL: SUBMIT DATA UPDATE PROPOSAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-[#123B63] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm font-serif">Submit Milestone Data Update Proposal</h3>
              </div>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDataUpdate} className="p-5 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded text-slate-700">
                <strong>Human-in-the-Loop Gate:</strong> Updates submitted here will enter status <strong>PENDING</strong> and must be verified by the Verification Officer before taking effect.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Compensation Paid (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={project.compensationTotalCr}
                    value={proposedCompPaid}
                    onChange={(e) => setProposedCompPaid(Number(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Sanctioned: ₹{project.compensationTotalCr} Cr</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Approval Delay (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={proposedDelayDays}
                    onChange={(e) => setProposedDelayDays(Number(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Current: {project.approvalDelayDays} days</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    R&R Progress (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={proposedRrPct}
                    onChange={(e) => setProposedRrPct(Number(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Current: {project.rrProgressPct}%</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Land Possession (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={proposedPossessionPct}
                    onChange={(e) => setProposedPossessionPct(Number(e.target.value))}
                    className="w-full p-2 rounded border border-slate-300 bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Current: {project.possessionProgressPct}%</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Documentation Completeness (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={proposedDocPct}
                  onChange={(e) => setProposedDocPct(Number(e.target.value))}
                  className="w-full p-2 rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Justification / Field Reference *
                </label>
                <textarea
                  rows={2}
                  value={updateJustification}
                  onChange={(e) => setUpdateJustification(e.target.value)}
                  placeholder="e.g. Completed Section 19 declaration verification and distributed ₹12.5 Cr DBT to 48 landowners in Lonikand village."
                  className="w-full p-2 rounded border border-slate-300 bg-white"
                />
                {updateError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-0.5">{updateError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 bg-[#123B63] hover:bg-blue-900 text-white font-bold px-4 py-1.5 rounded transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Proposal (Status: PENDING)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 1: AI RISK ASSESSMENT BANNER */}
      <div
        className={`border rounded-md p-5 shadow-xs transition ${
          project.riskLevel === 'CRITICAL'
            ? 'bg-red-50/60 border-red-300'
            : project.riskLevel === 'HIGH'
            ? 'bg-orange-50/60 border-orange-300'
            : 'bg-amber-50/60 border-amber-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                project.riskLevel === 'CRITICAL'
                  ? 'bg-red-600 text-white'
                  : project.riskLevel === 'HIGH'
                  ? 'bg-orange-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  AI Risk Assessment
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-xs font-semibold text-slate-500">
                  Calibrated Prediction Engine
                </span>
              </div>

              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-extrabold text-slate-900 font-serif">
                  {project.delayProbability}%
                </span>
                <span
                  className={`text-sm font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                    project.riskLevel === 'CRITICAL'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : project.riskLevel === 'HIGH'
                      ? 'bg-orange-100 text-orange-800 border-orange-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {project.riskLevel} RISK
                </span>
                <span className="text-xs text-slate-600 font-medium">
                  {t.delayProbabilityLabel}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {t.modelDisclaimer}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: WHY IS THIS PROJECT AT RISK? (Explainable Factor Attribution) */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#123B63]" />
            <h2 className="text-base font-bold text-slate-900">
              {t.whyAtRisk}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.whyAtRiskExpl}
          </p>
        </div>

        {/* Mathematical Calculation Formula Breakdown */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-mono text-slate-800">
            <span className="font-bold text-slate-900">Calculation: </span>
            Base (10 pts) + Factors (+{project.topRiskFactors.reduce((acc, f) => acc + f.contributionPercent, 0)} pts) − Mitigations ({Math.abs(project.positiveFactors.reduce((acc, pf) => acc + pf.mitigationPercent, 0))} pts) = <span className="font-bold text-[#123B63]">{project.riskScore} points</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
            Base + factors − mitigations = final score
          </span>
        </div>

        {/* Contributing Risk Factors List */}
        <div className="space-y-2.5">
          {project.topRiskFactors.map((factor) => {
            const isHigh = factor.severity === 'high';
            return (
              <div
                key={factor.id}
                className="p-3.5 rounded border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isHigh ? 'bg-[#C62828]' : 'bg-[#D96C00]'
                      }`}
                    />
                    <span className="font-bold text-xs text-slate-900">
                      {factor.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        isHigh
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {isHigh ? 'High Contribution' : 'Medium Contribution'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 pl-4.5">
                    {factor.description}
                  </div>
                </div>

                <div className="text-right sm:shrink-0 pl-4.5 sm:pl-0">
                  <div className="font-mono text-xs font-bold text-[#C62828]">
                    +{factor.contributionPercent} points
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {factor.metricValue}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Positive Mitigating Factors */}
        {project.positiveFactors.length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#287D4A] mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#287D4A]" />
              {t.positiveMitigatingFactors}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {project.positiveFactors.map((pf) => (
                <div
                  key={pf.id}
                  className="p-2.5 rounded border border-emerald-200 bg-emerald-50/40 text-xs"
                >
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>{pf.name}</span>
                    <span className="font-mono text-[#287D4A]">
                      {pf.mitigationPercent} points
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {pf.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: STAGE-WISE ACQUISITION LIFECYCLE ASSESSMENT */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#123B63]" />
              <h2 className="text-base font-bold text-slate-900">
                {t.stageWiseRisk}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Full 11-stage statutory acquisition lifecycle showing completed milestones, current bottleneck, and downstream projection.
            </p>
          </div>
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Illustrative benchmarks
            </span>
          </div>
        </div>

        {/* Horizontal Lifecycle Progress Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-11 gap-2 text-center text-xs">
          {project.stageRisks.map((st, idx) => {
            const isCompleted = st.status === 'Completed';
            const isCurrent = st.stage === project.currentStage;
            const isDelayed = st.status === 'Delayed';

            let pillStyle = 'bg-slate-100 text-slate-600 border-slate-200';
            if (isCompleted) {
              pillStyle = 'bg-emerald-50 text-[#287D4A] border-emerald-300 font-semibold';
            } else if (isCurrent) {
              pillStyle = isDelayed
                ? 'bg-red-50 text-[#C62828] border-red-400 ring-2 ring-red-400 font-bold'
                : 'bg-blue-50 text-[#123B63] border-blue-400 ring-2 ring-blue-400 font-bold';
            }

            return (
              <div
                key={st.stage}
                className={`p-2 rounded border flex flex-col justify-between min-h-[88px] ${pillStyle}`}
              >
                <div>
                  <div className="text-[10px] uppercase font-mono font-bold text-slate-500">
                    Step {idx + 1}
                  </div>
                  <div className="font-bold text-[11px] mt-0.5 leading-tight">
                    {stageTranslations[currentLang]?.[st.stage] || st.stage}
                  </div>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-200/60 text-[10px]">
                  {isCompleted ? (
                    <span className="text-[#287D4A] font-bold">Done ✓</span>
                  ) : isCurrent ? (
                    <span className="text-[#C62828] font-bold">Active Bottleneck</span>
                  ) : (
                    <span className="text-slate-400">Upcoming</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Stage Bottleneck Description */}
        <div className="bg-amber-50/60 border border-amber-200 p-3 rounded text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Current Stage Bottleneck Analysis:</span>{' '}
            Project is in <strong>{project.currentStage}</strong> stage ({project.daysAtCurrentStage} days elapsed).
            Primary statutory impediment:{' '}
            <span className="font-semibold">
              ₹{project.compensationPendingCr} Cr compensation pending for{' '}
              {project.landownersCount - Math.round((project.compensationPaidCr / project.compensationTotalCr) * project.landownersCount)} title holders across Haveli taluka.
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: WHAT-IF SCENARIO SIMULATION */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#123B63]" />
              <h2 className="text-base font-bold text-slate-900">
                {t.whatIfSimulation}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.whatIfSimulationSub}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetSimulation}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded border border-slate-200 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetSimulationBtn}</span>
            </button>
            <button
              onClick={handleRecalculateSimulation}
              className="flex items-center gap-1 bg-[#123B63] hover:bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.recalculateBtn}</span>
            </button>
          </div>
        </div>

        {/* Governance Disclaimer */}
        <div className="bg-amber-50/90 border border-amber-200 text-amber-900 text-xs px-3.5 py-2 rounded flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Model-based scenario, not a prediction of the actual outcome.</strong> The What-If simulator is a hypothetical scenario exploration tool and does not alter official project records.
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          {/* Compensation Progress Slider */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>{t.compensationProgressSlider}</span>
              <span className="font-mono text-sm text-[#123B63]">
                {compProgressSim}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={compProgressSim}
              onChange={(e) => setCompProgressSim(Number(e.target.value))}
              className="w-full accent-[#123B63] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Actual: {Math.round((project.compensationPaidCr / project.compensationTotalCr) * 100)}%</span>
              <span>Target: 85%+</span>
            </div>
          </div>

          {/* Statutory Approval Delay Slider */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>{t.approvalDelaySlider}</span>
              <span className="font-mono text-sm text-[#123B63]">
                {approvalDelaySim} {t.days}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={approvalDelaySim}
              onChange={(e) => setApprovalDelaySim(Number(e.target.value))}
              className="w-full accent-[#123B63] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Actual: {project.approvalDelayDays} days</span>
              <span>Normative: &lt;30 days</span>
            </div>
          </div>

          {/* Active Legal Disputes Slider */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>{t.legalCasesSlider}</span>
              <span className="font-mono text-sm text-[#123B63]">
                {legalCasesSim} Petitions
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={legalCasesSim}
              onChange={(e) => setLegalCasesSim(Number(e.target.value))}
              className="w-full accent-[#123B63] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Actual: {project.legalDisputesCount} petitions</span>
              <span>Stay Vacation</span>
            </div>
          </div>

          {/* R&R Package Distribution Slider */}
          <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>{t.rrProgressSlider}</span>
              <span className="font-mono text-sm text-[#123B63]">
                {rrProgressSim}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={rrProgressSim}
              onChange={(e) => setRrProgressSim(Number(e.target.value))}
              className="w-full accent-[#123B63] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Actual: {project.rrProgressPct}%</span>
              <span>Target: 90%+</span>
            </div>
          </div>
        </div>

        {/* Simulation Outcome Card */}
        {simulationResult && (
          <div className="p-4 rounded border border-blue-200 bg-blue-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-[#123B63] uppercase tracking-wider">
                  {t.predictedOutcome}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 line-through">
                  {project.delayProbability}%
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xl font-bold text-[#123B63] font-serif">
                  {simulationResult.simulatedScore}%
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    simulationResult.delta < 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {simulationResult.delta > 0 ? '+' : ''}
                  {simulationResult.delta}% Risk Delta
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 italic">
              {t.simulationDisclaimer}
            </p>
          </div>
        )}
      </div>

      {/* SECTION 5: SUGGESTED ACTIONS FOR OFFICER REVIEW */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {t.suggestedActions}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.suggestedActionsSub}
          </p>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-3 rounded border border-blue-100 bg-blue-50/40 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#123B63] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
              1
            </div>
            <div>
              <div className="font-bold text-slate-900">
                Convene Special Gram Panchayat Title Verification Camp (Wagholi & Shivane)
              </div>
              <div className="text-slate-600 mt-0.5">
                Address pending succession mutations for 342 landowners with District Registrar and local Talathis to accelerate Direct Benefit Transfer (DBT) disbursement.
              </div>
            </div>
          </div>

          <div className="p-3 rounded border border-blue-100 bg-blue-50/40 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#123B63] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
              2
            </div>
            <div>
              <div className="font-bold text-slate-900">
                File Counter-Affidavit in Bombay High Court Writ Petition 4812/2026
              </div>
              <div className="text-slate-600 mt-0.5">
                Submit revised solatium and market value determination under Section 26-30 of RFCTLARR Act to vacate interim stay on 4.2 Ha in Shivane village before 28-Sep-2026 hearing.
              </div>
            </div>
          </div>

          <div className="p-3 rounded border border-blue-100 bg-blue-50/40 flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#123B63] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
              3
            </div>
            <div>
              <div className="font-bold text-slate-900">
                Expedite Interdepartmental Forest Stage-II Working Permission
              </div>
              <div className="text-slate-600 mt-0.5">
                Escalate compensatory afforestation handover file in Junnar to State Level Forest Advisory Committee to clear Khadakwasla RoW stretch.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: SUPPORTING EVIDENCE & VERIFICATION WORKFLOW */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#123B63]" />
              <h2 className="text-base font-bold text-slate-900">
                {t.evidenceAndVerification}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Statutory documents uploaded by Project LAO. Verification must be performed per document with mandatory scrutiny remarks.
            </p>
          </div>

          <div className="text-xs font-semibold flex items-center gap-2">
            <span>Dossier Status:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                project.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-100 text-[#287D4A]'
                  : project.verificationStatus === 'CORRECTION_REQUESTED'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {project.verificationStatus}
            </span>
          </div>
        </div>

        {/* Verification feedback banner */}
        {verificationFeedback && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{verificationFeedback}</span>
          </div>
        )}

        {/* Evidence Documents Table with Per-Document Verification */}
        <div className="border border-slate-200 rounded overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Document Title & Reference</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Uploaded</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Officer Scrutiny & Remarks</th>
                {userPerms.canVerify && <th className="py-2.5 px-3 text-right">Verification Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {project.evidenceDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 align-top">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{doc.title}</div>
                    <div className="font-mono text-[10px] text-slate-500">
                      Ref: {doc.referenceNo} &bull; {doc.fileSize}
                    </div>
                  </td>
                  <td className="py-3 px-3">{doc.type}</td>
                  <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{doc.uploadedDate}</td>
                  <td className="py-3 px-3">
                    {doc.status === 'Verified' ? (
                      <span className="text-[#287D4A] bg-emerald-50 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#287D4A]" /> Verified
                      </span>
                    ) : doc.status === 'Correction Requested' ? (
                      <span className="text-orange-700 bg-orange-50 border border-orange-200 text-[11px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-orange-600" /> Correction Needed
                      </span>
                    ) : (
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 text-[11px] font-semibold px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" /> Pending Scrutiny
                      </span>
                    )}
                    {doc.verifiedBy && (
                      <div className="text-[10px] text-slate-500 mt-1">
                        by {doc.verifiedBy} ({doc.verifiedDate})
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    {userPerms.canVerify ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={docRemarks[doc.id] !== undefined ? docRemarks[doc.id] : doc.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDocRemarks((prev) => ({ ...prev, [doc.id]: val }));
                            if (docErrors[doc.id]) {
                              setDocErrors((prev) => {
                                const copy = { ...prev };
                                delete copy[doc.id];
                                return copy;
                              });
                            }
                          }}
                          placeholder="Enter mandatory scrutiny remarks..."
                          className="w-full text-xs p-1.5 rounded border border-slate-300 focus:ring-1 focus:ring-[#123B63] focus:outline-none bg-white"
                        />
                        {docErrors[doc.id] && (
                          <p className="text-[10px] text-red-600 font-semibold">{docErrors[doc.id]}</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-600 text-[11px]">
                        {doc.remarks || 'No objections recorded.'}
                      </div>
                    )}
                  </td>
                  {userPerms.canVerify && (
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVerifyDocument(doc.id, 'Verified')}
                          className="inline-flex items-center gap-1 bg-[#287D4A] hover:bg-emerald-800 text-white text-[11px] font-bold px-2.5 py-1 rounded transition shadow-xs"
                          title="Verify Document"
                        >
                          <Check className="w-3 h-3" />
                          <span>Verify</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyDocument(doc.id, 'Correction Requested')}
                          className="inline-flex items-center gap-1 bg-[#D96C00] hover:bg-orange-800 text-white text-[11px] font-bold px-2.5 py-1 rounded transition shadow-xs"
                          title="Request Document Correction"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Correction</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Verification Summary & Guidance Footer */}
        <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="text-slate-600">
            <strong>Statutory Rule:</strong> Every statutory instrument (gazette notification, land valuation, social impact report) must be scrutinized individually with mandatory remarks before dossier certification.
          </div>
          <div className="text-[11px] text-slate-500 shrink-0">
            {project.evidenceDocuments.filter((d) => d.status === 'Verified').length} of {project.evidenceDocuments.length} Documents Verified
          </div>
        </div>
      </div>

      {/* SECTION 7: COMPETENT AUTHORITY (CALA) ADMINISTRATIVE DECISION */}
      <div className="bg-white border-2 border-[#123B63] rounded p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-[#123B63]" />
              <h2 className="text-base font-bold text-slate-900">
                {t.authorityDecisionTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.authorityDecisionSub} (The AI assists; human authority holds final decision).
            </p>
          </div>

          <div className="bg-blue-50 px-2.5 py-1 rounded text-xs font-bold text-[#123B63] border border-blue-200">
            Competent Authority Desk
          </div>
        </div>

        {/* Statutory Governance Disclaimer */}
        <div className="bg-amber-50/90 border border-amber-300 text-amber-900 text-xs px-3.5 py-2.5 rounded flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Statutory Governance Disclaimer:</strong> BhooNiti records officer decisions. It does not issue orders or notifications.
          </div>
        </div>

        {/* Existing Recorded Decision Display */}
        {project.authorityDecision ? (
          <div className="p-4 rounded bg-emerald-50/70 border border-emerald-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#287D4A] uppercase tracking-wider">
                Active Authority Decision: {project.authorityDecision.orderNumber}
              </span>
              <span className="text-[11px] text-slate-500">
                Dated: {project.authorityDecision.date}
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {project.authorityDecision.decisionType}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {project.authorityDecision.instructions}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-600 pt-1 border-t border-emerald-200/60">
              <span>
                Statutory Reference:{' '}
                <strong>{project.authorityDecision.statutoryReference}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Next Milestone Review:{' '}
                <strong>{project.authorityDecision.reviewMilestoneDate}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Recorded By: <strong>{project.authorityDecision.recordedBy}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded border border-slate-200">
            No formal authority decision has been recorded for this project yet. Use the interface below to log a decision.
          </div>
        )}

        {/* Form to Record Competent Authority Decision */}
        {userPerms.canRecordDecision ? (
          <form
            onSubmit={handleRecordAuthorityDecision}
            className="space-y-3 pt-2 text-xs"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Administrative Decision Directive
                </label>
                <select
                  value={decisionType}
                  onChange={(e) =>
                    setDecisionType(e.target.value as AuthorityDecision['decisionType'])
                  }
                  className="w-full p-2 rounded border border-slate-300 bg-white"
                >
                  <option value="Direct Special Disbursement Camp">
                    Direct Special Disbursement Camp
                  </option>
                  <option value="Convene Section 15 Summary Hearing">
                    Convene Section 15 Summary Hearing
                  </option>
                  <option value="Interdepartmental Coordination Resolution">
                    Interdepartmental Coordination Resolution
                  </option>
                  <option value="Expedite Joint Measurement Survey">
                    Expedite Joint Measurement Survey
                  </option>
                  <option value="Escalate to District Land Advisory Committee">
                    Escalate to District Land Advisory Committee
                  </option>
                  <option value="Refer to Legal Cell for Stay Vacation">
                    Refer to Legal Cell for Stay Vacation
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Decision / Order Number (Manual Entry Required) *
                </label>
                <input
                  type="text"
                  value={orderNumberInput}
                  onChange={(e) => {
                    setOrderNumberInput(e.target.value);
                    if (orderNumberError) setOrderNumberError(null);
                  }}
                  placeholder="e.g. CALA/PUN/2026/042"
                  className="w-full p-2 rounded border border-slate-300 bg-white"
                />
                {orderNumberError && (
                  <p className="text-[10px] text-red-600 font-semibold mt-0.5">{orderNumberError}</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Statutory Reference / Section
                </label>
                <input
                  type="text"
                  value={statutoryRef}
                  onChange={(e) => setStatutoryRef(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Statutory Instructions & Executive Order Text
              </label>
              <textarea
                rows={2}
                value={decisionInstructions}
                onChange={(e) => setDecisionInstructions(e.target.value)}
                className="w-full p-2 rounded border border-slate-300 bg-white"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Next Review Milestone:</span>
                <input
                  type="date"
                  value={reviewMilestone}
                  onChange={(e) => setReviewMilestone(e.target.value)}
                  className="p-1.5 rounded border border-slate-300 bg-white"
                />
              </div>

              <button
                type="submit"
                className="bg-[#123B63] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded transition shadow-xs"
              >
                Record Authority Decision & Append to Audit Trail
              </button>
            </div>

            {decisionRecorded && (
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded font-bold">
                ✓ Competent Authority decision formally logged into the immutable audit trail!
              </div>
            )}
          </form>
        ) : (
          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded">
            <strong>Access Note:</strong> Recording authority decisions is restricted to the <strong>Competent Authority for Land Acquisition (CALA)</strong>. Your current role ({roleInfo.title}) is view-only for this section.
          </div>
        )}
      </div>

      {/* SECTION 8: OFFICER ACTION TRACKING SYSTEM */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#123B63]" />
              <h2 className="text-base font-bold text-slate-900">
                {t.actionTrackerTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.actionTrackerSub}
            </p>
          </div>

          <button
            onClick={() => setShowAddAction(!showAddAction)}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded border border-slate-300 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addAction}</span>
          </button>
        </div>

        {/* Add Action Item Collapsible Form */}
        {showAddAction && (
          <form
            onSubmit={handleCreateAction}
            className="p-4 bg-slate-50 rounded border border-slate-200 space-y-3 text-xs"
          >
            <div className="font-bold text-slate-800">
              Create New Administrative Task
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Action Description
              </label>
              <input
                type="text"
                required
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                placeholder="e.g., Hold joint physical valuation inspection with Talathi..."
                className="w-full p-2 rounded border border-slate-300 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Assignee
                </label>
                <input
                  type="text"
                  value={newActionAssignee}
                  onChange={(e) => setNewActionAssignee(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={newActionDueDate}
                  onChange={(e) => setNewActionDueDate(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Priority
                </label>
                <select
                  value={newActionPriority}
                  onChange={(e) =>
                    setNewActionPriority(e.target.value as ActionItem['priority'])
                  }
                  className="w-full p-2 rounded border border-slate-300 bg-white"
                >
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddAction(false)}
                className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#123B63] text-white font-bold"
              >
                Save Action
              </button>
            </div>
          </form>
        )}

        {/* Action Items List */}
        <div className="space-y-2.5 text-xs">
          {project.actionItems.map((act) => (
            <div
              key={act.id}
              className="p-3.5 rounded border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                      act.priority === 'Urgent'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : act.priority === 'High'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {act.priority}
                  </span>
                  <span className="font-bold text-slate-900">{act.title}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                  <span>
                    Assigned: <strong>{act.assignedOfficer}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Due: <strong>{act.dueDate}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>Source: {act.recommendationSource}</span>
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <select
                  value={act.status}
                  onChange={(e) =>
                    handleUpdateActionStatus(act.id, e.target.value as ActionItem['status'])
                  }
                  className="p-1.5 rounded border border-slate-300 bg-white font-semibold text-xs"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 9: HISTORICAL RISK TREND */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#123B63]" />
            <h2 className="text-base font-bold text-slate-900">
              {t.riskTrendTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Progression of estimated delay probability across statutory lifecycle milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {project.historicalRiskTrend.map((point, idx) => {
            const isLatest = idx === project.historicalRiskTrend.length - 1;
            return (
              <div
                key={point.date}
                className={`p-3 rounded border ${
                  isLatest
                    ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono">
                  <span>{point.date}</span>
                  {isLatest ? (
                    <span className="font-bold text-amber-800 uppercase bg-amber-100 px-1.5 py-0.5 rounded text-[9px]">
                      Current
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[9px] uppercase font-medium">
                      illustrative history
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-slate-900 font-serif mt-1">
                  {point.delayProbability}%
                </div>
                <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  {point.milestone}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 10: IMMUTABLE AUDIT TRAIL */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {t.auditTrailTitle}
          </h2>
          <span className="text-xs text-slate-500">
            {project.auditTrail.length} recorded entries
          </span>
        </div>

        <div className="border border-slate-200 rounded overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Officer & Role</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Change Summary</th>
                <th className="py-2 px-3">Reason / Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {project.auditTrail.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-mono text-[10px] text-slate-500">
                    {entry.timestamp}
                  </td>
                  <td className="py-2 px-3">
                    <div className="font-bold text-slate-800">{entry.officerName}</div>
                    <div className="text-[10px] text-slate-500">{entry.officerRole}</div>
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    {entry.action}
                  </td>
                  <td className="py-2 px-3 text-[11px]">
                    {entry.fieldChanged ? (
                      <span>
                        {entry.fieldChanged}:{' '}
                        <span className="line-through text-slate-400">
                          {entry.oldValue}
                        </span>{' '}
                        &rarr; <strong className="text-[#123B63]">{entry.newValue}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-400">&mdash;</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-600 max-w-xs">
                    {entry.reason}
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
