import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Globe,
  Contrast,
  Building,
  KeyRound,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  UserPlus,
  Sparkles,
  Trash2,
  LogIn,
  MapPin,
  Mail,
  Check,
} from 'lucide-react';
import { Language, AuthUser, UserRole, Project } from '../types';
import { translations, roleDescriptions, SUPPORTED_LANGUAGES } from '../data/translations';
import {
  DEMO_USERS,
  authenticateUser,
  registerNewUser,
  getCustomUsers,
  deleteCustomUser,
  CustomUserRecord,
  roleDefaultTitles,
  roleDesignationLevels,
} from '../data/auth';
import { RequestAccessView } from './RequestAccessView';

interface LoginScreenProps {
  projects?: Project[];
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  highContrast: boolean;
  onToggleContrast: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  loggedOutNotice?: string | null;
  onClearLogoutNotice?: () => void;
  initialMode?: 'signin' | 'register';
  onModeChange?: (mode: 'signin' | 'register') => void;
}

const SAMPLE_OFFICER_PRESETS: Record<
  UserRole,
  {
    name: string;
    email: string;
    dept: string;
    jurisdiction: string;
    username: string;
  }
> = {
  DISTRICT_OFFICER: {
    name: 'Shri Anand Kulkarni, IAS',
    email: 'collector.thane@gov.in',
    dept: 'District Revenue Administration, Thane',
    jurisdiction: 'Thane District, Maharashtra',
    username: 'anand_collector',
  },
  STATE_OFFICER: {
    name: 'Dr. Pratibha Patil, IAS',
    email: 'prsec.infra@maharashtra.gov.in',
    dept: 'Department of Revenue & Forest, Govt. of Maharashtra',
    jurisdiction: 'State of Maharashtra',
    username: 'pratibha_state',
  },
  PROJECT_OFFICER: {
    name: 'Er. Rameshwar Jadhav',
    email: 'pd.nashik@nhai.org',
    dept: 'National Highways Authority of India (NHAI PIU Nashik)',
    jurisdiction: 'NH-60 Corridor & Spurs',
    username: 'rameshwar_nhai',
  },
  COMPETENT_AUTHORITY: {
    name: 'Smt. Rohini Bhosale',
    email: 'cala.pune@gov.in',
    dept: 'Sub-Divisional Magistrate & Competent Authority Office',
    jurisdiction: 'Haveli Sub-Division, Pune',
    username: 'rohini_cala',
  },
  VERIFICATION_OFFICER: {
    name: 'Shri Ashok Thorat',
    email: 'slao.scrutiny@maharashtra.gov.in',
    dept: 'District Land Records & Scrutiny Cell',
    jurisdiction: 'Western Division Verification Unit',
    username: 'ashok_slao',
  },
  ML_DATA_TEAM: {
    name: 'Dr. Meera Swaminathan',
    email: 'meera.swaminathan@nic.in',
    dept: 'NIC AI Decision-Support Systems Division',
    jurisdiction: 'National Algorithm Architecture & Supervision',
    username: 'meera_ai',
  },
  SYSTEM_ADMIN: {
    name: 'Venkatesh Rao',
    email: 'v.rao@nic.in',
    dept: 'National Informatics Infrastructure Center',
    jurisdiction: 'Platform Infrastructure, RBAC & Security',
    username: 'venkatesh_admin',
  },
  MINISTRY_OFFICER: {
    name: 'Shri H. C. Meena',
    email: 'hc.meena@morth.nic.in',
    dept: 'Ministry of Road Transport and Highways (MoRTH)',
    jurisdiction: 'National Infrastructure Pipeline',
    username: 'meena_ministry',
  },
  CITIZEN: {
    name: 'Citizen (Public Portal)',
    email: 'citizen.portal@bhooniti.gov.in',
    dept: 'Public Landowner / Citizen',
    jurisdiction: 'All Districts (Public Access)',
    username: 'citizen_public',
  },
};

