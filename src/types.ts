export type UserRole =
  | 'DISTRICT_OFFICER'
  | 'STATE_OFFICER'
  | 'PROJECT_OFFICER'
  | 'MINISTRY_OFFICER'
  | 'VERIFICATION_OFFICER'
  | 'COMPETENT_AUTHORITY'
  | 'ML_DATA_TEAM'
  | 'SYSTEM_ADMIN'
  | 'CITIZEN';

export type Language =
  | 'en'
  | 'hi'
  | 'mr'
  | 'gu'
  | 'bn'
  | 'ta'
  | 'te'
  | 'kn'
  | 'ml'
  | 'pa'
  | 'or'
  | 'as'
  | 'ur';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type VerificationStatus = 'VERIFIED' | 'PENDING' | 'CORRECTION_REQUESTED' | 'REJECTED';

export type ProjectStage =
  | 'Proposal'
  | 'Survey'
  | 'SIA'
  | 'Notification'
  | 'Objections'
  | 'Valuation'
  | 'Award'
  | 'Compensation'
  | 'RR'
  | 'Possession'
  | 'Handover';

export type ProjectType =
  | 'National Highway'
  | 'State Highway'
  | 'Railway'
  | 'Metro'
  | 'Expressway'
  | 'Industrial Corridor'
  | 'Airport'
  | 'Irrigation & Canal'
  | 'Renewable Energy'
  | 'Power Transmission'
  | 'Urban Infrastructure';

export interface EvidenceDocument {
  id: string;
  title: string;
  type: string;
  uploadedDate: string;
  verifiedBy?: string;
  verifiedDate?: string;
  status: 'Verified' | 'Pending' | 'Correction Requested';
  fileSize: string;
  referenceNo: string;
  remarks?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  officerName: string;
  officerRole: string;
  action: string;
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  reason: string;
}

export interface ActionItem {
  id: string;
  title: string;
  recommendationSource: string;
  assignedOfficer: string;
  assignedRole: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Pending Verification' | 'Completed' | 'Closed';
  priority: 'High' | 'Medium' | 'Urgent';
  notes: string;
  createdDate: string;
}

export interface AuthorityDecision {
  id: string;
  recordedBy: string;
  authorityTitle: string;
  orderNumber: string;
  date: string;
  decisionType:
    | 'Direct Special Disbursement Camp'
    | 'Convene Section 15 Summary Hearing'
    | 'Interdepartmental Coordination Resolution'
    | 'Expedite Joint Measurement Survey'
    | 'Escalate to District Land Advisory Committee'
    | 'Refer to Legal Cell for Stay Vacation';
  statutoryReference: string;
  instructions: string;
  reviewMilestoneDate: string;
}

export interface FactorContribution {
  id: string;
  name: string;
  contributionPercent: number; // e.g. +24
  severity: 'high' | 'medium' | 'low';
  description: string;
  metricLabel: string;
  metricValue: string;
}

export interface PositiveFactor {
  id: string;
  name: string;
  mitigationPercent: number; // e.g. -12
  description: string;
}

export interface StageRiskItem {
  stage: ProjectStage;
  label: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Delayed';
  riskLevel: RiskLevel;
  durationDays: number;
  expectedDays: number;
  blockers?: string;
}

export interface RiskTrendPoint {
  date: string;
  riskScore: number;
  delayProbability: number;
  milestone: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  state: string;
  district: string;
  tehsil: string;
  villages: string[];
  agency: string;
  landRequiredHectares: number;
  landAcquiredHectares: number;
  affectedFamilies: number;
  landownersCount: number;
  compensationTotalCr: number;
  compensationPaidCr: number;
  compensationPendingCr: number;
  approvalDelayDays: number;
  legalDisputesCount: number;
  legalSeverity: 'Low' | 'Medium' | 'High' | 'Critical';
  documentationCompletenessPct: number;
  surveyProgressPct: number;
  siaProgressPct: number;
  notificationStatus: 'Pending' | 'Preliminary Issued' | 'Gazetted' | 'Completed';
  awardStatus: 'Draft' | 'Sanctioned' | 'Disbursed' | 'Disputed';
  rrProgressPct: number;
  possessionProgressPct: number;
  stakeholderResponsiveness: 'High' | 'Moderate' | 'Low' | 'Critical';
  daysAtCurrentStage: number;
  historicalAgencyDelayMonths: number;
  currentStage: ProjectStage;
  riskScore: number;
  delayProbability: number;
  riskLevel: RiskLevel;
  verificationStatus: VerificationStatus;
  lastUpdatedDate: string;
  coordinates: [number, number]; // [lat, lng]
  evidenceDocuments: EvidenceDocument[];
  auditTrail: AuditEntry[];
  actionItems: ActionItem[];
  authorityDecision?: AuthorityDecision;
  historicalRiskTrend: RiskTrendPoint[];
  topRiskFactors: FactorContribution[];
  positiveFactors: PositiveFactor[];
  stageRisks: StageRiskItem[];
  pendingDataUpdate?: ProjectDataUpdate;
}

