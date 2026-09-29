import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  ExternalLink,
  FolderKanban,
  FileCheck2,
  MapPin,
  ShieldAlert,
  Building,
} from 'lucide-react';
import { Project, AlertNotification, Language, UserRole, AuthUser } from '../types';
import { translations, roleDescriptions } from '../data/translations';
import { getScopedProjects } from '../data/permissions';

interface DashboardViewProps {
  projects: Project[];
  alerts: AlertNotification[];
  currentLang: Language;
  currentUser: AuthUser;
  onSelectProject: (projectId: string) => void;
  onViewAllProjects: () => void;
  onViewAllAlerts: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  alerts,
  currentLang,
  currentUser,
  onSelectProject,
  onViewAllProjects,
  onViewAllAlerts,
}) => {
  const t = translations[currentLang];
  const roleInfo = roleDescriptions[currentUser.role] || roleDescriptions.DISTRICT_OFFICER;

  // Filter projects depending strictly on officer statutory scope
  const scopedProjects = React.useMemo(() => {
    return getScopedProjects(projects, currentUser);
  }, [projects, currentUser]);

  const scopedProjectIds = React.useMemo(
    () => new Set(scopedProjects.map((p) => p.id)),
    [scopedProjects]
  );
  const scopedAlerts = React.useMemo(
    () => alerts.filter((a) => scopedProjectIds.has(a.projectId)),
    [alerts, scopedProjectIds]
  );

  const totalCount = scopedProjects.length;
  const criticalCount = scopedProjects.filter((p) => p.riskLevel === 'CRITICAL').length;
  const highCount = scopedProjects.filter((p) => p.riskLevel === 'HIGH').length;
  const avgRisk = totalCount
    ? Math.round(
        scopedProjects.reduce((acc, curr) => acc + curr.delayProbability, 0) / totalCount
      )
    : 0;

  // Sorted list of top projects needing attention (Critical and High risk first)
  const projectsNeedingAttention = [...scopedProjects]
    .sort((a, b) => b.delayProbability - a.delayProbability)
    .slice(0, 5);

  const topAlerts = scopedAlerts.slice(0, 4);

  return (
    <div className="space-y-6 pb-12">
      {/* Officer Welcome & Authority Banner */}
      <div className="bg-white border border-slate-200 rounded p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#123B63]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {roleInfo.dept}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 font-serif">
            {t.welcomeOfficer}: <span className="text-[#123B63]">{roleInfo.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Jurisdiction: <span className="font-semibold text-slate-800">{roleInfo.jurisdiction}</span> &bull; {roleInfo.desc}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {/* Statutory Scope Badge (Fixed, cannot switch out of jurisdiction) */}
          <div className="bg-slate-100 px-3 py-1.5 rounded border border-slate-300 flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-[#123B63]" />
            <span>
              Scope:{' '}
              {currentUser.scope.district
                ? `District ${currentUser.scope.district}`
                : currentUser.scope.state
                ? `State ${currentUser.scope.state}`
                : currentUser.scope.agency
                ? `Agency ${currentUser.scope.agency}`
                : 'National Pipeline'}{' '}
              ({scopedProjects.length} Projects)
            </span>
          </div>

          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded text-xs text-[#123B63]">
            <Clock className="w-3.5 h-3.5 text-[#123B63] shrink-0" />
            <div>
              <span className="font-bold">Next Review: </span>
              <span className="text-slate-700">28 Sep 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Projects */}
        <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.totalProjects}
            </span>
            <FolderKanban className="w-4 h-4 text-[#123B63]" />
          </div>
          <div className="text-3xl font-bold text-[#123B63] mt-2 font-serif">
            {totalCount}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Scoped for active jurisdiction</span>
          </div>
        </div>

        {/* High Risk Projects */}
        <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.highRisk}
            </span>
            <div className="w-3 h-3 rounded-full bg-[#D96C00]" />
          </div>
          <div className="text-3xl font-bold text-[#D96C00] mt-2 font-serif">
            {highCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Projects with 61% - 80% delay probability
          </div>
        </div>

        {/* Critical Projects */}
        <div className="bg-white border border-slate-200 rounded p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.criticalRisk}
            </span>
            <div className="w-3 h-3 rounded-full bg-[#C62828]" />
          </div>
          <div className="text-3xl font-bold text-[#C62828] mt-2 font-serif">
            {criticalCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Projects with &gt; 80% delay probability
          </div>
        </div>
      </div>

      {/* Projects Needing Attention Section */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#C62828]" />
              {t.projectsNeedingAttention}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by model-estimated probability of statutory milestone delay.
            </p>
          </div>
          <button
            onClick={onViewAllProjects}
            className="flex items-center gap-1.5 text-xs font-bold text-[#123B63] hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition"
          >
            <span>{t.viewAllProjects}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {projectsNeedingAttention.map((p) => {
            const isFlagship = p.id === 'NH-MH-001';
            const riskColor =
              p.riskLevel === 'CRITICAL'
                ? 'text-[#C62828] bg-red-50 border-red-200'
                : p.riskLevel === 'HIGH'
                ? 'text-[#D96C00] bg-orange-50 border-orange-200'
                : 'text-[#D99A00] bg-amber-50 border-amber-200';

            const dotColor =
              p.riskLevel === 'CRITICAL'
                ? 'bg-[#C62828]'
                : p.riskLevel === 'HIGH'
                ? 'bg-[#D96C00]'
                : 'bg-[#D99A00]';

            return (
              <div
                key={p.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition ${
                  isFlagship ? 'bg-amber-50/30' : ''
                }`}
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#123B63] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {p.id}
                    </span>
                    <span className="text-xs text-slate-500">
                      {p.type} &bull; {p.agency.split('(')[0]}
                    </span>
                    {isFlagship && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Flagship Project
                      </span>
                    )}
                  </div>

                  <div className="text-sm sm:text-base font-bold text-slate-900">
                    {p.name}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {p.tehsil}, {p.district}, {p.state}
                    </span>
                    <span>&bull;</span>
                    <span>
                      Current Stage:{' '}
                      <strong className="text-slate-800">{p.currentStage}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Compensation:{' '}
                      <strong>
                        ₹{p.compensationPaidCr} / ₹{p.compensationTotalCr} Cr
                      </strong>{' '}
                      ({Math.round((p.compensationPaidCr / p.compensationTotalCr) * 100)}%)
                    </span>
                  </div>

                  {/* Primary contributing factor callout */}
                  {p.topRiskFactors.length > 0 && (
                    <div className="text-xs text-slate-700 bg-slate-100/70 px-2.5 py-1 rounded inline-block mt-1">
                      <span className="font-semibold text-slate-900">
                        Primary Contributing Factor:
                      </span>{' '}
                      {p.topRiskFactors[0].name} ({p.topRiskFactors[0].metricValue})
                    </div>
                  )}
                </div>

                {/* Right side: Risk Badge + Investigate Action */}
                <div className="flex items-center gap-4 self-end md:self-center shrink-0">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold ${riskColor}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                    <span>
                      {p.riskLevel} &bull; {p.delayProbability}%
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectProject(p.id)}
                    className="flex items-center gap-1.5 bg-[#123B63] hover:bg-[#0e2f50] text-white text-xs font-bold px-3 py-2 rounded transition shadow-xs"
                  >
                    <span>{t.viewDetails}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Alerts (Uncluttered, highly scannable) */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">{t.recentAlerts}</h2>
          </div>
          <button
            onClick={onViewAllAlerts}
            className="text-xs font-bold text-[#123B63] hover:underline"
          >
            View All Early Warnings
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {topAlerts.map((alt) => {
            const isCritical = alt.severity === 'CRITICAL';
            return (
              <div
                key={alt.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <span className="text-xs font-bold text-[#123B63]">
                      {alt.projectName}
                    </span>
                    <span className="text-slate-400 text-xs">&bull;</span>
                    <span className="text-[11px] text-slate-500">{alt.timestamp}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {alt.title}
                  </div>
                  <div className="text-xs text-slate-600 max-w-2xl">
                    {alt.description}
                  </div>
                </div>

                <button
                  onClick={() => onSelectProject(alt.projectId)}
                  className="text-xs text-[#123B63] hover:underline font-bold self-start sm:self-center shrink-0 flex items-center gap-1"
                >
                  <span>Investigate Project</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
