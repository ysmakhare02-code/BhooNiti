import { AccessRequest, RequestableRole, UserRole, Project } from '../types';
import { saveCustomUser, roleDefaultTitles, roleDesignationLevels } from './auth';

export const INDIAN_STATES_AND_DISTRICTS: Record<
  string,
  {
    districts: string[];
    tehsilsByDistrict?: Record<string, string[]>;
  }
> = {
  Maharashtra: {
    districts: [
      'Pune',
      'Thane',
      'Nashik',
      'Nagpur',
      'Satara',
      'Chhatrapati Sambhajinagar',
      'Solapur',
      'Raigad',
      'Ahmednagar',
      'Kolhapur',
      'Palghar',
    ],
    tehsilsByDistrict: {
      Pune: ['Haveli', 'Pune City', 'Shirur', 'Daund', 'Khed', 'Baramati', 'Junnar', 'Maval', 'Bhor'],
      Thane: ['Thane', 'Kalyan', 'Bhiwandi', 'Ulhasnagar', 'Murbad', 'Shahapur', 'Ambernath'],
      Nashik: ['Nashik', 'Sinnar', 'Igatpuri', 'Dindori', 'Niphad', 'Malegaon'],
      Satara: ['Satara', 'Wai', 'Karad', 'Khandala', 'Phaltan', 'Koregaon'],
      Nagpur: ['Nagpur Rural', 'Nagpur Urban', 'Hingna', 'Kamptee', 'Umred', 'Katol'],
      Raigad: ['Panvel', 'Alibag', 'Khalapur', 'Pen', 'Uran', 'Roha'],
    },
  },
  Gujarat: {
    districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bharuch', 'Gandhinagar', 'Kheda'],
    tehsilsByDistrict: {
      Ahmedabad: ['Daskroi', 'Sanand', 'Dholka', 'Viramgam'],
      Surat: ['Chorasi', 'Olpad', 'Kamrej', 'Bardoli'],
      Vadodara: ['Vadodara', 'Padra', 'Karjan', 'Waghodia'],
    },
  },
  Karnataka: {
    districts: ['Bengaluru Urban', 'Bengaluru Rural', 'Belagavi', 'Mysuru', 'Dharwad', 'Tumakuru'],
    tehsilsByDistrict: {
      'Bengaluru Urban': ['Bengaluru North', 'Bengaluru South', 'Bengaluru East', 'Anekal'],
      Mysuru: ['Mysuru', 'Hunsur', 'Nanjangud', 'T. Narasipura'],
    },
  },
  'Uttar Pradesh': {
    districts: ['Lucknow', 'Varanasi', 'Prayagraj', 'Gautam Buddha Nagar (Noida)', 'Kanpur Nagar', 'Ayodhya', 'Agra'],
    tehsilsByDistrict: {
      Lucknow: ['Lucknow', 'Bakshi Ka Talab', 'Malihabad', 'Mohanlalganj'],
      'Gautam Buddha Nagar (Noida)': ['Dadri', 'Sadar', 'Jewar'],
    },
  },
  'Madhya Pradesh': {
    districts: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Rewa'],
    tehsilsByDistrict: {
      Bhopal: ['Huzur', 'Berasia', 'Kolar'],
      Indore: ['Indore', 'Sanwer', 'Depalpur', 'Mhow'],
    },
  },
  'Tamil Nadu': {
    districts: ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Kanchipuram', 'Tiruvallur'],
  },
  Rajasthan: {
    districts: ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur', 'Alwar', 'Ajmer'],
  },
  'Delhi (NCT)': {
    districts: ['New Delhi', 'South Delhi', 'North Delhi', 'South West Delhi', 'Central Delhi'],
  },
};

export const PROJECT_TYPES_LIST = [
  'National Highway',
  'State Highway',
  'Railway',
  'Metro',
  'Airport',
  'Irrigation',
  'Industrial Corridor',
  'Power',
  'Renewable Energy',
  'Urban Infrastructure',
  'Other',
];

export const VERIFICATION_SCOPES_LIST = [
  'Project Data Verification',
  'Land / Documentation Verification',
  'Compensation Data Verification',
  'R&R Data Verification',
  'Legal / Dispute Information Verification',
];

export const ML_PURPOSES_LIST = [
  'Model Monitoring',
  'Data Quality Monitoring',
  'Model Evaluation',
  'Feature Analysis',
  'Dataset Management',
  'Analytics',
];

export const ML_DATA_SCOPES_LIST = [
  'Aggregated Data',
  'Project-level Data',
  'Model Metrics',
  'Evaluation Dataset',
];

export const ROLE_CARD_CONFIG: Record<
  RequestableRole,
  {
    title: string;
    subtitle: string;
    level: string;
    badgeColor: string;
    summaryScope: string;
    description: string;
    authorityNote: string;
  }
