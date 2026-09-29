import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Shield,
  CheckCircle,
  Key,
  Globe,
  Building,
} from 'lucide-react';
import { Language, UserRole, AuthUser, UserScope } from '../types';
import { translations } from '../data/translations';
import { DEMO_USERS, authenticateUser } from '../data/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onLoginSuccess: (user: AuthUser) => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onLoginSuccess,
  currentLang,
  onLanguageChange,
}) => {
  const t = translations[currentLang];
  const [username, setUsername] = useState('district_demo');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const demoAccounts: {
    username: string;
    role: UserRole;
    scope: UserScope;
    title: string;
    desc: string;
  }[] = [
    {
      username: 'district_demo',
      role: 'DISTRICT_OFFICER',
      scope: { state: 'Maharashtra', district: 'Pune' },
      title: 'District Collector & LAO (Pune)',
      desc: 'Local project oversight, compensation disbursement monitoring, SLAO camp deployment.',
    },
    {
      username: 'state_demo',
      role: 'STATE_OFFICER',
      scope: { state: 'Maharashtra' },
      title: 'Principal Secretary (Revenue, Maharashtra)',
      desc: 'Statewide pipeline tracking, interdepartmental deadlock resolution, high-level review.',
    },
    {
      username: 'project_demo',
      role: 'PROJECT_OFFICER',
      scope: { agency: 'National Highways Authority of India' },
      title: 'Project Director & LAO (NHAI)',
      desc: 'Ground milestone tracking, cadastral survey, compensation rolls upload.',
    },
    {
      username: 'ministry_demo',
      role: 'MINISTRY_OFFICER',
      scope: {},
      title: 'Joint Secretary (MoRTH / Infrastructure)',
      desc: 'National corridor health, macro delay risk distribution, policy interventions (read-only).',
    },
    {
      username: 'verification_demo',
      role: 'VERIFICATION_OFFICER',
      scope: { state: 'Maharashtra', district: 'Pune' },
      title: 'SLAO Verification Lead',
      desc: 'Scrutinizes supporting field evidence, validates compensation rolls, marks verified/rejected.',
    },
    {
      username: 'authority_demo',
      role: 'COMPETENT_AUTHORITY',
      scope: { state: 'Maharashtra', district: 'Pune' },
      title: 'Competent Authority for Land Acquisition (CALA)',
      desc: 'Statutory decision maker; records decisions under RFCTLARR Act.',
    },
    {
      username: 'ml_demo',
      role: 'ML_DATA_TEAM',
      scope: {},
      title: 'Data Science & Algorithm Specialist',
      desc: 'Inspects feature importance, ROC-AUC validation metrics, data quality, and drift.',
    },
    {
      username: 'admin_demo',
      role: 'SYSTEM_ADMIN',
      scope: {},
      title: 'System & Security Administrator',
      desc: 'Audits append-only logs, manages roles & permissions, monitors operational uptime.',
    },
  ];

  const handleQuickLogin = (demoAcc: typeof demoAccounts[0]) => {
    const demoFull = DEMO_USERS.find((d) => d.username === demoAcc.username);
    const user: AuthUser = {
      username: demoAcc.username,
      role: demoAcc.role,
      scope: demoAcc.scope,
      name: demoFull ? demoFull.name : demoAcc.title,
      title: demoFull ? demoFull.title : demoAcc.title,
      dept: demoFull ? demoFull.dept : 'Revenue Administration',
      jurisdiction: demoFull ? demoFull.jurisdiction : 'Jurisdiction',
      desc: demoAcc.desc,
      email: demoFull ? demoFull.email : `${demoAcc.username}@gov.in`,
      designationLevel: demoFull ? demoFull.designationLevel : 'Statutory Authority',
    };
    onLoginSuccess(user);
    onClose();
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const result = authenticateUser(username, password);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
      onClose();
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#123B63] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-white/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif">{t.loginTitle}</h2>
              <p className="text-xs text-blue-100/80">{t.loginSubtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-white/10 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Role Access Notice Box */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs text-blue-950 flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#123B63] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Role-Based Access Interface:</span>{' '}
              Select any designated authority profile below to authenticate and access that role&apos;s statutory permissions.
            </div>
          </div>

          {/* Quick 1-Click Role Profiles */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Officer Account Role (1-Click Switch)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {demoAccounts.map((acc) => {
                const isSelected = currentRole === acc.role;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickLogin(acc)}
                    className={`text-left p-2.5 rounded border transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-[#123B63] ring-1 ring-[#123B63]'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          {acc.title}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-3.5 h-3.5 text-[#123B63] shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-[#123B63] mt-0.5">
                        User: {acc.username}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {acc.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Input (Visual authenticity) */}
          <form
            onSubmit={handleManualLogin}
            className="pt-3 border-t border-slate-200 space-y-3 text-xs"
          >
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-2 rounded text-xs">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Officer Username / Government ID
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Access Credential / 2FA Token
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">Language:</span>
                <select
                  value={currentLang}
                  onChange={(e) => onLanguageChange(e.target.value as Language)}
                  className="p-1 rounded border border-slate-300 font-semibold"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-[#123B63] hover:bg-blue-900 text-white font-bold px-4 py-2 rounded transition shadow-xs"
              >
                {t.loginBtn}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
