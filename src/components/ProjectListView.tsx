import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  ArrowUpDown,
  ChevronRight,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Project, Language, RiskLevel, ProjectStage, ProjectType, VerificationStatus, AuthUser } from '../types';
import { translations, stageTranslations } from '../data/translations';
import { getScopedProjects } from '../data/permissions';

interface ProjectListViewProps {
  projects: Project[];
  currentLang: Language;
  currentUser?: AuthUser;
  onSelectProject: (projectId: string) => void;
  initialSearchQuery?: string;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  projects,
  currentLang,
  currentUser,
  onSelectProject,
  initialSearchQuery = '',
}) => {
  const t = translations[currentLang];
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery);
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Filter projects by officer scope if currentUser is provided
  const scopedProjects = useMemo(() => {
    return currentUser ? getScopedProjects(projects, currentUser) : projects;
  }, [projects, currentUser]);

  // Extract unique filter lists
  const states = useMemo(() => {
    return Array.from(new Set(scopedProjects.map((p) => p.state))).sort();
  }, [scopedProjects]);

  const projectTypes = useMemo(() => {
    return Array.from(new Set(scopedProjects.map((p) => p.type))).sort();
  }, [scopedProjects]);

  const stages: ProjectStage[] = [
    'Proposal',
    'Survey',
    'SIA',
    'Notification',
    'Objections',
    'Valuation',
    'Award',
    'Compensation',
    'RR',
    'Possession',
    'Handover',
  ];

  // Filtering
  const filteredProjects = useMemo(() => {
    return scopedProjects.filter((p) => {
      if (selectedState !== 'ALL' && p.state !== selectedState) return false;
      if (selectedType !== 'ALL' && p.type !== selectedType) return false;
      if (selectedStage !== 'ALL' && p.currentStage !== selectedStage) return false;
      if (selectedRisk !== 'ALL' && p.riskLevel !== selectedRisk) return false;
      if (selectedVerification !== 'ALL' && p.verificationStatus !== selectedVerification)
        return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchId = p.id.toLowerCase().includes(q);
        const matchName = p.name.toLowerCase().includes(q);
        const matchDistrict = p.district.toLowerCase().includes(q);
        const matchTehsil = p.tehsil.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchDistrict && !matchTehsil) return false;
      }
      return true;
    });
  }, [scopedProjects, selectedState, selectedType, selectedStage, selectedRisk, selectedVerification, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedState('ALL');
    setSelectedType('ALL');
    setSelectedStage('ALL');
    setSelectedRisk('ALL');
    setSelectedVerification('ALL');
    setCurrentPage(1);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const headers = [
      'Project ID',
      'Project Name',
      'Type',
      'State',
      'District',
      'Tehsil',
      'Agency',
      'Current Stage',
      'Risk Level',
      'Delay Probability (%)',
      'Land Required (Ha)',
      'Land Acquired (Ha)',
      'Compensation Sanctioned (Cr)',
      'Compensation Disbursed (Cr)',
      'Active Legal Disputes',
      'Verification Status',
    ];

    const rows = filteredProjects.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.type,
      p.state,
      p.district,
      p.tehsil,
      `"${p.agency.replace(/"/g, '""')}"`,
      p.currentStage,
      p.riskLevel,
      p.delayProbability,
      p.landRequiredHectares,
      p.landAcquiredHectares,
      p.compensationTotalCr,
      p.compensationPaidCr,
      p.legalDisputesCount,
      p.verificationStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BHUMI_RAKSHA_PROJECTS_REGISTRY_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Title & Actions */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-serif">
            {t.navProjects}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive national registry of monitored land acquisition pipelines across statutory stages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded border border-slate-300 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#123B63] focus:border-[#123B63] bg-slate-50/50"
            />
          </div>

          {/* Reset Filters button */}
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-2 rounded border border-slate-200 hover:bg-slate-50 transition shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetFilters}</span>
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* State */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t.filterByState}
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 rounded border border-slate-300 bg-white text-xs"
            >
              <option value="ALL">All States ({states.length})</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t.filterByType}
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 rounded border border-slate-300 bg-white text-xs"
            >
              <option value="ALL">All Project Types</option>
              {projectTypes.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>
          </div>

          {/* Stage */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t.filterByStage}
            </label>
            <select
              value={selectedStage}
              onChange={(e) => {
                setSelectedStage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 rounded border border-slate-300 bg-white text-xs"
            >
              <option value="ALL">All Statutory Stages</option>
              {stages.map((st) => (
                <option key={st} value={st}>
                  {stageTranslations[currentLang]?.[st] || st}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t.filterByRisk}
            </label>
            <select
              value={selectedRisk}
              onChange={(e) => {
                setSelectedRisk(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 rounded border border-slate-300 bg-white text-xs font-semibold"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">🔴 Critical (&gt;80%)</option>
              <option value="HIGH">🟠 High (61-80%)</option>
              <option value="MODERATE">🟡 Moderate (31-60%)</option>
              <option value="LOW">🟢 Low (0-30%)</option>
            </select>
          </div>

          {/* Verification Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              {t.verificationStatusLabel}
            </label>
            <select
              value={selectedVerification}
              onChange={(e) => {
                setSelectedVerification(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2 rounded border border-slate-300 bg-white text-xs"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="VERIFIED">Verified ✓</option>
              <option value="PENDING">Pending Verification</option>
              <option value="CORRECTION_REQUESTED">Correction Requested</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <span>
          Showing <strong>{filteredProjects.length}</strong> matching projects
        </span>
        <span>
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Accessible Projects Table */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#123B63] text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4">
                  Project ID & Name
                </th>
                <th scope="col" className="py-3 px-4">
                  Location & Agency
                </th>
                <th scope="col" className="py-3 px-4">
                  Type
                </th>
                <th scope="col" className="py-3 px-4">
                  Current Stage
                </th>
                <th scope="col" className="py-3 px-4">
                  Delay Risk Assessment
                </th>
                <th scope="col" className="py-3 px-4">
                  Verification
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-sm">{t.noDataFound}</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting the search criteria or resetting filters.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p) => {
                  const isFlagship = p.id === 'NH-MH-001';
                  const riskBadge =
                    p.riskLevel === 'CRITICAL'
                      ? 'bg-red-50 text-[#C62828] border-red-200'
                      : p.riskLevel === 'HIGH'
                      ? 'bg-orange-50 text-[#D96C00] border-orange-200'
                      : p.riskLevel === 'MODERATE'
                      ? 'bg-amber-50 text-[#D99A00] border-amber-200'
                      : 'bg-emerald-50 text-[#287D4A] border-emerald-200';

                  const riskDot =
                    p.riskLevel === 'CRITICAL'
                      ? 'bg-[#C62828]'
                      : p.riskLevel === 'HIGH'
                      ? 'bg-[#D96C00]'
                      : p.riskLevel === 'MODERATE'
                      ? 'bg-[#D99A00]'
                      : 'bg-[#287D4A]';

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isFlagship ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* ID & Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] font-bold text-[#123B63]">
                          {p.id}
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-0.5 line-clamp-1">
                          {p.name}
                        </div>
                        {isFlagship && (
                          <span className="inline-block bg-amber-500 text-white text-[9px] font-bold px-1 py-0.2 rounded uppercase mt-0.5">
                            Flagship
                          </span>
                        )}
                      </td>

                      {/* Location & Agency */}
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-800">
                          {p.tehsil}, {p.district}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {p.state} &bull; {p.agency.split('(')[0]}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {p.type}
                      </td>

                      {/* Current Stage */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {stageTranslations[currentLang]?.[p.currentStage] || p.currentStage}
                        </span>
                      </td>

                      {/* Delay Risk Assessment (ICON + TEXT + NUMBER + COLOR) */}
                      <td className="py-3.5 px-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold ${riskBadge}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${riskDot}`} />
                          <span>{p.riskLevel}</span>
                          <span className="font-mono">({p.delayProbability}%)</span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        {p.verificationStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 text-[#287D4A] font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#287D4A]" />
                            <span>Verified ✓</span>
                          </span>
                        ) : p.verificationStatus === 'CORRECTION_REQUESTED' ? (
                          <span className="inline-flex items-center gap-1 text-[#D96C00] font-semibold text-[11px] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                            <span>Correction</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onSelectProject(p.id)}
                          className="inline-flex items-center gap-1 bg-[#123B63] hover:bg-[#0e2f50] text-white text-xs font-bold px-2.5 py-1.5 rounded transition shadow-xs"
                        >
                          <span>{t.viewDetails}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredProjects.length)} of{' '}
              {filteredProjects.length} entries
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-semibold"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
