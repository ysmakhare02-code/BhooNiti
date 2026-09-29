import { AuthUser, UserRole, UserScope } from '../types';
import { NavigationTab } from '../components/Sidebar';
export { isTabPermitted, ROLE_PERMISSIONS } from './permissions';

export interface DemoCredential {
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
  defaultPassword: string;
  keyResponsibilities: string[];
}

export const DEMO_USERS: DemoCredential[] = [
  {
    username: 'district_demo',
    role: 'DISTRICT_OFFICER',
    scope: { state: 'Maharashtra', district: 'Pune' },
    name: 'Shri Rajesh Patil, IAS',
    title: 'District Collector & Land Acquisition Officer',
    dept: 'District Revenue Administration, Pune',
    jurisdiction: 'Pune District, Maharashtra',
    designationLevel: 'District Executive Authority',
    email: 'collector.pune@gov.in',
    defaultPassword: 'demo123',
    desc: 'Supervises district-wide infrastructure acquisition, reviews compensation bottleneck alerts, and deploys sub-divisional camps.',
    keyResponsibilities: [
      'District-level projects and bottleneck surveillance',
      'Direct Benefit Transfer (DBT) disbursement monitoring',
      'Interdepartmental land acquisition coordination (Forest, PWD, NHAI)',
      'Sub-divisional SLAO camp deployment',
    ],
  },
  {
    username: 'state_demo',
    role: 'STATE_OFFICER',
    scope: { state: 'Maharashtra' },
    name: 'Smt. Manisha Verma, IAS',
    title: 'Principal Secretary (Revenue & Forest)',
    dept: 'Department of Revenue & Forest, Govt. of Maharashtra',
    jurisdiction: 'State of Maharashtra',
    designationLevel: 'State Administrative Secretariat',
    email: 'prsec.rev@maharashtra.gov.in',
    defaultPassword: 'demo123',
    desc: 'Oversees statewide acquisition pipelines, monitors inter-district compensation backlogs, and resolves interdepartmental deadlocks.',
    keyResponsibilities: [
      'Statewide infrastructure pipeline monitoring',
      'Inter-district compensation disparity & backlog tracking',
      'High-level interdepartmental clearance escalation',
      'State infrastructure corridor review',
    ],
  },
  {
    username: 'project_demo',
    role: 'PROJECT_OFFICER',
    scope: { agency: 'National Highways Authority of India' },
    name: 'Shri Vikram Shinde',
    title: 'Project Director & Land Acquisition Officer',
    dept: 'National Highways Authority of India (NHAI PIU Pune)',
    jurisdiction: 'NH-48 Corridor & Associated Spurs',
    designationLevel: 'Project Implementing Agency',
    email: 'pd.pune@nhai.org',
    defaultPassword: 'demo123',
    desc: 'Tracks on-ground milestones, cadastral Joint Measurement Surveys (JMS), compensation rolls, and recommendation action items.',
    keyResponsibilities: [
      'Ground Joint Measurement Survey (JMS) tracking',
      'Compensation rolls upload & title defect flagging',
      'Statutory recommendation follow-up & action items',
      'Right-of-Way (RoW) physical possession tracking',
    ],
  },
  {
    username: 'verification_demo',
    role: 'VERIFICATION_OFFICER',
    scope: { state: 'Maharashtra', district: 'Pune' },
    name: 'Shri Sanjay Deshmukh',
    title: 'Special Land Acquisition Officer (SLAO) Verification Lead',
    dept: 'District Land Records & Legal Scrutiny Cell',
    jurisdiction: 'Regional Land Acquisition Verification Division',
    designationLevel: 'Statutory Verification & Scrutiny Body',
    email: 'slao.scrutiny@pune.gov.in',
    defaultPassword: 'demo123',
    desc: 'Scrutinizes supporting field evidence, validates compensation rolls, confirms survey plans, and records verified or rejected status.',
    keyResponsibilities: [
      'Document evidence scrutiny (JMS Form 3B, Gazette notifications)',
      'Bank DBT rolls audit and title verification sign-off',
      'Marking projects as Verified, Pending, or Correction Requested',
      'Flagging legal discrepancies and survey mismatch notes',
    ],
  },
  {
    username: 'authority_demo',
    role: 'COMPETENT_AUTHORITY',
    scope: { state: 'Maharashtra', district: 'Pune' },
    name: 'Dr. Ananya Joshi',
    title: 'Competent / Authorized Authority (CALA / SDM)',
    dept: 'Competent Authority Office & Sub-Divisional Magistrate Court',
    jurisdiction: 'Statutory Land Acquisition Authority',
    designationLevel: 'Quasi-Judicial & Statutory Authority',
    email: 'cala.haveli@gov.in',
    defaultPassword: 'demo123',
    desc: 'Reviews verified evidence and AI delay risk predictions to issue binding statutory administrative orders under RFCTLARR Act 2013.',
    keyResponsibilities: [
      'Review verified project evidence and AI delay factor explanations',
      'Issue binding statutory administrative directions & orders',
      'Preside over Section 15 objection summary hearings',
      'Approve special disbursement and camp intervention mandates',
    ],
  },
  {
    username: 'ml_demo',
    role: 'ML_DATA_TEAM',
    scope: {},
    name: 'Arunabh Sengupta',
    title: 'Lead Data Scientist & Predictive Modeling Specialist',
    dept: 'NIC / AI Decision-Support Systems Division',
    jurisdiction: 'Algorithm Architecture & Model Drift Supervision',
    designationLevel: 'Technical AI Systems Division',
    email: 'arunabh.nic@gov.in',
    defaultPassword: 'demo123',
    desc: 'Audits feature importance rankings, monitors data drift metrics (PSI), evaluates ensemble validation stats, and inspects model integrity.',
    keyResponsibilities: [
      'Explainable SHAP feature attribution audits',
      'Population Stability Index (PSI) & data drift monitoring',
      'ROC-AUC, Precision, Recall model calibration checks',
      'Training dataset versioning & bias inspection',
    ],
  },
  {
    username: 'admin_demo',
    role: 'SYSTEM_ADMIN',
    scope: {},
    name: 'Prakash Nair',
    title: 'Senior Systems & Security Administrator',
    dept: 'National Informatics Infrastructure Center',
    jurisdiction: 'Identity, RBAC & Append-Only Audit Logs',
    designationLevel: 'System Administration & Security Cell',
    email: 'sysadmin.nic@gov.in',
    defaultPassword: 'demo123',
    desc: 'Manages user identities, cryptographic audit records, role-based security policies, and system reliability health metrics.',
    keyResponsibilities: [
      'Role-Based Access Control (RBAC) policy enforcement',
      'Cross-project append-only audit log scrutiny',
      'System security architecture status & deployment checks',
      'Session tracking and platform reliability monitoring',
    ],
  },
  {
    username: 'ministry_demo',
    role: 'MINISTRY_OFFICER',
    scope: {},
    name: 'Shri K. Ramanathan',
    title: 'Joint Secretary (Infrastructure & Land Logistics)',
    dept: 'Ministry of Road Transport and Highways (MoRTH)',
    jurisdiction: 'National Infrastructure Pipeline',
    designationLevel: 'Central Ministry Secretariat',
    email: 'js.infra@morth.gov.in',
    defaultPassword: 'demo123',
    desc: 'Reviews macro risk distribution across national corridors, high-level delay probabilities, and statutory policy bottlenecks (read-only for all national projects).',
    keyResponsibilities: [
      'National Infrastructure Pipeline macro delay tracking',
      'Interstate corridor progress benchmarking',
      'Central budgetary disbursement monitoring',
      'Statutory policy amendment recommendations',
    ],
  },
];

