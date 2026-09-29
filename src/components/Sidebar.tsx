import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  MapPin,
  AlertTriangle,
  FileBarChart,
  Cpu,
  ShieldCheck,
  Building2,
  Lock,
  Layers,
  Inbox,
  Users,
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { translations, roleDescriptions } from '../data/translations';
import { isTabPermitted } from '../data/permissions';

export type NavigationTab =
  | 'dashboard'
  | 'projects'
  | 'risk-map'
  | 'alerts'
  | 'reports'
  | 'ml-dashboard'
  | 'admin-audit'
  | 'land-map'
  | 'complaints'
  | 'citizens';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  currentLang: Language;
  currentRole: UserRole;
  unreadAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentLang,
  currentRole,
  unreadAlertsCount,
}) => {
  const t = translations[currentLang];
  const roleInfo = roleDescriptions[currentRole] || roleDescriptions.DISTRICT_OFFICER;

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'projects',
      label: t.navProjects,
      icon: <FolderKanban className="w-4 h-4" />,
    },
    {
      id: 'risk-map',
      label: t.navRiskMap,
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      id: 'land-map',
      label: t.navLandMap || 'GIS Land Map',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'alerts',
      label: t.navAlerts,
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: unreadAlertsCount,
    },
    {
      id: 'complaints',
      label: t.navComplaints || 'Public Complaints',
      icon: <Inbox className="w-4 h-4" />,
    },
    {
      id: 'citizens',
      label: t.navCitizens || 'Citizens / End Users',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: t.navReports,
      icon: <FileBarChart className="w-4 h-4" />,
    },
    {
      id: 'ml-dashboard',
      label: t.navMLDashboard,
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'admin-audit',
      label: t.navAdminAudit,
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-[#0d2a47] text-white flex flex-col justify-between shrink-0 border-r border-blue-900/40">
      {/* Navigation Links */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-blue-300/70 flex items-center justify-between">
          <span>Navigation</span>
          <span className="text-[9px] bg-blue-900/60 text-blue-200 px-1 rounded">RBAC Active</span>
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const isPermitted = isTabPermitted(currentRole, item.id);

          return (
            <button
              key={item.id}
              disabled={!isPermitted}
              onClick={() => isPermitted && onSelectTab(item.id)}
              title={!isPermitted ? 'Access restricted for your statutory role' : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#1b4b79] text-white shadow-sm border-l-4 border-amber-400 pl-2.5'
                  : isPermitted
                  ? 'text-blue-100/80 hover:bg-white/5 hover:text-white cursor-pointer'
                  : 'text-slate-400/50 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-amber-400' : isPermitted ? 'text-blue-300' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span className={!isPermitted ? 'text-slate-300' : ''}>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {!isPermitted && (
                  <span title="Restricted to authorized roles">
                    <Lock className="w-3 h-3 text-amber-400/80" />
                  </span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Role Context & Authority Jurisdiction Footer */}
      <div className="p-3 border-t border-blue-900/50 bg-[#091e33]">
        <div className="bg-[#123B63]/60 p-2.5 rounded border border-blue-800/40">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 truncate">
              {roleInfo.jurisdiction}
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate">
            {roleInfo.title}
          </div>
          <div className="text-[10px] text-blue-200/80 mt-0.5 truncate">
            {roleInfo.dept}
          </div>
        </div>

        {/* Operational Status indicator */}
        <div className="mt-2.5 pt-2 border-t border-blue-900/40 flex items-center justify-between text-[10px] text-blue-300/80 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>Rule-based baseline</span>
          </div>
          <span className="text-slate-400">baseline-0.1</span>
        </div>
      </div>
    </aside>
  );
};
