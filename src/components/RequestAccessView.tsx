import React, { useState } from 'react';
import {
  Shield,
  UserCheck,
  Building,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  FileCheck,
  Cpu,
  Layers,
  Check,
  Info,
} from 'lucide-react';
import { RequestableRole, Project, AccessRequest } from '../types';
import {
  ROLE_CARD_CONFIG,
  INDIAN_STATES_AND_DISTRICTS,
  PROJECT_TYPES_LIST,
  VERIFICATION_SCOPES_LIST,
  ML_PURPOSES_LIST,
  ML_DATA_SCOPES_LIST,
  saveAccessRequest,
} from '../data/accessRequests';

interface RequestAccessViewProps {
  projects?: Project[];
  onBackToSignIn: () => void;
  onOpenAdminReview?: (requestId?: string) => void;
}

type Step = 'select_role' | 'fill_form' | 'review' | 'submitted';

export const RequestAccessView: React.FC<RequestAccessViewProps> = ({
  projects = [],
  onBackToSignIn,
  onOpenAdminReview,
}) => {
  const [step, setStep] = useState<Step>('select_role');
  const [selectedRole, setSelectedRole] = useState<RequestableRole | null>(null);

  // Common Identity Fields
  const [fullName, setFullName] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');

  // Jurisdiction & Department
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [tehsil, setTehsil] = useState('Haveli');
  const [village, setVillage] = useState('');
  const [departmentDivision, setDepartmentDivision] = useState('');
  const [reasonForAccess, setReasonForAccess] = useState('');

  // Project Officer Specifics
  const [projectType, setProjectType] = useState('National Highway');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('NH-MH-001');
  const [customProjectName, setCustomProjectName] = useState('');
  const [assignmentResponsibility, setAssignmentResponsibility] = useState(
    'Joint Measurement Surveys (JMS) & Cadastral Verification'
  );

  // Verification Officer Specifics
  const [verificationJurisdiction, setVerificationJurisdiction] = useState(
    'Regional Land Records Scrutiny Cell'
  );
  const [relevantDepartment, setRelevantDepartment] = useState(
    'District Land Records & Legal Cell'
  );
  const [selectedVerificationScopes, setSelectedVerificationScopes] = useState<string[]>([
    'Project Data Verification',
    'Land / Documentation Verification',
  ]);

  // Competent Authority Specifics
  const [authorityOffice, setAuthorityOffice] = useState(
    'Sub-Divisional Land Acquisition Authority & CALA'
  );
  const [applicableProjectType, setApplicableProjectType] = useState('National Highway');
  const [authorityScope, setAuthorityScope] = useState<'State-level' | 'District-level' | 'Project-level'>(
    'District-level'
  );

  // ML / Data Team Specifics
  const [technicalTeam, setTechnicalTeam] = useState('NIC AI & Algorithm Supervision Cell');
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([
    'Model Monitoring',
    'Data Quality Monitoring',
  ]);
  const [selectedDataScopes, setSelectedDataScopes] = useState<string[]>([
    'Model Metrics',
    'Evaluation Dataset',
  ]);

  // UI & Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedRequest, setSubmittedRequest] = useState<AccessRequest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available districts for chosen state
  const availableDistricts = state && INDIAN_STATES_AND_DISTRICTS[state]?.districts
    ? INDIAN_STATES_AND_DISTRICTS[state].districts
    : [];

  // Available tehsils for chosen district
  const availableTehsils =
    state && district && INDIAN_STATES_AND_DISTRICTS[state]?.tehsilsByDistrict?.[district]
      ? INDIAN_STATES_AND_DISTRICTS[state].tehsilsByDistrict![district]
      : [];

  const handleStateChange = (newState: string) => {
    setState(newState);
    const firstDistrict = INDIAN_STATES_AND_DISTRICTS[newState]?.districts[0] || '';
    setDistrict(firstDistrict);
    const tehsils = INDIAN_STATES_AND_DISTRICTS[newState]?.tehsilsByDistrict?.[firstDistrict] || [];
    setTehsil(tehsils[0] || '');
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    const tehsils = INDIAN_STATES_AND_DISTRICTS[state]?.tehsilsByDistrict?.[newDistrict] || [];
    setTehsil(tehsils[0] || '');
  };

  const handleRoleSelect = (role: RequestableRole) => {
    setSelectedRole(role);
    setErrors({});
    setStep('fill_form');
  };

  const handleQuickFillSample = () => {
    if (!selectedRole) return;

    switch (selectedRole) {
      case 'STATE_OFFICER':
        setFullName('Dr. Pratibha Patil, IAS');
        setOfficialEmail('prsec.infra@maharashtra.gov.in');
        setMobileNumber('9822104590');
        setOrganization('Department of Revenue & Forest, Govt. of Maharashtra');
        setDesignation('Principal Secretary (Revenue & Forest)');
        setState('Maharashtra');
        setDepartmentDivision('State Land Acquisition & Infrastructure Directorate');
        setReasonForAccess('Statewide infrastructure corridor delay surveillance and interdepartmental clearance review.');
        break;

      case 'DISTRICT_OFFICER':
        setFullName('Dr. Sunita Deshmukh, IAS');
        setOfficialEmail('collector.thane@nic.in');
        setMobileNumber('9823456712');
        setOrganization('District Collectorate, Thane');
        setDesignation('District Collector & Land Acquisition Officer');
        setState('Maharashtra');
        setDistrict('Thane');
        setDepartmentDivision('District Land Acquisition Cell, Division 1');
        setReasonForAccess('Supervising district infrastructure acquisitions, bottleneck resolution, and compensation disbursements.');
        break;

      case 'PROJECT_OFFICER':
        setFullName('Er. Rameshwar Jadhav');
        setOfficialEmail('pd.nashik@nhai.org');
        setMobileNumber('9890123490');
        setOrganization('National Highways Authority of India (NHAI PIU)');
        setDesignation('Project Director & LAO');
        setState('Maharashtra');
        setDistrict('Pune');
        setTehsil('Haveli');
        setProjectType('National Highway');
        setSelectedProjectId('NH-MH-001');
        setAssignmentResponsibility('Joint Measurement Surveys (JMS) & Section 3D RoW possession');
        setReasonForAccess('On-ground milestone tracking, SLAO ledger validation, and title scrutiny.');
        break;

      case 'VERIFICATION_OFFICER':
        setFullName('Shri Ashok Thorat');
        setOfficialEmail('slao.scrutiny@maharashtra.gov.in');
        setMobileNumber('9422019845');
        setOrganization('Special Land Acquisition Office (SLAO), Division 2');
        setDesignation('Statutory Verification Lead & Scrutiny Officer');
        setState('Maharashtra');
        setDistrict('Pune');
        setVerificationJurisdiction('Western Maharashtra Infrastructure Cell');
        setRelevantDepartment('District Land Records Scrutiny Cell');
        setSelectedVerificationScopes([
          'Project Data Verification',
          'Land / Documentation Verification',
          'Compensation Data Verification',
        ]);
        setReasonForAccess('Statutory audit of cadastral surveys, award sanction rolls, and land title records.');
        break;

      case 'COMPETENT_AUTHORITY':
        setFullName('Smt. Rohini Bhosale, SDM');
        setOfficialEmail('cala.haveli@gov.in');
        setMobileNumber('9822998877');
        setOrganization('Sub-Divisional Magistrate Office, Haveli');
        setDesignation('Competent Authority for Land Acquisition (CALA) / SDM');
        setState('Maharashtra');
        setDistrict('Pune');
        setAuthorityOffice('CALA Sub-Divisional Office, Haveli');
        setApplicableProjectType('National Highway');
        setAuthorityScope('District-level');
        setReasonForAccess('Conducting Section 15 landowner hearings and issuing statutory administrative directions.');
        break;

      case 'ML_DATA_TEAM':
        setFullName('Dr. Meera Swaminathan');
        setOfficialEmail('meera.swaminathan@nic.in');
        setMobileNumber('9940123456');
        setOrganization('NIC AI Center of Excellence & Predictive Modeling Division');
        setDesignation('Senior Data Scientist & AI Systems Specialist');
        setTechnicalTeam('NIC Predictive Land Intelligence Group');
        setSelectedPurposes(['Model Monitoring', 'Data Quality Monitoring', 'Model Evaluation']);
        setSelectedDataScopes(['Model Metrics', 'Evaluation Dataset']);
        setReasonForAccess('Monitoring algorithm drift (PSI), checking feature importance stability, and auditing delay risk models.');
        break;
    }
    setErrors({});
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = 'Please enter your full name.';
    }

    if (!officialEmail.trim()) {
      errs.officialEmail = 'Please enter your official email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(officialEmail.trim())) {
      errs.officialEmail = 'Please provide a valid official email format (e.g. officer@nic.in).';
    }

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile) {
      errs.mobileNumber = 'Please enter your mobile number.';
    } else if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
      errs.mobileNumber = 'Please enter a valid 10-digit Indian mobile number starting with 6-9.';
    }

    if (!organization.trim()) {
      errs.organization = 'Please enter your department or organization.';
    }

    if (!designation.trim()) {
      errs.designation = 'Please enter your official designation.';
    }

    if (!reasonForAccess.trim()) {
      errs.reasonForAccess = 'Please specify the reason for requesting access.';
    }

    // Role-specific validation
    if (selectedRole === 'STATE_OFFICER') {
      if (!state) errs.state = 'Please select your state.';
    } else if (selectedRole === 'DISTRICT_OFFICER') {
      if (!state) errs.state = 'Please select your state.';
      if (!district) errs.district = 'Please select your district.';
    } else if (selectedRole === 'PROJECT_OFFICER') {
      if (!state) errs.state = 'Please select your state.';
      if (!district) errs.district = 'Please select your district.';
      if (!selectedProjectId && !customProjectName.trim()) {
        errs.project = 'Please select or specify the project you are assigned to.';
      }
    } else if (selectedRole === 'VERIFICATION_OFFICER') {
      if (!state) errs.state = 'Please select your state.';
      if (!district) errs.district = 'Please select your district.';
      if (selectedVerificationScopes.length === 0) {
        errs.verificationScopes = 'Please select at least one verification scope.';
      }
    } else if (selectedRole === 'COMPETENT_AUTHORITY') {
      if (!state) errs.state = 'Please select your state.';
      if (!district) errs.district = 'Please select your district.';
    } else if (selectedRole === 'ML_DATA_TEAM') {
      if (!technicalTeam.trim()) {
        errs.technicalTeam = 'Please specify your technical team or division.';
      }
      if (selectedPurposes.length === 0) {
        errs.purposes = 'Please select at least one access purpose.';
      }
      if (selectedDataScopes.length === 0) {
        errs.dataScopes = 'Please select at least one requested data scope.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setStep('review');
    }
  };

  const handleFinalSubmit = () => {
    if (!selectedRole) return;
    setIsSubmitting(true);

    let requestedScope = 'State-level';
    if (selectedRole === 'DISTRICT_OFFICER') {
      requestedScope = `${district} District (${state})`;
    } else if (selectedRole === 'PROJECT_OFFICER') {
      const proj = projects.find((p) => p.id === selectedProjectId);
      requestedScope = proj ? `Project: ${proj.name} (${proj.id})` : `Assigned Project: ${customProjectName}`;
    } else if (selectedRole === 'VERIFICATION_OFFICER') {
      requestedScope = `Verification Scope: ${selectedVerificationScopes.join(', ')} (${district})`;
    } else if (selectedRole === 'COMPETENT_AUTHORITY') {
      requestedScope = `${authorityScope} Authority Scope (${district}, ${state})`;
    } else if (selectedRole === 'ML_DATA_TEAM') {
      requestedScope = `ML Monitoring: ${selectedDataScopes.join(', ')}`;
    }

    const reqData = {
      requestedRole: selectedRole,
      requestedScope,
      fullName: fullName.trim(),
      officialEmail: officialEmail.trim(),
      mobileNumber: mobileNumber.trim(),
      organization: organization.trim(),
      designation: designation.trim(),
      state: selectedRole !== 'ML_DATA_TEAM' ? state : undefined,
      district: selectedRole !== 'ML_DATA_TEAM' && selectedRole !== 'STATE_OFFICER' ? district : undefined,
      tehsil: selectedRole === 'PROJECT_OFFICER' ? tehsil : undefined,
      village: selectedRole === 'PROJECT_OFFICER' && village ? village : undefined,
      departmentDivision: departmentDivision.trim() || undefined,
      reasonForAccess: reasonForAccess.trim(),
      projectType: selectedRole === 'PROJECT_OFFICER' ? projectType : undefined,
      projectId: selectedRole === 'PROJECT_OFFICER' ? selectedProjectId : undefined,
      projectName:
        selectedRole === 'PROJECT_OFFICER'
          ? projects.find((p) => p.id === selectedProjectId)?.name || customProjectName
          : undefined,
      assignmentResponsibility: selectedRole === 'PROJECT_OFFICER' ? assignmentResponsibility : undefined,
      verificationJurisdiction: selectedRole === 'VERIFICATION_OFFICER' ? verificationJurisdiction : undefined,
      relevantDepartment: selectedRole === 'VERIFICATION_OFFICER' ? relevantDepartment : undefined,
      verificationScopes: selectedRole === 'VERIFICATION_OFFICER' ? selectedVerificationScopes : undefined,
      authorityOffice: selectedRole === 'COMPETENT_AUTHORITY' ? authorityOffice : undefined,
      applicableProjectType: selectedRole === 'COMPETENT_AUTHORITY' ? applicableProjectType : undefined,
      authorityScope: selectedRole === 'COMPETENT_AUTHORITY' ? authorityScope : undefined,
      technicalTeam: selectedRole === 'ML_DATA_TEAM' ? technicalTeam : undefined,
      purposesOfAccess: selectedRole === 'ML_DATA_TEAM' ? selectedPurposes : undefined,
      requestedDataScopes: selectedRole === 'ML_DATA_TEAM' ? selectedDataScopes : undefined,
    };

    setTimeout(() => {
      const saved = saveAccessRequest(reqData);
      setSubmittedRequest(saved);
      setIsSubmitting(false);
      setStep('submitted');
    }, 450);
  };

  const roleConfig = selectedRole ? ROLE_CARD_CONFIG[selectedRole] : null;

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900 flex flex-col font-sans">
      {/* Top GIGW System Declaration Bar */}
      <div className="bg-[#0b243d] text-white text-xs py-1.5 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-2 border-b border-blue-900/60">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-bold tracking-wide uppercase text-[11px] text-amber-300">
            OFFICER ACCESS WORKFLOW
          </span>
          <span className="text-slate-400 hidden sm:inline">&bull;</span>
          <span className="text-slate-300 text-[11px] hidden sm:inline">
            Role-Based Information Collection & Authorization Cycle
          </span>
        </div>
        <button
          onClick={onBackToSignIn}
          className="text-xs text-blue-200 hover:text-white flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </button>
      </div>

      {/* Main Government Portal Header */}
      <header className="bg-[#123B63] text-white px-4 sm:px-8 py-3.5 border-b border-blue-900 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
            <Shield className="w-6 h-6 text-amber-400 fill-amber-400/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                BhooNiti
              </span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-400/30 uppercase tracking-wider">
                Access Request Portal
              </span>
            </div>
            <p className="text-xs text-blue-100/90 hidden sm:block">
              Statutory Role & Jurisdiction Provisioning Engine
            </p>
          </div>
        </div>

        {/* Workflow Breadcrumb */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              step === 'select_role' ? 'bg-amber-400 text-slate-900' : 'text-blue-200'
            }`}
          >
            1. Role
          </span>
          <span className="text-blue-300">&rarr;</span>
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              step === 'fill_form' ? 'bg-amber-400 text-slate-900' : 'text-blue-200'
            }`}
          >
            2. Information
          </span>
          <span className="text-blue-300">&rarr;</span>
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              step === 'review' ? 'bg-amber-400 text-slate-900' : 'text-blue-200'
            }`}
          >
            3. Review
          </span>
          <span className="text-blue-300">&rarr;</span>
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              step === 'submitted' ? 'bg-amber-400 text-slate-900' : 'text-blue-200'
            }`}
          >
            4. Authorization
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-start">
        {/* Statutory Context Banner */}
        <div className="mb-5 bg-blue-50 border border-blue-200 rounded p-3 text-xs text-[#123B63] flex items-start gap-2.5 shadow-xs">
          <Info className="w-4 h-4 text-[#123B63] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Access is based on role, jurisdiction and authorization.</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Role-based access workflow. Official deployment integrates identity verification (Parichay/MeriPehchan SAML2.0), departmental vetting, and statutory gazette appointment confirmation.
            </p>
          </div>
        </div>

        {/* ================= STEP 1: SELECT ROLE ================= */}
        {step === 'select_role' && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#123B63] text-white text-[11px] font-bold px-2 py-0.5 rounded">
                  STEP 1 OF 3
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                  REQUEST ACCESS
                </h1>
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-2">
                What type of access are you requesting?
              </p>
              <p className="text-xs text-slate-500">
                Select your statutory function. The application will collect only the information relevant to this role.
              </p>
            </div>

            {/* 6 Requestable Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(Object.keys(ROLE_CARD_CONFIG) as RequestableRole[]).map((roleKey, idx) => {
                const cfg = ROLE_CARD_CONFIG[roleKey];
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => handleRoleSelect(roleKey)}
                    className="p-4 rounded-lg border border-slate-200 bg-white hover:border-[#123B63] hover:shadow-md transition text-left flex flex-col justify-between group focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[11px] text-slate-700 font-bold">
                            {idx + 1}
                          </span>
                          <span>{cfg.level}</span>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cfg.badgeColor}`}>
                          {cfg.summaryScope}
                        </span>
                      </div>

                      <h2 className="text-base font-bold text-slate-900 group-hover:text-[#123B63] transition font-serif">
                        {cfg.title}
                      </h2>
                      <div className="text-xs font-medium text-slate-700 mt-0.5">
                        {cfg.subtitle}
                      </div>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {cfg.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#123B63]">
                      <span>Select Role</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* System Administrator Security Rule Notice */}
            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">System Administrator accounts cannot be requested here:</strong>{' '}
                Under platform security guidelines, system administration and RBAC policy management accounts must only be configured directly by authorized infrastructure security administrators.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={onBackToSignIn}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel & Return to Sign In
              </button>
              <span className="text-xs text-slate-400">Step 1: Role Selection</span>
            </div>
          </div>
        )}

        {/* ================= STEP 2: FILL ROLE-SPECIFIC FORM ================= */}
        {step === 'fill_form' && roleConfig && selectedRole && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
            {/* Header & Quick Sample */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#123B63] text-white text-[11px] font-bold px-2 py-0.5 rounded">
                    STEP 2 OF 3
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('select_role')}
                    className="text-xs text-[#123B63] hover:underline font-bold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Change Role
                  </button>
                </div>
                <h1 className="text-xl font-bold text-slate-900 font-serif mt-1">
                  {roleConfig.title} &mdash; Access Request
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Collecting only information required for {roleConfig.title} authorization.
                </p>
              </div>

              {/* Quick Fill Sample Button */}
              <button
                type="button"
                onClick={handleQuickFillSample}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto shrink-0 shadow-xs"
                title="Fill sample details for this role"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Quick Fill Sample Officer</span>
              </button>
            </div>

            {/* Role Scope Reminder Card */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Requested Access Scope
                </span>
                <div className="font-bold text-[#123B63] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#123B63]" />
                  <span>{roleConfig.summaryScope}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 max-w-sm text-right hidden sm:block">
                {roleConfig.authorityNote}
              </div>
            </div>

            {/* The Dynamic Form */}
            <form onSubmit={handleProceedToReview} className="space-y-5">
              {/* SECTION A: Personal / Identity Information (Common) */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#123B63]" />
                  <span>Personal & Identity Information</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Sunita Deshmukh, IAS"
                      className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                    />
                    {errors.fullName && (
                      <span className="text-red-600 text-[11px] font-medium mt-0.5 block">
                        {errors.fullName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Official / Organization Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={officialEmail}
                      onChange={(e) => setOfficialEmail(e.target.value)}
                      placeholder="e.g. officer@nic.in or officer@nhai.org"
                      className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                    />
                    {errors.officialEmail && (
                      <span className="text-red-600 text-[11px] font-medium mt-0.5 block">
                        {errors.officialEmail}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Mobile Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="10-digit Indian mobile (e.g. 9822012345)"
                      className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63] font-mono"
                    />
                    {errors.mobileNumber && (
                      <span className="text-red-600 text-[11px] font-medium mt-0.5 block">
                        {errors.mobileNumber}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Official Designation <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. District Collector, SDM, Project Director"
                      className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                    />
                    {errors.designation && (
                      <span className="text-red-600 text-[11px] font-medium mt-0.5 block">
                        {errors.designation}
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">
                      Organization / Department <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. District Revenue Administration / NHAI PIU / SLAO Cell"
                      className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                    />
                    {errors.organization && (
                      <span className="text-red-600 text-[11px] font-medium mt-0.5 block">
                        {errors.organization}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION B: Dynamic Location & Jurisdiction Cascade */}
              {selectedRole !== 'ML_DATA_TEAM' && (
                <div className="space-y-3 pt-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#123B63]" />
                    <span>Location & Jurisdiction Information</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                    {/* State (Always required for non-ML roles) */}
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        State <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={state}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63] bg-white"
                      >
                        {Object.keys(INDIAN_STATES_AND_DISTRICTS).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {errors.state && (
                        <span className="text-red-600 text-[11px] font-medium mt-0.5 block">
                          {errors.state}
                        </span>
                      )}
                    </div>

                    {/* District (For District, Project, Verification, Authority roles) */}
                    {selectedRole !== 'STATE_OFFICER' && (
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          District <span className="text-red-600">*</span>
                        </label>
                        <select
                          value={district}
                          onChange={(e) => handleDistrictChange(e.target.value)}
                          className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63] bg-white"
                        >
                          {availableDistricts.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        {errors.district && (
                          <span className="text-red-600 text-[11px] font-medium mt-0.5 block">
                            {errors.district}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tehsil/Taluka (For Project Officer) */}
                    {selectedRole === 'PROJECT_OFFICER' && (
                      <div>
                        <label className="block font-bold text-slate-800 mb-1">
                          Tehsil / Taluka <span className="text-slate-400 font-normal">(Required)</span>
                        </label>
                        {availableTehsils.length > 0 ? (
                          <select
                            value={tehsil}
                            onChange={(e) => setTehsil(e.target.value)}
                            className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63] bg-white"
                          >
                            {availableTehsils.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={tehsil}
                            onChange={(e) => setTehsil(e.target.value)}
                            placeholder="e.g. Haveli"
                            className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                          />
                        )}
                      </div>
                    )}

                    {/* Department / Division */}
                    <div className={selectedRole === 'STATE_OFFICER' ? 'sm:col-span-2' : 'sm:col-span-1'}>
                      <label className="block font-bold text-slate-800 mb-1">
                        Department / Division <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={departmentDivision}
                        onChange={(e) => setDepartmentDivision(e.target.value)}
                        placeholder="e.g. Land Acquisition Cell, Mantralaya"
                        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION C: Project Officer Specific Assignment */}
              {selectedRole === 'PROJECT_OFFICER' && (
                <div className="space-y-3 pt-2 bg-amber-50/50 p-3.5 rounded border border-amber-200">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-800" />
                    <span>Project Assignment & Jurisdiction</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Project Type <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63] bg-white"
                      >
                        {PROJECT_TYPES_LIST.map((pt) => (
                          <option key={pt} value={pt}>
                            {pt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Select Project <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={selectedProjectId}
                        onChange={(e) => {
                          setSelectedProjectId(e.target.value);
                          if (e.target.value !== 'OTHER') {
                            setCustomProjectName('');
                          }
                        }}
                        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63] bg-white"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id}: {p.name}
                          </option>
                        ))}
                        <option value="OTHER">Other / Custom Project...</option>
                      </select>
                    </div>

                    {selectedProjectId === 'OTHER' && (
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-800 mb-1">
                          Custom Project Name & ID <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={customProjectName}
                          onChange={(e) => setCustomProjectName(e.target.value)}
                          placeholder="e.g. NH-60 Pune-Nashik Greenfield Spur"
                          className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                        />
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-800 mb-1">
                        Responsibility / Assignment <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={assignmentResponsibility}
                        onChange={(e) => setAssignmentResponsibility(e.target.value)}
                        placeholder="e.g. Joint Measurement Surveys (JMS) and Section 3D RoW possession"
                        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-800 italic">
                    Note: A Project Officer must not automatically receive access to every project. Access will be explicitly verified and assigned by the administrator upon review.
                  </p>
                </div>
              )}

              {/* SECTION D: Verification Officer Specific Scope */}
              {selectedRole === 'VERIFICATION_OFFICER' && (
                <div className="space-y-3 pt-2 bg-emerald-50/50 p-3.5 rounded border border-emerald-200">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Verification Jurisdiction & Scope</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Verification Jurisdiction <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={verificationJurisdiction}
                        onChange={(e) => setVerificationJurisdiction(e.target.value)}
                        placeholder="e.g. Regional Land Records Scrutiny Cell"
                        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Relevant Department / Office <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={relevantDepartment}
                        onChange={(e) => setRelevantDepartment(e.target.value)}
                        placeholder="e.g. Special Land Acquisition Office (SLAO)"
                        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-800 mb-1.5">
                        Verification Scope (Select applicable categories) <span className="text-red-600">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {VERIFICATION_SCOPES_LIST.map((scope) => {
                          const isChecked = selectedVerificationScopes.includes(scope);
                          return (
                            <label
                              key={scope}
                              className={`flex items-center gap-2 p-2 rounded border transition cursor-pointer ${
                                isChecked
                                  ? 'bg-emerald-100/70 border-emerald-400 font-semibold text-emerald-950'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedVerificationScopes((prev) =>
                                      prev.filter((s) => s !== scope)
                                    );
                                  } else {
                                    setSelectedVerificationScopes((prev) => [...prev, scope]);
                                  }
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{scope}</span>
                            </label>
                          );
                        })}
                      </div>
                      {errors.verificationScopes && (
                        <span className="text-red-600 text-[11px] font-medium mt-1 block">
                          {errors.verificationScopes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION E: Competent / Authorized Authority Specific Scope */}
              {selectedRole === 'COMPETENT_AUTHORITY' && (
                <div className="space-y-3 pt-2 bg-rose-50/50 p-3.5 rounded border border-rose-200">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-rose-800" />
                    <span>Statutory Authority & Jurisdiction</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Authority / Office <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={authorityOffice}
                        onChange={(e) => setAuthorityOffice(e.target.value)}
                        placeholder="e.g. Sub-Divisional Magistrate & CALA Office"
                        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Applicable Project Type <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={applicableProjectType}
                        onChange={(e) => setApplicableProjectType(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63] bg-white"
                      >
                        <option value="National Highway">National Highway (CALA under NH Act 1956)</option>
                        <option value="Railway">Railway (Competent Authority under Railways Act)</option>
                        <option value="State Infrastructure">State Infrastructure (RFCTLARR Act 2013)</option>
                        <option value="Metro Rail">Metro Rail Project</option>
                        <option value="Other">Other Statutory Infrastructure</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-800 mb-1">
                        Authority Scope <span className="text-red-600">*</span>
                      </label>
                      <div className="flex flex-wrap gap-4 text-xs pt-1">
                        {(['District-level', 'State-level', 'Project-level'] as const).map((sc) => (
                          <label key={sc} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                            <input
                              type="radio"
                              name="authorityScope"
                              value={sc}
                              checked={authorityScope === sc}
                              onChange={() => setAuthorityScope(sc)}
                              className="text-rose-700 focus:ring-rose-600"
                            />
                            <span>{sc}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-rose-900/85 italic">
                    Generic statutory terminology is maintained throughout the system ("Competent / Authorized Authority"), with CALA-specific references applied where National Highway workflows are designated.
                  </p>
                </div>
              )}

              {/* SECTION F: ML / Data Team Technical Request (NO land or owner fields!) */}
              {selectedRole === 'ML_DATA_TEAM' && (
                <div className="space-y-3 pt-2 bg-cyan-50/50 p-3.5 rounded border border-cyan-200">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-900 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-800" />
                    <span>Technical Access & Data Scope</span>
                  </h2>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Technical Team / Division <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={technicalTeam}
                        onChange={(e) => setTechnicalTeam(e.target.value)}
                        placeholder="e.g. NIC AI Decision-Support Systems Division"
                        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                      />
                      {errors.technicalTeam && (
                        <span className="text-red-600 text-[11px] font-medium mt-0.5 block">
                          {errors.technicalTeam}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        Purpose of Access <span className="text-red-600">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ML_PURPOSES_LIST.map((purp) => {
                          const isChecked = selectedPurposes.includes(purp);
                          return (
                            <label
                              key={purp}
                              className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer ${
                                isChecked
                                  ? 'bg-cyan-100/70 border-cyan-400 font-semibold text-cyan-950'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedPurposes((prev) => prev.filter((p) => p !== purp));
                                  } else {
                                    setSelectedPurposes((prev) => [...prev, purp]);
                                  }
                                }}
                                className="rounded text-cyan-600 focus:ring-cyan-500"
                              />
                              <span>{purp}</span>
                            </label>
                          );
                        })}
                      </div>
                      {errors.purposes && (
                        <span className="text-red-600 text-[11px] font-medium mt-1 block">
                          {errors.purposes}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1.5">
                        Requested Data Scope <span className="text-red-600">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ML_DATA_SCOPES_LIST.map((dScope) => {
                          const isChecked = selectedDataScopes.includes(dScope);
                          return (
                            <label
                              key={dScope}
                              className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer ${
                                isChecked
                                  ? 'bg-cyan-100/70 border-cyan-400 font-semibold text-cyan-950'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedDataScopes((prev) =>
                                      prev.filter((s) => s !== dScope)
                                    );
                                  } else {
                                    setSelectedDataScopes((prev) => [...prev, dScope]);
                                  }
                                }}
                                className="rounded text-cyan-600 focus:ring-cyan-500"
                              />
                              <span>{dScope}</span>
                            </label>
                          );
                        })}
                      </div>
                      {errors.dataScopes && (
                        <span className="text-red-600 text-[11px] font-medium mt-1 block">
                          {errors.dataScopes}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-cyan-900 italic">
                    Security Policy: Access to real-world citizen or land-owner PII is restricted. Technical scope is confined to aggregated feature telemetry, synthetic validation sets, and model drift statistics.
                  </p>
                </div>
              )}

              {/* Reason for Access (Common Required) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Reason for Requesting Access <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reasonForAccess}
                  onChange={(e) => setReasonForAccess(e.target.value)}
                  placeholder="Explain the statutory or operational justification for this access request..."
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63]"
                />
                {errors.reasonForAccess && (
                  <span className="text-red-600 text-[11px] font-medium mt-0.5 block">
                    {errors.reasonForAccess}
                  </span>
                )}
              </div>

              {/* Form Navigation Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('select_role')}
                  className="px-4 py-2 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Roles
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#123B63] hover:bg-[#0d2c4b] text-white rounded text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <span>Review Access Request</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 3: REVIEW ACCESS REQUEST ================= */}
        {step === 'review' && roleConfig && selectedRole && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#123B63] text-white text-[11px] font-bold px-2 py-0.5 rounded">
                  STEP 3 OF 3
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                  REVIEW YOUR ACCESS REQUEST
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                Please verify your details before final submission to the authorization administrator.
              </p>
            </div>

            {/* Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                    Requested Role
                  </span>
                  <span className="text-base font-bold text-[#123B63] font-serif">
                    {roleConfig.title}
                  </span>
                  <span className="text-slate-500 text-xs block">{roleConfig.subtitle}</span>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${roleConfig.badgeColor}`}>
                  {roleConfig.summaryScope}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <span className="text-slate-500 text-[11px] block">Full Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Official Email:</span>
                  <span className="font-mono text-slate-900 font-semibold">{officialEmail}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Mobile Number:</span>
                  <span className="font-mono text-slate-900 font-semibold">{mobileNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Official Designation:</span>
                  <span className="font-bold text-slate-900">{designation}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 text-[11px] block">Organization / Department:</span>
                  <span className="font-bold text-slate-900">{organization}</span>
                </div>

                {/* Location / Technical Scope Breakdown */}
                {selectedRole !== 'ML_DATA_TEAM' ? (
                  <>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Jurisdiction:</span>
                      <span className="font-bold text-slate-900">
                        {state}
                        {district && selectedRole !== 'STATE_OFFICER' ? ` → ${district}` : ''}
                        {tehsil && selectedRole === 'PROJECT_OFFICER' ? ` → ${tehsil}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Department / Division:</span>
                      <span className="font-medium text-slate-800">
                        {departmentDivision || 'General Division'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Technical Team:</span>
                      <span className="font-bold text-slate-900">{technicalTeam}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Requested Data Scope:</span>
                      <span className="font-bold text-cyan-900">
                        {selectedDataScopes.join(', ')}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 text-[11px] block">Purpose of Access:</span>
                      <span className="font-medium text-slate-800">
                        {selectedPurposes.join('; ')}
                      </span>
                    </div>
                  </>
                )}

                {/* Project Officer Specific Details */}
                {selectedRole === 'PROJECT_OFFICER' && (
                  <div className="sm:col-span-2 p-3 bg-amber-50 rounded border border-amber-200 space-y-1">
                    <span className="text-[10px] text-amber-900 uppercase font-bold tracking-wider block">
                      Project Assignment
                    </span>
                    <div className="font-bold text-slate-900">
                      {selectedProjectId === 'OTHER'
                        ? customProjectName
                        : `${selectedProjectId}: ${projects.find((p) => p.id === selectedProjectId)?.name}`}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Type: <strong>{projectType}</strong> &bull; Responsibility: {assignmentResponsibility}
                    </div>
                  </div>
                )}

                {/* Verification Officer Specific Details */}
                {selectedRole === 'VERIFICATION_OFFICER' && (
                  <div className="sm:col-span-2 p-3 bg-emerald-50 rounded border border-emerald-200 space-y-1">
                    <span className="text-[10px] text-emerald-900 uppercase font-bold tracking-wider block">
                      Assigned Verification Scopes
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {selectedVerificationScopes.map((sc) => (
                        <span
                          key={sc}
                          className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-300"
                        >
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reason for Access */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 text-[11px] block">Operational Reason:</span>
                  <p className="text-slate-800 text-xs font-medium italic mt-0.5">
                    "{reasonForAccess}"
                  </p>
                </div>
              </div>
            </div>

            {/* Statutory Acknowledgement Notice */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
              <span className="font-bold text-slate-800">Security Rule:</span> Submission of this form initiates an access request. The final authorized role, assigned projects, and jurisdiction are determined by the administrator before activation.
            </div>

            {/* Review Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('fill_form')}
                className="px-4 py-2 border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back & Edit
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className={`px-6 py-2.5 rounded text-xs font-bold text-white transition flex items-center gap-2 shadow-xs ${
                  isSubmitting
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Submit Access Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: SUBMITTED CONFIRMATION ================= */}
        {step === 'submitted' && submittedRequest && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-300">
                <Clock className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 font-serif">
                Access Request Submitted
              </h1>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your request has been submitted for authorization. Access will be activated only after review by the designated administrator.
              </p>
            </div>

            {/* Request Summary Receipt */}
            <div className="max-w-lg mx-auto bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <span className="font-bold text-slate-700">Status:</span>
                <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold border border-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Pending Verification</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Request ID:</span>
                <span className="font-mono font-bold text-[#123B63] text-sm">
                  {submittedRequest.id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Requested Role:</span>
                <span className="font-bold text-slate-800">
                  {ROLE_CARD_CONFIG[submittedRequest.requestedRole]?.title || submittedRequest.requestedRole}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-semibold text-slate-800">{submittedRequest.fullName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Requested Scope:</span>
                <span className="font-bold text-[#123B63] text-right truncate max-w-[220px]">
                  {submittedRequest.requestedScope}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Submission Timestamp:</span>
                <span className="font-mono text-slate-600 text-[11px]">
                  {submittedRequest.submittedAt}
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Statutory Authorization Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700">
                "Access will be activated only after authorization by the designated administrator."
                The authorized role and jurisdiction will be assigned during administrator review.
              </p>
            </div>

            {/* Review Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onBackToSignIn}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 hover:bg-slate-100 rounded text-xs font-bold text-slate-800 transition"
              >
                Return to Sign In Screen
              </button>

              {onOpenAdminReview && (
                <button
                  type="button"
                  onClick={() => onOpenAdminReview(submittedRequest.id)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#123B63] hover:bg-[#0e2e4e] text-white rounded text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Open in Admin Review</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Statutory Footer */}
      <footer className="bg-[#0b243d] text-slate-400 text-xs py-3 px-4 sm:px-8 border-t border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
        <div className="text-[11px] text-slate-300">
          <strong>BhooNiti:</strong> Role-based access control engine for statutory land acquisition projects.
        </div>
        <div className="text-[10px] text-slate-400">
          GIGW 3.0 Compliant
        </div>
      </footer>
    </div>
  );
};