> = {
  STATE_OFFICER: {
    title: 'State Officer',
    subtitle: 'Principal Secretary / State Directorate',
    level: 'State Administrative Oversight',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    summaryScope: 'State-level',
    description: 'Statewide corridor monitoring, inter-district compensation backlogs, and interdepartmental clearances.',
    authorityNote: 'Access will be scoped exclusively to your authorized state jurisdiction.',
  },
  DISTRICT_OFFICER: {
    title: 'District Officer',
    subtitle: 'District Collector & Executive LAO',
    level: 'District Executive Authority',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    summaryScope: 'District-level',
    description: 'Directs district infrastructure acquisition, SLAO camp mobilizations, and compensation disbursement ledgers.',
    authorityNote: 'The dashboard after approval will only show projects within your authorized district.',
  },
  PROJECT_OFFICER: {
    title: 'Project Officer',
    subtitle: 'Project Director & LAO (NHAI / Metro / PWD)',
    level: 'Project Implementing Agency',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    summaryScope: 'Assigned Project(s)',
    description: 'Ground milestones, cadastral Joint Measurement Surveys (JMS), gazette notifications, and RoW possession.',
    authorityNote: 'A Project Officer does not automatically receive access to every project. Access is assigned by the administrator.',
  },
  VERIFICATION_OFFICER: {
    title: 'Verification Officer',
    subtitle: 'Statutory Verification Lead (SLAO Scrutiny)',
    level: 'Field Audit & Legal Scrutiny',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    summaryScope: 'Verification',
    description: 'Examines cadastral extracts, validates title records, verifies bank DBT compensation files, and checks surveys.',
    authorityNote: 'Assigned verification scope determines which document categories you can approve or flag for corrections.',
  },
  COMPETENT_AUTHORITY: {
    title: 'Competent / Authorized Authority',
    subtitle: 'CALA / Sub-Divisional Magistrate (SDM)',
    level: 'Quasi-Judicial Statutory Authority',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    summaryScope: 'Authority Jurisdiction',
    description: 'Adjudicates landowner objections under applicable Acts (RFCTLARR / NH Act) and records binding statutory orders.',
    authorityNote: 'Statutory authority scope must be corroborated by your official gazette appointment notification.',
  },
  ML_DATA_TEAM: {
    title: 'ML / Data Team',
    subtitle: 'Predictive Modeling & Algorithm Specialist',
    level: 'Technical System Supervision',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    summaryScope: 'ML / Data Monitoring',
    description: 'Monitors Population Stability Index (PSI), audits SHAP factor rankings, and evaluates delay risk algorithms.',
    authorityNote: 'Technical access is strictly limited to evaluation datasets and model performance telemetry.',
  },
};

const STORAGE_KEY = 'bhumiraksha_access_requests';

// Initial realistic demo access requests
const INITIAL_DEMO_REQUESTS: AccessRequest[] = [
  {
    id: 'BR-REQ-1024',
    submittedAt: '2026-09-19 14:30 IST',
    status: 'PENDING',
    requestedRole: 'COMPETENT_AUTHORITY',
    requestedScope: 'District-level (Pune)',
    fullName: 'Shri Arvind Joshi, SDM',
    officialEmail: 'arvind.joshi@gov.in',
    mobileNumber: '9822014589',
    organization: 'Sub-Divisional Magistrate & Competent Authority Office',
    designation: 'Sub-Divisional Magistrate (SDM) & CALA',
    state: 'Maharashtra',
    district: 'Pune',
    authorityOffice: 'Sub-Divisional Land Acquisition Authority, Haveli',
    applicableProjectType: 'National Highway',
    authorityScope: 'District-level',
    reasonForAccess: 'Hearing Section 15 landowner objections and passing statutory award orders on NH-48 Pune-Satara expansion.',
  },
  {
    id: 'BR-REQ-1031',
    submittedAt: '2026-09-19 16:45 IST',
    status: 'PENDING',
    requestedRole: 'DISTRICT_OFFICER',
    requestedScope: 'District-level (Thane)',
    fullName: 'Dr. Sunita Deshmukh, IAS',
    officialEmail: 's.deshmukh@nic.in',
    mobileNumber: '9423087612',
    organization: 'District Collectorate, Thane',
    designation: 'District Collector & District Magistrate',
    state: 'Maharashtra',
    district: 'Thane',
    departmentDivision: 'District Land Acquisition Cell',
    reasonForAccess: 'Executive surveillance of high-risk infrastructure bottlenecks and compensation disbursal acceleration.',
  },
  {
    id: 'BR-REQ-1018',
    submittedAt: '2026-09-18 10:15 IST',
    status: 'APPROVED',
    requestedRole: 'PROJECT_OFFICER',
    requestedScope: 'Assigned Project (NH-MH-001)',
    fullName: 'Er. Sandeep Patil',
    officialEmail: 'sandeep.patil@nhai.org',
    mobileNumber: '9890123456',
    organization: 'National Highways Authority of India (NHAI PIU Pune)',
    designation: 'Manager (Technical) & Land Acquisition Liaison',
    state: 'Maharashtra',
    district: 'Pune',
    tehsil: 'Haveli',
    projectType: 'National Highway',
    projectId: 'NH-MH-001',
    projectName: 'Demo NH Corridor - Package A',
    assignmentResponsibility: 'Joint Measurement Surveys & Title Verification',
    reasonForAccess: 'Ground coordination for 3A/3D gazette notifications and RoW possession tracking.',
    reviewedBy: 'System Administrator (Officer A)',
    reviewedAt: '2026-09-18 11:30 IST',
    assignedRole: 'PROJECT_OFFICER',
    assignedJurisdiction: 'Demo NH Corridor - Package A',
    assignedScope: 'Assigned Project (NH-MH-001)',
    assignedUsername: 'sandeep_nhai',
    adminRemarks: 'Approved for NH-MH-001 with JMS verification scope.',
  },
];