export interface ProjectDataUpdate {
  id: string;
  submittedBy: string;
  submittedRole: string;
  submittedAt: string;
  compensationPaidCr: number;
  approvalDelayDays: number;
  rrProgressPct: number;
  possessionProgressPct: number;
  documentationCompletenessPct: number;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
}

export interface AlertNotification {
  id: string;
  projectId: string;
  projectName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'INFO';
  type:
    | 'SUDDEN_RISK_INCREASE'
    | 'COMPENSATION_BACKLOG'
    | 'APPROVAL_OVERDUE'
    | 'VERIFICATION_PENDING'
    | 'LEGAL_STAY'
    | 'STALE_DATA'
    | 'HIGH_RISK_THRESHOLD'
    | 'RR_PROGRESS_LAG'
    | 'DATA_QUALITY_WARNING';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionRequired: string;
  triggeringRule?: string;
  triggeringValues?: Record<string, any>;
}

export interface UserScope {
  state?: string;
  district?: string;
  agency?: string;
}

export interface AuthUser {
  username: string;
  role: UserRole;
  scope: UserScope;
  name: string;
  title: string;
  dept: string;
  jurisdiction: string;
  desc: string;
  email: string;
  designationLevel: string;
  citizenId?: string; // Unique Citizen ID (e.g. CIT-001) for citizen roles
}

export interface CitizenRecord {
  citizenId: string; // e.g. "CIT-001"
  fullName: string;
  mobileNumber: string;
  email: string;
  address: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  parcelNumber?: string;
  projectId?: string;
  projectName?: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  accountStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  registrationDate: string;
  maskedAadhaar?: string;
}

export type RequestableRole =
  | 'STATE_OFFICER'
  | 'DISTRICT_OFFICER'
  | 'PROJECT_OFFICER'
  | 'VERIFICATION_OFFICER'
  | 'COMPETENT_AUTHORITY'
  | 'ML_DATA_TEAM';

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CORRECTION_REQUESTED';

export interface AccessRequest {
  id: string; // e.g., "BR-REQ-1024"
  submittedAt: string;
  status: AccessRequestStatus;
  requestedRole: RequestableRole;
  requestedScope: string;

  // Personal / Identity
  fullName: string;
  officialEmail: string;
  mobileNumber: string;
  organization: string;
  designation: string;

  // Jurisdiction & Department
  state?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  departmentDivision?: string;
  reasonForAccess: string;

  // Project Officer specifics
  projectType?: string;
  projectId?: string;
  projectName?: string;
  assignmentResponsibility?: string;

  // Verification Officer specifics
  verificationJurisdiction?: string;
  relevantDepartment?: string;
  verificationScopes?: string[];

  // Competent Authority specifics
  authorityOffice?: string;
  applicableProjectType?: string;
  authorityScope?: 'State-level' | 'District-level' | 'Project-level';

  // ML / Data Team specifics
  technicalTeam?: string;
  purposesOfAccess?: string[];
  requestedDataScopes?: string[];

  // Admin Review / Activation fields
  reviewedBy?: string;
  reviewedAt?: string;
  assignedRole?: UserRole;
  assignedJurisdiction?: string;
  assignedScope?: string;
  assignedProjectId?: string;
  assignedUsername?: string;
  temporaryPassword?: string;
  adminRemarks?: string;
}