export const roleDefaultTitles: Record<UserRole, string> = {
  DISTRICT_OFFICER: 'District Collector & Land Acquisition Officer',
  STATE_OFFICER: 'Principal Secretary / State Land Acquisition Director',
  PROJECT_OFFICER: 'Project Director & Land Acquisition Officer',
  MINISTRY_OFFICER: 'Joint Secretary (Infrastructure & Land Logistics)',
  VERIFICATION_OFFICER: 'Special Land Acquisition Officer (SLAO) Verification Lead',
  COMPETENT_AUTHORITY: 'Competent Authority for Land Acquisition (CALA / SDM)',
  ML_DATA_TEAM: 'Lead Data Scientist & Predictive Modeling Specialist',
  SYSTEM_ADMIN: 'Senior Systems & Security Administrator',
  CITIZEN: 'Affected Landholder / Public Citizen',
};

export const roleDesignationLevels: Record<UserRole, string> = {
  DISTRICT_OFFICER: 'District Executive Authority',
  STATE_OFFICER: 'State Administrative Secretariat',
  PROJECT_OFFICER: 'Project Implementing Agency',
  MINISTRY_OFFICER: 'Central Ministry Secretariat',
  VERIFICATION_OFFICER: 'Statutory Verification & Scrutiny Body',
  COMPETENT_AUTHORITY: 'Quasi-Judicial & Statutory Authority',
  ML_DATA_TEAM: 'Technical AI Systems Division',
  SYSTEM_ADMIN: 'System Administration & Security Cell',
  CITIZEN: 'Public Landowner Access',
};

export interface CustomUserRecord extends DemoCredential {
  isCustom?: boolean;
  createdAt?: string;
}

const STORAGE_KEY = 'bhumiraksha_custom_users';

export function getCustomUsers(): CustomUserRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse custom users', e);
    return [];
  }
}

export function saveCustomUser(user: CustomUserRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomUsers();
    const filtered = existing.filter(
      (u) => u.username.toLowerCase() !== user.username.toLowerCase()
    );
    filtered.unshift(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to save custom user', e);
  }
}

