import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, UserCheck, Shield } from 'lucide-react';
import { UserRole, AuthUser } from '../types';
import { roleDescriptions } from '../data/translations';
import { ROLE_PERMISSIONS } from '../data/auth';

interface AccessRestrictedViewProps {
  attemptedTab: string;
  currentUser: AuthUser;
  onReturnToDashboard: () => void;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  attemptedTab,
  currentUser,
  onReturnToDashboard,
}) => {
  const roleInfo = roleDescriptions[currentUser.role] || roleDescriptions.DISTRICT_OFFICER;

  const tabNames: Record<string, string> = {
    'admin-audit': 'System Administration & Cryptographic Audit Vault',
    'ml-dashboard': 'ML Model Performance & Feature Attribution Workspace',
    reports: 'Statutory Reports & High-Level Dossiers',
    projects: 'Project Master Registry',
    'risk-map': 'Geospatial GIS Risk Visualization',
    alerts: 'Early-Warning Automated Alert Center',
    dashboard: 'Executive Risk Dashboard',
  };

  const allowedTabs = ROLE_PERMISSIONS[currentUser.role]?.tabs || ['dashboard'];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden">
        {/* Top Warning Banner */}
        <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-700 shrink-0">
            <Lock className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                RBAC Security Guard
              </span>
              <span className="text-xs text-red-600 font-medium">
                Statutory Access Boundary Enforced
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-serif mt-1">
              Access Restricted
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              You do not have permission to access <strong>{tabNames[attemptedTab] || attemptedTab}</strong> with your current role credentials.
            </p>
          </div>
        </div>

        {/* Credentials & Role Breakdown */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs space-y-2">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#123B63]" />
                <span>Current Authenticated Identity</span>
              </div>
              <div>
                <span className="text-slate-500">Officer Name: </span>
                <strong className="text-slate-900">{currentUser.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Official Role: </span>
                <strong className="text-[#123B63]">{roleInfo.title}</strong>
              </div>
              <div>
                <span className="text-slate-500">Jurisdiction: </span>
                <span className="text-slate-800">{currentUser.jurisdiction}</span>
              </div>
              <div>
                <span className="text-slate-500">Department: </span>
                <span className="text-slate-700">{currentUser.dept}</span>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded p-4 text-xs space-y-2">
              <div className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Permitted Modules for {currentUser.role}</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Under government standard operating procedures, your profile credentials permit access to:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allowedTabs.map((tId) => (
                  <span
                    key={tId}
                    className="bg-white border border-amber-300 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded capitalize"
                  >
                    {tId.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-50/60 border border-blue-200/80 rounded p-4 text-xs text-blue-950">
            <div className="font-bold text-[#123B63] mb-1">
              Need access for statutory audit or ML model review?
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              If your inspection or evaluation requires testing other role permissions (such as <strong>System Administrator</strong> or <strong>ML Data Team</strong>), switch to the designated persona via the <strong>Switch Officer Role</strong> option in the Officer Profile menu.
            </p>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onReturnToDashboard}
              className="inline-flex items-center gap-2 bg-[#123B63] hover:bg-[#0e2f50] text-white px-4 py-2 rounded text-xs font-bold transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              SEC-ERR: 403_FORBIDDEN_ROLE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
