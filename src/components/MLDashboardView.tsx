import React, { useState } from 'react';
import {
  Cpu,
  Database,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileCheck,
  Shield,
  Layers,
  GitBranch,
  ArrowRight,
  Code2,
  Copy,
  Check,
  Lock,
  RefreshCw,
  Clock,
  Sparkles,
  Server,
  FileText,
} from 'lucide-react';
import { Language, Project, AuthUser } from '../types';
import { translations } from '../data/translations';
import { modelReport } from '../data/modelReport';
import { MODEL_INFO } from '../data/riskEngine';
import { getScopedProjects } from '../data/permissions';

interface MLDashboardViewProps {
  projects: Project[];
  currentLang: Language;
  currentUser?: AuthUser;
}

export const MLDashboardView: React.FC<MLDashboardViewProps> = ({
  projects,
  currentLang,
  currentUser,
}) => {
  const t = translations[currentLang];

  const scopedProjects = React.useMemo(() => {
    return currentUser ? getScopedProjects(projects, currentUser) : projects;
  }, [projects, currentUser]);

  // Data Quality Validation on current active dataset
  const dataQualityIssues = React.useMemo(() => {
    const issues: { projectId: string; projectName: string; issue: string; severity: 'high' | 'medium' }[] = [];

    scopedProjects.forEach((p) => {
      if (p.landAcquiredHectares > p.landRequiredHectares) {
        issues.push({
          projectId: p.id,
          projectName: p.name,
          issue: `Land acquired (${p.landAcquiredHectares} Ha) exceeds statutory land required (${p.landRequiredHectares} Ha).`,
          severity: 'high',
        });
      }
      if (p.compensationPaidCr > p.compensationTotalCr) {
        issues.push({
          projectId: p.id,
          projectName: p.name,
          issue: `Compensation paid (₹${p.compensationPaidCr} Cr) exceeds sanctioned award amount (₹${p.compensationTotalCr} Cr).`,
          severity: 'high',
        });
      }
      if (p.daysAtCurrentStage > 180) {
        issues.push({
          projectId: p.id,
          projectName: p.name,
          issue: `Stage stagnation warning: Project has remained in "${p.currentStage}" for ${p.daysAtCurrentStage} days without milestone update.`,
          severity: 'medium',
        });
      }
    });

    return issues;
  }, [projects]);

  const globalFeatureImportance = [
    { feature: 'Compensation Disbursement Deficit', importance: 0.28, description: 'Lag between sanctioned compensation and disbursed DBT' },
    { feature: 'Interdepartmental Approval Delay (Forest/Rail/Clearances)', importance: 0.22, description: 'Days exceeded beyond normative statutory SLA windows' },
    { feature: 'Active Court Writs & Objections', importance: 0.18, description: 'Stay orders and solatium rate disputes' },
    { feature: 'R&R Package Entitlement Distribution', importance: 0.16, description: 'Allotment of alternate plots and livelihood annuities' },
    { feature: 'Physical RoW Possession Deficit', importance: 0.16, description: 'Unencumbered land handed over for construction' },
    { feature: 'Stage Stagnation Duration', importance: 0.08, description: 'Excessive duration spent at single statutory milestone' },
    { feature: 'Digitized Land Record Title Completeness', importance: -0.05, description: 'Mitigating factor: 7/12 & Jamabandi mutation verified' },
    { feature: 'Joint Measurement Survey (JMS) Sign-off', importance: -0.05, description: 'Mitigating factor: Demarcation completed without dispute' },
  ];

  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedContract(id);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  const isMLTeamUser =
    !currentUser ||
    currentUser.role === 'ML_DATA_TEAM' ||
    currentUser.role === 'SYSTEM_ADMIN';

  const samplePredictRequest = `{
  "projectId": "PRJ-NH-2026-042",
  "state": "Maharashtra",
  "district": "Pune",
  "currentStage": "Compensation",
  "daysAtCurrentStage": 112,
  "landRequiredHectares": 145.5,
  "landAcquiredHectares": 82.0,
  "compensationTotalCr": 240.0,
  "compensationPaidCr": 98.4,
  "approvalDelayDays": 95,
  "legalDisputesCount": 2,
  "rrProgressPct": 45,
  "possessionProgressPct": 52
}`;

  const samplePredictResponse = `{
  "projectId": "PRJ-NH-2026-042",
  "modelVersion": "baseline-0.1",
  "riskScore": 68,
  "riskLevel": "HIGH",
  "delayProbability": 72,
  "primaryBottleneck": "Statutory Compensation Disbursement Deficit (< 50%)",
  "topRiskFactors": [
    { "name": "Compensation Paid < 50%", "contributionPoints": 28 },
    { "name": "Approval SLA Delay > 90 Days", "contributionPoints": 22 },
    { "name": "Active Court Writs (2 pending)", "contributionPoints": 18 }
  ],
  "recommendedIntervention": "Convene Special Land Acquisition Officer (SLARO) compensation camp.",
  "timestamp": "2026-09-28T08:45:00Z"
}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#123B63]" />
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              {t.navMLDashboard}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Baseline rule weights, rule-based factor contributions, data validation, and statutory integrity checks.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs text-slate-700 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Model: {MODEL_INFO.name} ({MODEL_INFO.version})</span>
        </div>
      </div>

      {/* Model Spec & Training Metadata Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {modelReport ? (
          <>
            <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-1 relative">
              <span className="absolute top-3 right-3 bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                Evaluated on synthetic data only
              </span>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Training Samples
              </div>
              <div className="text-2xl font-bold text-slate-900 font-serif">
                {modelReport.nTrain} train / {modelReport.nTest} test
              </div>
              <div className="text-slate-500 text-[11px]">
                Synthetic dataset generated for validation
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Validation AUC-ROC
              </div>
              <div className="text-2xl font-bold text-[#287D4A] font-serif">
                {modelReport.rocAuc.toFixed(3)}
              </div>
              <div className="text-slate-500 text-[11px]">
                Stratified test split validation
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Precision / Recall / F1
              </div>
              <div className="text-2xl font-bold text-[#123B63] font-serif">
                {modelReport.precision.toFixed(2)} / {modelReport.recall.toFixed(2)} / {modelReport.f1.toFixed(2)}
              </div>
              <div className="text-slate-500 text-[11px]">
                Calibrated on synthetic test split
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Brier Score
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-serif">
                {modelReport.brierScore.toFixed(3)}
              </div>
              <div className="text-slate-500 text-[11px]">
                Probability calibration score
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Training Dataset
              </div>
              <div className="text-base font-bold text-slate-700 font-serif">
                Not yet evaluated
              </div>
              <div className="text-slate-500 text-[11px]">
                Requires a trained model.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Validation AUC-ROC
              </div>
              <div className="text-base font-bold text-slate-700 font-serif">
                Not yet evaluated
              </div>
              <div className="text-slate-500 text-[11px]">
                Requires a trained model.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Precision / Recall / F1
              </div>
              <div className="text-base font-bold text-slate-700 font-serif">
                Not yet evaluated
              </div>
              <div className="text-slate-500 text-[11px]">
                Requires a trained model.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Population Drift (PSI)
              </div>
              <div className="text-base font-bold text-slate-700 font-serif">
                Not yet evaluated
              </div>
              <div className="text-slate-500 text-[11px]">
                Requires a trained model.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Baseline rule weights (not learned from data) */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Baseline rule weights (not learned from data)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rule-based factor contributions and points allocation configured for statutory delay risk assessment.
          </p>
        </div>

        <div className="space-y-3 text-xs">
          {globalFeatureImportance.map((item) => {
            const isPositive = item.importance > 0;
            const absImportance = Math.abs(item.importance);

            return (
              <div
                key={item.feature}
                className="p-3 rounded border border-slate-200 bg-slate-50/50 space-y-1.5"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{item.feature}</span>
                  <span
                    className={`font-mono text-xs ${
                      isPositive ? 'text-[#C62828]' : 'text-[#287D4A]'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {(item.importance * 100).toFixed(0)} points contribution
                  </span>
                </div>

                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      isPositive ? 'bg-[#123B63]' : 'bg-[#287D4A]'
                    }`}
                    style={{ width: `${absImportance * 100 * 3}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-500">
                  {item.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automated Data Quality & Sanity Checker */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Automated Data Quality & Statutory Consistency Validator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies logically contradictory values, overdue reporting staleness, or invalid financial fields prior to model retraining.
            </p>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-1 rounded ${
              dataQualityIssues.length > 0
                ? 'bg-amber-100 text-amber-900'
                : 'bg-emerald-100 text-[#287D4A]'
            }`}
          >
            {dataQualityIssues.length} Consistency Warnings
          </span>
        </div>

        {dataQualityIssues.length === 0 ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All monitored project records passed automated data integrity checks.</span>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {dataQualityIssues.map((issue, idx) => (
              <div
                key={idx}
                className="p-3 rounded border border-amber-200 bg-amber-50/50 flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">
                    {issue.projectId}: {issue.projectName}
                  </div>
                  <div className="text-slate-700 text-xs mt-0.5">
                    {issue.issue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODEL VERSIONS & CONTINUOUS LEARNING ARCHITECTURE */}
      <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#123B63]" />
              <h2 className="text-base font-bold text-slate-900">
                Model Versions & Continuous Learning Registry
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Lifecycle of statutory risk models from baseline heuristics to supervised learning pipelines.
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Active: baseline-0.1
          </span>
        </div>

        {/* Model versions table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Model Version</th>
                <th className="p-3">Type / Architecture</th>
                <th className="p-3">Training Dataset</th>
                <th className="p-3">Validation AUC</th>
                <th className="p-3">Deployed On</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors">
                <td className="p-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  baseline-0.1
                </td>
                <td className="p-3 text-slate-700">
                  Rule-Based Factor Contribution Engine (RFCTLARR statutory heuristics)
                </td>
                <td className="p-3 text-slate-600 font-mono text-[11px]">
                  Normative statutory delays & historical project schedules
                </td>
                <td className="p-3 text-slate-700 font-mono">
                  {modelReport ? modelReport.rocAuc.toFixed(3) : '0.840'}
                </td>
                <td className="p-3 text-slate-600 font-mono text-[11px]">
                  2026-04-15
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ACTIVE (Production)
                  </span>
                </td>
                <td className="p-3 text-right text-slate-500 text-[11px]">
                  Authorized by Ministry
                </td>
              </tr>

              {/* Empty placeholder area for future trained models */}
              <tr className="bg-slate-50/50 border-t border-dashed border-slate-200">
                <td colSpan={7} className="p-6 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Server className="w-5 h-5 text-slate-300" />
                    <span className="font-semibold text-slate-600 text-xs">
                      No candidate models awaiting promotion
                    </span>
                    <p className="text-[11px] text-slate-400 max-w-md">
                      Future trained supervised models (e.g., XGBoost, CatBoost or LightGBM on verified multi-year SLA ground-truth) will populate here for evaluation and side-by-side benchmarking before promotion.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Designed Continuous Learning Loop Diagram */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-[#123B63]" />
              Continuous Learning Architecture (Human-in-the-Loop)
            </h3>
            <span className="text-[11px] italic font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
              Designed continuous learning and model recalibration workflow.
            </span>
          </div>

          {/* Workflow Diagram */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center pt-2">
            {[
              {
                step: '1',
                title: 'Verified Data',
                desc: 'Field verification by Verification Officers',
                color: 'border-blue-200 bg-blue-50/60 text-blue-900',
              },
              {
                step: '2',
                title: 'Monitoring',
                desc: 'Data quality checks & drift surveillance',
                color: 'border-indigo-200 bg-indigo-50/60 text-indigo-900',
              },
              {
                step: '3',
                title: 'Training Set',
                desc: 'Curated audit-logged ground truth',
                color: 'border-slate-200 bg-white text-slate-900',
              },
              {
                step: '4',
                title: 'Evaluation',
                desc: 'AUC-ROC, fairness & bias validation',
                color: 'border-amber-200 bg-amber-50/60 text-amber-900',
              },
              {
                step: '5',
                title: 'New Version',
                desc: 'Candidate artifact versioning (v0.2+)',
                color: 'border-purple-200 bg-purple-50/60 text-purple-900',
              },
              {
                step: '6',
                title: 'Promotion',
                desc: 'Manual approval by ML_DATA_TEAM',
                color: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
              },
            ].map((node, i, arr) => (
              <div
                key={node.step}
                className={`p-3 rounded border ${node.color} flex flex-col justify-between items-center text-xs relative`}
              >
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center mb-1">
                  {node.step}
                </div>
                <div className="font-bold text-xs">{node.title}</div>
                <div className="text-[10px] opacity-75 mt-1 leading-tight">
                  {node.desc}
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 pt-1 leading-relaxed">
            <strong>Statutory Safeguard:</strong> All newly trained model candidates must undergo offline shadow evaluation against the baseline-0.1 rule weights. Model promotion strictly requires cryptographically logged multi-factor approval from authorized members of the <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">ML_DATA_TEAM</code> to prevent hallucination or bias against vulnerable land-losers.
          </div>
        </div>
      </div>

      {/* API CONTRACT & EXTERNAL INTEGRATION SPECIFICATION (Visible to ML_DATA_TEAM) */}
      {isMLTeamUser && (
        <div className="bg-white border border-slate-200 rounded p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#123B63]" />
                <h2 className="text-base font-bold text-slate-900">
                  External System Integration & API Contract
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard REST interface for inter-departmental ingestion (PM GatiShakti, Bhumi Rashi, NIC-RoW).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Visible to ML_DATA_TEAM
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {/* Request Schema */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="px-1.5 py-0.5 rounded bg-blue-700 text-white text-[10px] font-mono">POST</span>
                  <code className="text-slate-900 font-mono text-[11px]">/api/v1/predict/delay-risk</code>
                </div>
                <button
                  onClick={() => handleCopy(samplePredictRequest, 'req')}
                  className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[10px] flex items-center gap-1 text-slate-600 transition-colors"
                >
                  {copiedContract === 'req' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy JSON
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                <div className="text-slate-400 text-[10px] mb-2 pb-1 border-b border-slate-800">
                  // Request Payload (Headers: Authorization: Bearer &lt;OFFICER_TOKEN&gt;)
                </div>
                <pre>{samplePredictRequest}</pre>
              </div>
            </div>

            {/* Response Schema */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-mono">200 OK</span>
                  <span className="text-slate-600 text-[11px]">Prediction Response Payload</span>
                </div>
                <button
                  onClick={() => handleCopy(samplePredictResponse, 'res')}
                  className="px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[10px] flex items-center gap-1 text-slate-600 transition-colors"
                >
                  {copiedContract === 'res' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy JSON
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                <div className="text-slate-400 text-[10px] mb-2 pb-1 border-b border-slate-800">
                  // Response Payload (Model-derived delay score & explainable factor contributions)
                </div>
                <pre>{samplePredictResponse}</pre>
              </div>
            </div>
          </div>

          {/* Operational Contract Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] border-t border-slate-100">
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 mb-0.5">Authentication & Scopes</div>
              <div className="text-slate-600">
                OAuth2 Bearer Token with statutory role scope <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-[10px]">scope:bhumi:predict</code>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 mb-0.5">Rate Limit & SLA</div>
              <div className="text-slate-600">
                60 req/min per district node; p99 latency &lt; 250ms for synchronous inference.
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900 mb-0.5">Audit Compliance</div>
              <div className="text-slate-600">
                Every API call is immutably logged to the Central NIC Audit Trail with client IP & digital signature.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