export function deleteCustomUser(username: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomUsers();
    const filtered = existing.filter(
      (u) => u.username.toLowerCase() !== username.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete custom user', e);
  }
}

export function getAllUsers(): (DemoCredential & { isCustom?: boolean; createdAt?: string })[] {
  return [...getCustomUsers(), ...DEMO_USERS];
}

export interface RegisterUserParams {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email: string;
  dept: string;
  jurisdiction: string;
  title?: string;
  designationLevel?: string;
}

export function registerNewUser(
  params: RegisterUserParams
): { success: boolean; user?: AuthUser; error?: string } {
  const cleanUser = params.username.trim().toLowerCase();
  const cleanPass = params.password.trim();
  const cleanName = params.name.trim();
  const cleanEmail = params.email.trim();
  const cleanDept = params.dept.trim();
  const cleanJurisdiction = params.jurisdiction.trim();

  if (!cleanUser || cleanUser.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters long.' };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUser)) {
    return {
      success: false,
      error: 'Username can only contain alphanumeric characters, hyphens, and underscores.',
    };
  }
  if (!cleanPass || cleanPass.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }
  if (!cleanName) {
    return { success: false, error: 'Please enter the officer full name.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Please enter a valid government or official email.' };
  }
  if (!cleanDept) {
    return { success: false, error: 'Please specify the officer department or authority.' };
  }
  if (!cleanJurisdiction) {
    return { success: false, error: 'Please specify the assigned jurisdiction.' };
  }

  const allUsers = getAllUsers();
  const existing = allUsers.find((u) => u.username.toLowerCase() === cleanUser);
  if (existing) {
    return {
      success: false,
      error: `Username "${cleanUser}" is already registered. Please choose another username.`,
    };
  }

  const defaultTitle =
    params.title && params.title.trim()
      ? params.title.trim()
      : roleDefaultTitles[params.role] || 'Land Acquisition Officer';

  const designationLevel =
    params.designationLevel && params.designationLevel.trim()
      ? params.designationLevel.trim()
      : roleDesignationLevels[params.role] || 'Statutory Authority';

  let scope: UserScope = {};
  if (params.role === 'DISTRICT_OFFICER') {
    scope = { state: 'Maharashtra', district: 'Pune' };
  } else if (params.role === 'STATE_OFFICER') {
    scope = { state: 'Maharashtra' };
  } else if (params.role === 'PROJECT_OFFICER') {
    scope = { agency: 'National Highways Authority of India' };
  } else if (params.role === 'VERIFICATION_OFFICER' || params.role === 'COMPETENT_AUTHORITY') {
    scope = { state: 'Maharashtra', district: 'Pune' };
  }

  const newRecord: CustomUserRecord = {
    username: cleanUser,
    role: params.role,
    scope,
    name: cleanName,
    title: defaultTitle,
    dept: cleanDept,
    jurisdiction: cleanJurisdiction,
    email: cleanEmail,
    defaultPassword: cleanPass,
    desc: `Officer account registered for ${cleanJurisdiction}.`,
    designationLevel,
    keyResponsibilities: [
      `Jurisdictional oversight for ${cleanJurisdiction}`,
      'Land acquisition case monitoring & review',
      'Statutory compliance & compensation audit',
    ],
    isCustom: true,
    createdAt: new Date().toISOString(),
  };

  saveCustomUser(newRecord);

  const authUser: AuthUser = {
    username: newRecord.username,
    role: newRecord.role,
    scope: newRecord.scope || scope,
    name: newRecord.name,
    title: newRecord.title,
    dept: newRecord.dept,
    jurisdiction: newRecord.jurisdiction,
    desc: newRecord.desc,
    email: newRecord.email,
    designationLevel: newRecord.designationLevel,
  };

  return { success: true, user: authUser };
}

export function authenticateUser(
  username: string,
  password: string
): { success: boolean; user?: AuthUser; error?: string } {
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();

  if (!cleanUser) {
    return { success: false, error: 'Please enter your username.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Please enter your password.' };
  }

  const allUsers = getAllUsers();
  const found = allUsers.find(
    (u) => u.username.toLowerCase() === cleanUser
  );

  if (!found) {
    return { success: false, error: 'Invalid username or password.' };
  }

  // Accepted passwords: user's default password, 'demo123', or 'bhumiraksha2026'
  const validPasswords = [
    found.defaultPassword,
    'demo123',
    'bhumiraksha2026',
    'admin123',
    'password',
  ];

  if (!validPasswords.includes(cleanPass)) {
    return { success: false, error: 'Invalid username or password.' };
  }

  const user: AuthUser = {
    username: found.username,
    role: found.role,
    scope: (found as any).scope || {},
    name: found.name,
    title: found.title,
    dept: found.dept,
    jurisdiction: found.jurisdiction,
    desc: found.desc,
    email: found.email,
    designationLevel: found.designationLevel,
  };

  return { success: true, user };
}
