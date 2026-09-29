import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Building,
  Printer,
  Table,
  CheckCircle,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { Project, Language, AuthUser } from '../types';
import { translations } from '../data/translations';
import { getScopedProjects } from '../data/permissions';

interface ReportsViewProps {
  projects: Project[];
  currentLang: Language;
  currentUser?: AuthUser;
  onSelectProject: (projectId: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  projects,
  currentLang,
  currentUser,
  onSelectProject,
}) => {
  const t = translations[currentLang];
  const [activeReportTab, setActiveReportTab] = useState<
    'state-summary' | 'stage-bottlenecks' | 'compensation-audit'
  >('state-summary');

  const scopedProjects = React.useMemo(() => {
    return currentUser ? getScopedProjects(projects, currentUser) : projects;
  }, [projects, currentUser]);

  // Compute state-level aggregation
  const stateSummary = React.useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        critical: number;
        high: number;
        compPaid: number;
        compTotal: number;
        avgDelayProb: number;
      }
    > = {};

    scopedProjects.forEach((p) => {
      if (!map[p.state]) {
        map[p.state] = {
          total: 0,
          critical: 0,
          high: 0,
          compPaid: 0,
          compTotal: 0,
          avgDelayProb: 0,
        };
      }
      map[p.state].total++;
      if (p.riskLevel === 'CRITICAL') map[p.state].critical++;
      if (p.riskLevel === 'HIGH') map[p.state].high++;
      map[p.state].compPaid += p.compensationPaidCr;
      map[p.state].compTotal += p.compensationTotalCr;
      map[p.state].avgDelayProb += p.delayProbability;
    });

    return Object.entries(map).map(([state, data]) => ({
      state,
      total: data.total,
      critical: data.critical,
      high: data.high,
      compPaid: Math.round(data.compPaid),
      compTotal: Math.round(data.compTotal),
      compPercent: Math.round((data.compPaid / Math.max(data.compTotal, 1)) * 100),
      avgDelayProb: Math.round(data.avgDelayProb / data.total),
    }));
  }, [scopedProjects]);

  // Compute Stage distribution
  const stageSummary = React.useMemo(() => {
    const map: Record<string, { count: number; highRiskCount: number }> = {};
    scopedProjects.forEach((p) => {
      if (!map[p.currentStage]) map[p.currentStage] = { count: 0, highRiskCount: 0 };
      map[p.currentStage].count++;
      if (p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL') {
        map[p.currentStage].highRiskCount++;
      }
    });

    return Object.entries(map).map(([stage, data]) => ({
      stage,
      count: data.count,
      highRiskCount: data.highRiskCount,
      riskPct: Math.round((data.highRiskCount / Math.max(data.count, 1)) * 100),
    }));
  }, [scopedProjects]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'id',
      'name',
      'state',
      'district',
      'stage',
      'riskScore',
      'riskLevel',
      'top 3 drivers',
    ];

    const escapeField = (val: string | number) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = scopedProjects.map((p) => {
      const top3Drivers = (p.topRiskFactors || [])
        .slice(0, 3)
        .map((f) => f.name)
        .join('; ');

      return [
        escapeField(p.id),
        escapeField(p.name),
        escapeField(p.state),
        escapeField(p.district),
        escapeField(p.currentStage),
        escapeField(p.riskScore),
        escapeField(p.riskLevel),
        escapeField(top3Drivers),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `bhumi_raksha_projects_scoped_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-[#123B63]" />
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              {t.navReports}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated land acquisition delay risk summaries, state-wise compensation balances, and statutory stage distributions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-[#123B63] hover:bg-blue-900 text-white text-xs font-bold px-3 py-2 rounded transition shadow-xs"
            title="Download CSV report of currently scoped projects"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded border border-slate-300 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-700" />
            <span>Print Executive Brief</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t text-xs font-semibold gap-4">
        <button
          onClick={() => setActiveReportTab('state-summary')}
          className={`py-3 border-b-2 transition ${
            activeReportTab === 'state-summary'
              ? 'border-[#123B63] text-[#123B63] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          State & Regional Risk Digest
        </button>

        <button
          onClick={() => setActiveReportTab('stage-bottlenecks')}
          className={`py-3 border-b-2 transition ${
            activeReportTab === 'stage-bottlenecks'
              ? 'border-[#123B63] text-[#123B63] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Statutory Stage Bottleneck Analysis
        </button>

        <button
          onClick={() => setActiveReportTab('compensation-audit')}
          className={`py-3 border-b-2 transition ${
            activeReportTab === 'compensation-audit'
              ? 'border-[#123B63] text-[#123B63] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Compensation & R&R Balance Ledger
        </button>
      </div>

      {/* Tab Content */}
      {activeReportTab === 'state-summary' && (
        <div className="bg-white border border-slate-200 rounded-b shadow-xs p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              State-Wise Monitored Projects & Risk Index
            </h2>
            <span className="text-xs text-slate-500">
              Total {stateSummary.length} States Monitored
            </span>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#123B63] text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">State / Jurisdiction</th>
                  <th className="py-2.5 px-3">Total Projects</th>
                  <th className="py-2.5 px-3">Critical Delay (&gt;80%)</th>
                  <th className="py-2.5 px-3">High Delay (61-80%)</th>
                  <th className="py-2.5 px-3">Avg Delay Probability</th>
                  <th className="py-2.5 px-3">Compensation Disbursed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stateSummary.map((s) => (
                  <tr key={s.state} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {s.state}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{s.total}</td>
                    <td className="py-2.5 px-3 font-bold text-[#C62828]">
                      {s.critical}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#D96C00]">
                      {s.high}
                    </td>
                    <td className="py-2.5 px-3 font-bold">{s.avgDelayProb}%</td>
                    <td className="py-2.5 px-3">
                      ₹{s.compPaid.toLocaleString('en-IN')} / ₹{s.compTotal.toLocaleString('en-IN')} Cr ({s.compPercent}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReportTab === 'stage-bottlenecks' && (
        <div className="bg-white border border-slate-200 rounded-b shadow-xs p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Statutory Stage Distribution & High-Risk Frequency
            </h2>
            <span className="text-xs text-slate-500">
              Identifies where pipeline friction is most prevalent
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {stageSummary.map((st) => (
              <div
                key={st.stage}
                className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-2"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{st.stage}</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                    {st.count} Projects
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Delayed / High-Risk:</span>
                  <span className="font-bold text-[#C62828]">
                    {st.highRiskCount} ({st.riskPct}%)
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#123B63] h-full"
                    style={{ width: `${Math.min(100, (st.count / projects.length) * 100 * 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeReportTab === 'compensation-audit' && (
        <div className="bg-white border border-slate-200 rounded-b shadow-xs p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              National Infrastructure Corridor Compensation Ledger
            </h2>
            <span className="text-xs text-slate-500">
              Special Land Acquisition Officer (SLAO) Financial Balances
            </span>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#123B63] text-white uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Project ID & Name</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Landowners</th>
                  <th className="py-2.5 px-3">Sanctioned</th>
                  <th className="py-2.5 px-3">Disbursed</th>
                  <th className="py-2.5 px-3">Balance Pending</th>
                  <th className="py-2.5 px-3">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.slice(0, 15).map((p) => {
                  const pct = Math.round(
                    (p.compensationPaidCr / Math.max(p.compensationTotalCr, 1)) * 100
                  );
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.district}</td>
                      <td className="py-2.5 px-3 font-mono">{p.landownersCount}</td>
                      <td className="py-2.5 px-3">₹{p.compensationTotalCr} Cr</td>
                      <td className="py-2.5 px-3 font-bold text-[#287D4A]">
                        ₹{p.compensationPaidCr} Cr
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#C62828]">
                        ₹{p.compensationPendingCr} Cr
                      </td>
                      <td className="py-2.5 px-3 font-bold">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