export const LoginScreen: React.FC<LoginScreenProps> = ({
  projects = [],
  currentLang,
  onLanguageChange,
  highContrast,
  onToggleContrast,
  onLoginSuccess,
  loggedOutNotice,
  onClearLogoutNotice,
  initialMode = 'signin',
  onModeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>(initialMode);

  // Sign In form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prefilledRole, setPrefilledRole] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Registration form state
  const [regRole, setRegRole] = useState<UserRole>('DISTRICT_OFFICER');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDept, setRegDept] = useState('District Revenue Administration');
  const [regJurisdiction, setRegJurisdiction] = useState('Pune District, Maharashtra');
  const [regTitle, setRegTitle] = useState(roleDefaultTitles.DISTRICT_OFFICER);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Custom users in local storage
  const [customUsers, setCustomUsers] = useState<CustomUserRecord[]>([]);

  useEffect(() => {
    setCustomUsers(getCustomUsers());
  }, []);

  useEffect(() => {
    if (initialMode && initialMode !== activeTab) {
      setActiveTab(initialMode);
    }
  }, [initialMode]);

  const handleTabSwitch = (tab: 'signin' | 'register') => {
    setActiveTab(tab);
    setErrorMessage(null);
    setRegError(null);
    setRegSuccessMsg(null);
    if (onClearLogoutNotice) onClearLogoutNotice();
    if (onModeChange) onModeChange(tab);
  };

  const handleRoleChange = (role: UserRole) => {
    setRegRole(role);
    setRegTitle(roleDefaultTitles[role] || 'Land Acquisition Officer');
    const preset = SAMPLE_OFFICER_PRESETS[role];
    if (preset) {
      setRegDept(preset.dept);
      setRegJurisdiction(preset.jurisdiction);
    }
  };

  const handleApplyQuickSample = () => {
    const preset = SAMPLE_OFFICER_PRESETS[regRole];
    if (preset) {
      setRegName(preset.name);
      setRegEmail(preset.email);
      setRegDept(preset.dept);
      setRegJurisdiction(preset.jurisdiction);
      setRegUsername(preset.username);
      setRegPassword('demo123');
      setRegConfirmPassword('demo123');
      setRegTitle(roleDefaultTitles[regRole]);
      setRegError(null);
    }
  };

  const handleDemoAccountClick = (userAccount: typeof DEMO_USERS[0]) => {
    setActiveTab('signin');
    setUsername(userAccount.username);
    setPassword(userAccount.defaultPassword);
    setPrefilledRole(`${userAccount.title} (${userAccount.username})`);
    setErrorMessage(null);
    if (onClearLogoutNotice) onClearLogoutNotice();
  };

  const handleCustomAccountSelect = (userAccount: CustomUserRecord) => {
    setActiveTab('signin');
    setUsername(userAccount.username);
    setPassword(userAccount.defaultPassword);
    setPrefilledRole(`${userAccount.name} [${userAccount.role}]`);
    setErrorMessage(null);
    if (onClearLogoutNotice) onClearLogoutNotice();
  };

  const handleDirectCustomLogin = (userAccount: CustomUserRecord) => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      const authUser: AuthUser = {
        username: userAccount.username,
        role: userAccount.role,
        scope: userAccount.scope || {},
        name: userAccount.name,
        title: userAccount.title,
        dept: userAccount.dept,
        jurisdiction: userAccount.jurisdiction,
        desc: userAccount.desc,
        email: userAccount.email,
        designationLevel: userAccount.designationLevel,
      };
      setIsLoading(false);
      onLoginSuccess(authUser);
    }, 300);
  };

  const handleDeleteCustomAccount = (e: React.MouseEvent, usernameToDelete: string) => {
    e.stopPropagation();
    deleteCustomUser(usernameToDelete);
    setCustomUsers(getCustomUsers());
    if (username === usernameToDelete) {
      setUsername('');
      setPassword('');
      setPrefilledRole(null);
    }
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onClearLogoutNotice) onClearLogoutNotice();

    if (!username.trim()) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Realistic authentication latency (350ms)
    setTimeout(() => {
      const result = authenticateUser(username, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'Invalid username or password.');
      }
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessMsg(null);

    if (!regName.trim()) {
      setRegError('Please enter the officer full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please provide a valid official email address.');
      return;
    }
    if (!regUsername.trim()) {
      setRegError('Please choose a username.');
      return;
    }
    if (regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = registerNewUser({
        username: regUsername,
        password: regPassword,
        name: regName,
        role: regRole,
        email: regEmail,
        dept: regDept,
        jurisdiction: regJurisdiction,
        title: regTitle,
        designationLevel: roleDesignationLevels[regRole],
      });

      setIsLoading(false);

      if (result.success && result.user) {
        setRegSuccessMsg(`Account created for ${result.user.name}. Logging into portal...`);
        setCustomUsers(getCustomUsers());
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 500);
      } else {
        setRegError(result.error || 'Registration failed. Please verify the input fields.');
      }
    }, 450);
  };

  if (activeTab === 'register') {
    return (
      <RequestAccessView
        projects={projects}
        onBackToSignIn={() => handleTabSwitch('signin')}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans ${
        highContrast ? 'contrast-125 bg-black text-white' : 'bg-[#f4f6f9] text-slate-900'
      }`}
    >
      {/* Top Accessibility Bar */}
      <div className="bg-[#0b243d] text-white text-xs py-1.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-blue-900/60">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-bold tracking-wide uppercase text-[11px] text-emerald-300">
            BHUMI-RAKSHA PORTAL
          </span>
          <span className="text-slate-400 hidden sm:inline">&bull;</span>
          <span className="text-slate-300 text-[11px] hidden sm:inline">
            Land Acquisition Delay Risk & Decision-Support System
          </span>
        </div>

        {/* Accessibility Toolbar */}
        <div className="flex items-center gap-3 text-xs">
          {/* High Contrast Toggle */}
          <button
            onClick={onToggleContrast}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              highContrast
                ? 'bg-amber-400 text-black border-amber-400 font-bold'
                : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Contrast className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">
              {highContrast ? 'Standard Contrast' : 'High Contrast'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Government Portal Header */}
      <header className="bg-[#123B63] text-white px-4 sm:px-8 py-3.5 border-b border-blue-900 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-sm shrink-0">
            <div className="relative">
              <Shield className="w-7 h-7 text-amber-400 fill-amber-400/20 stroke-[1.8]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                BhooNiti
              </span>
              <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30 uppercase tracking-wider">
                Active System
              </span>
            </div>
            <p className="text-xs text-blue-100/90 hidden sm:block">
              AI-Powered Land Acquisition Delay Risk & Decision-Support System
            </p>
          </div>
        </div>

        {/* Language selector in Header */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-200" />
          <select
            value={currentLang}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            aria-label="Select Portal Language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="text-slate-900">
                {lang.nativeName} ({lang.label})
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">
        {/* Sign-Out Notification Banner */}
        {loggedOutNotice && (
          <div className="w-full max-w-4xl mb-4 bg-blue-50 border-l-4 border-[#123B63] p-3.5 rounded shadow-xs flex items-center justify-between gap-3 text-xs text-[#123B63]">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{loggedOutNotice}</span>
            </div>
            <button
              onClick={onClearLogoutNotice}
              className="text-slate-500 hover:text-slate-800 text-[11px] underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Legal & Decision Support Advisory Box */}
        <div className="w-full max-w-4xl mb-5 bg-blue-50/70 border border-blue-200 rounded p-4 text-xs text-slate-800 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-[#123B63]">
            <ShieldAlert className="w-4 h-4 text-[#123B63] shrink-0" />
            <span>LAND ACQUISITION MONITORING & DECISION-SUPPORT FRAMEWORK</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Early warning and decision-support layer for authorized officers under statutory land-acquisition procedures (RFCTLARR Act 2013 and National Highways Act 1956).
          </p>
          <div className="pt-1 text-[11px] text-slate-600 font-medium">
            Role-based authentication configured for authorized officers and public landholders.
          </div>
        </div>

        {/* Two-Column Layout: Form Tabs (Sign In / Register) + Demo/Custom Accounts */}
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {/* Left Column: Form Tab Container (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
            <div>
              {/* Tab Selector Header */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-5">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signin')}
                  className="flex items-center gap-1.5 pb-2 text-xs sm:text-sm font-bold border-b-2 border-[#123B63] text-[#123B63] transition -mb-3.5 px-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className="flex items-center gap-1.5 pb-2 text-xs sm:text-sm font-bold border-b-2 border-transparent text-slate-500 hover:text-slate-800 transition -mb-3.5 px-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Request Access</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                    Role-Based
                  </span>
                </button>
              </div>

              {/* ----------------- SIGN IN FORM ----------------- */}
              <div>
                <div className="mb-4">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                    OFFICER SIGN IN
                  </h1>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Enter credentials for an existing or created officer account.
                  </p>
                </div>

                  {/* Success / Status Notification */}
                  {regSuccessMsg && (
                    <div
                      role="status"
                      className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2.5 rounded text-xs flex items-start gap-2 animate-in fade-in"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold">Access Request Status: </span>
                        {regSuccessMsg}
                      </div>
                      <button
                        type="button"
                        onClick={() => setRegSuccessMsg(null)}
                        className="text-emerald-700 hover:text-emerald-900 font-bold ml-1 text-xs"
                      >
                        &times;
                      </button>
                    </div>
                  )}

                  {/* Error Message */}
                  {errorMessage && (
                    <div
                      role="alert"
                      className="mb-4 bg-red-50 border border-red-200 text-red-800 px-3.5 py-2 rounded text-xs flex items-start gap-2 animate-in fade-in"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Authentication Error: </span>
                        {errorMessage}
                      </div>
                    </div>
                  )}

                  {/* Prefilled hint banner if user clicked demo profile */}
                  {prefilledRole && !errorMessage && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 text-[#123B63] px-3 py-2 rounded text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px] truncate max-w-[220px]">
                          Pre-filled: <strong>{prefilledRole}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] bg-white border border-blue-200 text-[#123B63] px-1.5 py-0.5 rounded font-bold shrink-0">
                        Click Sign In
                      </span>
                    </div>
                  )}

                  {/* Sign In Form */}
                  <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                    <div>
                      <label
                        htmlFor="username-input"
                        className="block text-xs font-bold text-slate-800 mb-1"
                      >
                        Username <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          id="username-input"
                          type="text"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          placeholder="e.g. district_demo or custom username"
                          autoComplete="username"
                          className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63] focus:border-transparent font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="password-input"
                          className="block text-xs font-bold text-slate-800"
                        >
                          Password <span className="text-red-600">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-[11px] text-[#123B63] hover:underline font-semibold"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          id="password-input"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          placeholder="Enter password"
                          autoComplete="current-password"
                          className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63] focus:border-transparent font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                          title={showPassword ? 'Hide password' : 'Show password'}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Sign In Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-2.5 px-4 rounded text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 shadow-xs ${
                          isLoading
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-[#123B63] hover:bg-[#0e2f50] active:bg-[#0b253f]'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Signing in...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Continue as Citizen Option (Requirement 2) */}
                    <div className="pt-2">
                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="shrink-0 mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          or Public Access
                        </span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            onLoginSuccess({
                              username: 'citizen_landowner',
                              role: 'CITIZEN',
                              citizenId: 'CIT-001',
                              scope: {},
                              name: 'Shri Vithal Ganpat Deshmukh',
                              title: 'Verified Land Owner (CIT-001)',
                              dept: 'Public Landowner / Citizen',
                              jurisdiction: 'Pune District, Maharashtra',
                              desc: 'Registered Landowner of Gat No. 104/2B (Pune-Bengaluru Industrial Expressway).',
                              email: 'vithal.deshmukh@gmail.com',
                              designationLevel: 'Verified Landowner Access',
                            });
                          }}
                          className="w-full py-2.5 px-3.5 rounded text-xs sm:text-sm font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition flex items-center justify-between shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-700 shrink-0" />
                            <div className="text-left">
                              <div>Continue as Land Owner (CIT-001)</div>
                              <div className="text-[10px] text-emerald-700 font-normal">Owns 2 Parcels (Gat No. 104/2B, 106/1B) &bull; OTP Verification Enabled</div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-emerald-700 shrink-0" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onLoginSuccess({
                              username: 'citizen_general',
                              role: 'CITIZEN',
                              citizenId: 'CIT-002',
                              scope: {},
                              name: 'Shri Rahul Kumar Sharma',
                              title: 'Public Citizen (CIT-002)',
                              dept: 'General Public Citizen',
                              jurisdiction: 'Pune District, Maharashtra',
                              desc: 'Non-land-owner resident seeking general project information.',
                              email: 'rahul.sharma@gmail.com',
                              designationLevel: 'Public Citizen Access',
                            });
                          }}
                          className="w-full py-2 px-3.5 rounded text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition flex items-center justify-between shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="text-left">
                              <div>Continue as Non-Land-Owner (CIT-002)</div>
                              <div className="text-[10px] text-slate-500 font-normal">Public Overview Only &bull; No Private Land Records</div>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 text-center mt-2">
                        Quick account access &bull; Evaluates ownership authorization logic (CIT-001 vs CIT-002)
                      </p>
                    </div>
                  </form>

                  {/* Prompt Mandate: New user? Request Access */}
                  <div className="mt-5 p-3.5 rounded bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900 block">New user? Request Access</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Submit a role-specific access request. Account activation follows administrator authorization.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('register')}
                      className="px-3 py-1.5 bg-white border border-[#123B63] text-[#123B63] font-bold rounded hover:bg-blue-50 transition text-xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#123B63]" />
                      <span>Request Access</span>
                    </button>
                  </div>
                </div>
            </div>

            {/* Bottom Security Note in form */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Protected under Role-Based Access Control (RBAC) & append-only audit logging.
              </span>
            </div>
          </div>

          {/* Right Column: Demo Accounts & Custom Accounts for Testing (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#123B63]" />
                  <span>Available Accounts for Testing</span>
                </h2>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-300">
                  Role Evaluation
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Click any account below to pre-fill credentials, or create your own custom officer account.
              </p>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {/* 1. CUSTOM / REGISTERED ACCOUNTS (If any exist) */}
                {customUsers.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Your Created Accounts ({customUsers.length})</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded border border-emerald-300">
                        Local Storage
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {customUsers.map((acc) => {
                        const isCurrent = username === acc.username;
                        return (
                          <div
                            key={acc.username}
                            className={`p-2.5 rounded border transition flex flex-col gap-1 bg-white ${
                              isCurrent
                                ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50/40 shadow-xs'
                                : 'border-emerald-200 hover:border-emerald-400'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                                  {acc.role.replace(/_/g, ' ')}
                                </span>
                                <span className="font-mono text-[11px] font-bold text-slate-800">
                                  {acc.username}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCustomAccount(e, acc.username)}
                                  title="Delete custom account from local storage"
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="text-xs font-bold text-slate-900">
                              {acc.name}
                            </div>

                            <div className="text-[11px] text-slate-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{acc.jurisdiction}</span>
                            </div>

                            {/* Action Buttons for custom account */}
                            <div className="pt-1 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCustomAccountSelect(acc)}
                                className="flex-1 py-1 px-2 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition"
                              >
                                Pre-fill
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDirectCustomLogin(acc)}
                                className="flex-1 py-1 px-2 text-[11px] font-bold rounded bg-emerald-700 hover:bg-emerald-800 text-white transition flex items-center justify-center gap-1"
                              >
                                <LogIn className="w-3 h-3" />
                                <span>Sign In Directly</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. PRE-CONFIGURED DEMO ACCOUNTS */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Pre-configured Officer Roles (8 Roles)</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      pwd: <strong className="font-mono text-slate-700">demo123</strong>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {DEMO_USERS.map((acc) => {
                      const isCurrent = username === acc.username;
                      return (
                        <button
                          key={acc.username}
                          type="button"
                          onClick={() => handleDemoAccountClick(acc)}
                          className={`w-full text-left p-2.5 rounded border transition flex flex-col gap-1 ${
                            isCurrent
                              ? 'bg-blue-50 border-[#123B63] ring-1 ring-[#123B63] shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 font-sans">
                                {acc.title}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-[#123B63] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {acc.username}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#123B63] font-medium">
                            {acc.name} &bull; <span className="text-slate-600">{acc.jurisdiction}</span>
                          </div>

                          <div className="text-[10px] text-slate-500 line-clamp-1">
                            {acc.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Security Access Engine v2.5</span>
              <span className="font-mono text-[10px]">Auth: Local & Custom RBAC</span>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#123B63]">
              <HelpCircle className="w-5 h-5" />
              <h2 className="text-base font-bold font-serif">Officer Credential Assistance</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In standard departmental operations, credentials and multi-factor authentication are verified via official government identity (Parichay / MeriPehchan SAML 2.0 single sign-on).
            </p>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded text-xs space-y-1">
              <div className="font-bold text-slate-800">Quick Sign-In Accounts:</div>
              <div>Use any pre-configured officer account (default password: <span className="font-mono font-bold text-[#123B63]">demo123</span>) or click the <strong>Register New Account</strong> tab to register an officer account.</div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="bg-[#123B63] hover:bg-[#0e2f50] text-white px-4 py-1.5 rounded text-xs font-bold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Footer */}
      <footer className="bg-[#0b243d] text-slate-400 text-xs py-3 px-4 sm:px-8 border-t border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
        <div className="text-[11px] text-slate-300">
          <strong>BhooNiti:</strong> AI-powered early-warning and decision-support layer for land-acquisition projects. It does not replace statutory land-acquisition procedures or authorized authority decisions.
        </div>
        <div className="text-[10px] text-slate-400 shrink-0">
          GIGW 3.0 &bull; WCAG 2.1 AA Compliant &bull; All Data Synthetic
        </div>
      </footer>
    </div>
  );
};