export function getAccessRequests(): AccessRequest[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_REQUESTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REQUESTS));
      return INITIAL_DEMO_REQUESTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse access requests from storage:', err);
    return INITIAL_DEMO_REQUESTS;
  }
}

export function saveAccessRequest(req: Omit<AccessRequest, 'id' | 'submittedAt' | 'status'>): AccessRequest {
  const existing = getAccessRequests();
  const nextIdNumber = 1040 + existing.length + Math.floor(Math.random() * 5);
  const id = `BR-REQ-${nextIdNumber}`;
  const now = new Date();
  const formattedDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)} IST`;

  const newRequest: AccessRequest = {
    ...req,
    id,
    submittedAt: formattedDate,
    status: 'PENDING',
  };

  const updated = [newRequest, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save access request:', err);
  }

  return newRequest;
}

export function updateAccessRequest(req: AccessRequest): void {
  const existing = getAccessRequests();
  const updated = existing.map((r) => (r.id === req.id ? req : r));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update access request:', err);
  }
}

export interface ApproveAccessRequestParams {
  assignedRole: UserRole;
  assignedJurisdiction: string;
  assignedScope: string;
  assignedUsername: string;
  assignedProjectId?: string;
  temporaryPassword?: string;
  adminRemarks?: string;
  reviewedBy: string;
}

export function approveAccessRequest(
  requestId: string,
  params: ApproveAccessRequestParams
): { success: boolean; error?: string; request?: AccessRequest } {
  const requests = getAccessRequests();
  const target = requests.find((r) => r.id === requestId);
  if (!target) {
    return { success: false, error: 'Access request not found.' };
  }

  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)} IST`;

  // 1. Activate User Account via saveCustomUser so they can sign in immediately
  const cleanUsername = params.assignedUsername.trim().toLowerCase();
  const cleanPassword = (params.temporaryPassword && params.temporaryPassword.trim()) || 'demo123';
  const roleTitle = roleDefaultTitles[params.assignedRole] || 'Land Acquisition Officer';
  const designationLevel = roleDesignationLevels[params.assignedRole] || 'Statutory Authority';

  const userScope = {
    state: target.state,
    district: target.district,
    agency: target.organization,
  };

  saveCustomUser({
    username: cleanUsername,
    role: params.assignedRole,
    scope: userScope,
    name: target.fullName,
    title: roleTitle,
    dept: target.organization,
    jurisdiction: params.assignedJurisdiction,
    email: target.officialEmail,
    defaultPassword: cleanPassword,
    desc: `Authorized account provisioned from request ${requestId}. Scope: ${params.assignedScope}`,
    designationLevel,
    keyResponsibilities: [
      `Authorized jurisdiction: ${params.assignedJurisdiction}`,
      `Access scope: ${params.assignedScope}`,
      'Statutory review and land acquisition monitoring',
    ],
    isCustom: true,
    createdAt: new Date().toISOString(),
  });

  // 2. Mark Request as Approved
  const updatedRequest: AccessRequest = {
    ...target,
    status: 'APPROVED',
    reviewedBy: params.reviewedBy,
    reviewedAt: timestamp,
    assignedRole: params.assignedRole,
    assignedJurisdiction: params.assignedJurisdiction,
    assignedScope: params.assignedScope,
    assignedProjectId: params.assignedProjectId,
    assignedUsername: cleanUsername,
    temporaryPassword: cleanPassword,
    adminRemarks: params.adminRemarks,
  };

  updateAccessRequest(updatedRequest);

  return { success: true, request: updatedRequest };
}

export function rejectAccessRequest(
  requestId: string,
  reason: string,
  reviewedBy: string
): { success: boolean; error?: string } {
  const requests = getAccessRequests();
  const target = requests.find((r) => r.id === requestId);
  if (!target) return { success: false, error: 'Request not found.' };

  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)} IST`;

  const updated: AccessRequest = {
    ...target,
    status: 'REJECTED',
    adminRemarks: reason,
    reviewedBy,
    reviewedAt: timestamp,
  };

  updateAccessRequest(updated);
  return { success: true };
}

export function requestCorrectionForAccess(
  requestId: string,
  instructions: string,
  reviewedBy: string
): { success: boolean; error?: string } {
  const requests = getAccessRequests();
  const target = requests.find((r) => r.id === requestId);
  if (!target) return { success: false, error: 'Request not found.' };

  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)} IST`;

  const updated: AccessRequest = {
    ...target,
    status: 'CORRECTION_REQUESTED',
    adminRemarks: instructions,
    reviewedBy,
    reviewedAt: timestamp,
  };

  updateAccessRequest(updated);
  return { success: true };
}
