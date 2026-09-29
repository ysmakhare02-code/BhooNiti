import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { AlertNotification, Language, Project, AuthUser } from '../types';
import { translations } from '../data/translations';
import { getScopedProjects } from '../data/permissions';

interface AlertsViewProps {
  alerts: AlertNotification[];
  projects?: Project[];
  currentUser?: AuthUser;
  currentLang: Language;
  onSelectProject: (projectId: string) => void;
  onMarkAsRead: (alertId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  projects,
  currentUser,
  currentLang,
  onSelectProject,
  onMarkAsRead,
}) => {
  const t = translations[currentLang];
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const scopedAlerts = useMemo(() => {
    if (!currentUser || !projects) return alerts;
    const scopedProjects = getScopedProjects(projects, currentUser);
    const idSet = new Set(scopedProjects.map((p) => p.id));
    return alerts.filter((alt) => idSet.has(alt.projectId));
  }, [alerts, projects, currentUser]);

  const filteredAlerts = scopedAlerts.filter((alt) => {
    if (filterSeverity !== 'ALL' && alt.severity !== filterSeverity) return false;
    if (filterType !== 'ALL' && alt.type !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchProject = alt.projectName.toLowerCase().includes(q);
      const matchTitle = alt.title.toLowerCase().includes(q);
      const matchDesc = alt.description.toLowerCase().includes(q);
      if (!matchProject && !matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#123B63]" />
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              {t.navAlerts}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated early-warning triggers based on sudden risk jumps, compensation stagnation, and approval delays.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-red-50 text-red-700 px-3 py-1 rounded font-bold border border-red-200">
            {unreadCount} Unresolved Warnings
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search alerts by project or keyword..."
            className="w-full pl-8 pr-3 py-1.5 rounded border border-slate-300 text-xs"
          />
        </div>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="p-1.5 rounded border border-slate-300 bg-white text-xs font-semibold"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">🔴 Critical Warnings</option>
          <option value="HIGH">🟠 High Warnings</option>
          <option value="MODERATE">🟡 Moderate Warnings</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-1.5 rounded border border-slate-300 bg-white text-xs"
        >
          <option value="ALL">All Warning Types</option>
          <option value="HIGH_RISK_THRESHOLD">High / Critical Threshold</option>
          <option value="SUDDEN_RISK_INCREASE">Sudden Risk Increase</option>
          <option value="COMPENSATION_BACKLOG">Compensation Backlog</option>
          <option value="RR_PROGRESS_LAG">R&amp;R Progress Lag</option>
          <option value="APPROVAL_OVERDUE">Approval Overdue</option>
          <option value="LEGAL_STAY">Legal Stay / Disputes</option>
          <option value="VERIFICATION_PENDING">Verification Pending</option>
          <option value="DATA_QUALITY_WARNING">Data Quality &amp; Consistency</option>
        </select>
      </div>

      {/* Alerts Feed */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden divide-y divide-slate-100">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="font-bold text-sm text-slate-800">No active alerts match current filters</div>
            <p className="text-xs text-slate-400 mt-0.5">All monitored statutory projects are currently operating within normative bounds.</p>
          </div>
        ) : (
          filteredAlerts.map((alt) => {
            const isCritical = alt.severity === 'CRITICAL';
            const isHigh = alt.severity === 'HIGH';

            return (
              <div
                key={alt.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/70 transition ${
                  !alt.isRead ? 'bg-amber-50/20' : ''
                }`}
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : isHigh
                          ? 'bg-orange-100 text-orange-800 border border-orange-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {alt.severity}
                    </span>

                    <span className="font-bold text-xs text-[#123B63]">
                      {alt.projectName}
                    </span>

                    <span className="text-slate-400 text-xs">&bull;</span>
                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {alt.timestamp}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {alt.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {alt.description}
                  </p>

                  {/* Triggering Rule & Values */}
                  {alt.triggeringRule && (
                    <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Triggering Rule:</span>
                        <span className="font-mono text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">
                          {alt.triggeringRule}
                        </span>
                      </div>
                      {alt.triggeringValues && Object.keys(alt.triggeringValues).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Trigger Values:</span>
                          {Object.entries(alt.triggeringValues).map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-700"
                            >
                              <span className="text-slate-400">{k}:</span>
                              <strong className="text-slate-900">{String(v)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-slate-100/80 p-2 rounded text-xs text-slate-700 mt-2 flex items-start gap-1.5">
                    <span className="font-bold text-[#123B63] shrink-0">
                      Suggested Officer Action:
                    </span>
                    <span>{alt.actionRequired}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-start">
                  {!alt.isRead && (
                    <button
                      onClick={() => onMarkAsRead(alt.id)}
                      className="text-xs text-slate-600 hover:text-slate-900 border border-slate-300 px-2.5 py-1.5 rounded hover:bg-slate-100 transition font-semibold"
                    >
                      Acknowledge
                    </button>
                  )}

                  <button
                    onClick={() => onSelectProject(alt.projectId)}
                    className="flex items-center gap-1 bg-[#123B63] hover:bg-blue-900 text-white text-xs font-bold px-3 py-1.5 rounded transition shadow-xs"
                  >
                    <span>Investigate Project</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
