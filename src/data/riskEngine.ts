import {
  Project,
  RiskLevel,
  FactorContribution,
  PositiveFactor,
  StageRiskItem,
  ProjectStage,
} from '../types';

export const MODEL_INFO = {
  name: 'Rule-based baseline (demo)',
  version: 'baseline-0.1',
  type: 'weighted-rules',
  trainedOnData: false,
};

export const BASE_RISK_SCORE = 10;

export const STAGE_BENCHMARK_CONFIG: Record<
  ProjectStage,
  { expectedDays: number; typicalCompletedDays: number }
> = {
  Proposal: { expectedDays: 30, typicalCompletedDays: 28 },
  Survey: { expectedDays: 60, typicalCompletedDays: 52 },
  SIA: { expectedDays: 90, typicalCompletedDays: 85 },
  Notification: { expectedDays: 60, typicalCompletedDays: 58 },
  Objections: { expectedDays: 60, typicalCompletedDays: 64 },
  Valuation: { expectedDays: 75, typicalCompletedDays: 70 },
  Award: { expectedDays: 90, typicalCompletedDays: 82 },
  Compensation: { expectedDays: 120, typicalCompletedDays: 115 },
  RR: { expectedDays: 120, typicalCompletedDays: 110 },
  Possession: { expectedDays: 90, typicalCompletedDays: 80 },
  Handover: { expectedDays: 45, typicalCompletedDays: 40 },
};

export interface CalculationResult {
  riskScore: number;
  delayProbability: number;
  riskLevel: RiskLevel;
  baseScore: number;
  factorScore: number;
  mitigationScore: number;
  topRiskFactors: FactorContribution[];
  positiveFactors: PositiveFactor[];
  stageRisks: StageRiskItem[];
}

export function calculateProjectRisk(
  data: Partial<Project> & {
    compensationPaidCr?: number;
    compensationTotalCr?: number;
    approvalDelayDays?: number;
    legalDisputesCount?: number;
    legalSeverity?: 'Low' | 'Medium' | 'High' | 'Critical';
    rrProgressPct?: number;
    possessionProgressPct?: number;
    daysAtCurrentStage?: number;
    surveyProgressPct?: number;
    documentationCompletenessPct?: number;
    currentStage?: ProjectStage;
  }
): CalculationResult {
  const totalComp = Math.max(data.compensationTotalCr ?? 100, 0.1);
  const paidComp = Math.min(Math.max(data.compensationPaidCr ?? 0, 0), totalComp);
  const compRatio = paidComp / totalComp; // 0 to 1
  const compDeficit = 1 - compRatio; // 0 (all paid) to 1 (none paid)

  const approvalDelay = Math.max(data.approvalDelayDays ?? 0, 0);
  const approvalLagFactor = Math.min(approvalDelay / 180, 1.0); // caps at 180 days

  const legalCases = Math.max(data.legalDisputesCount ?? 0, 0);
  const legalSeverity = data.legalSeverity ?? 'Medium';
  const severityMultiplier =
    legalSeverity === 'Critical'
      ? 1.5
      : legalSeverity === 'High'
      ? 1.2
      : legalSeverity === 'Medium'
      ? 1.0
      : 0.7;
  const legalFactor = Math.min((legalCases * 0.15) * severityMultiplier, 1.0);

  const rrProgress = Math.min(Math.max(data.rrProgressPct ?? 0, 0), 100) / 100;
  const rrDeficit = 1 - rrProgress;

  const possessionProgress = Math.min(Math.max(data.possessionProgressPct ?? 0, 0), 100) / 100;
  const possessionDeficit = 1 - possessionProgress;

  const stageDays = Math.max(data.daysAtCurrentStage ?? 0, 0);
  const stageStagnationFactor = Math.min(stageDays / 120, 1.0);

  const surveyProgress = Math.min(Math.max(data.surveyProgressPct ?? 100, 0), 100) / 100;
  const docCompleteness = Math.min(Math.max(data.documentationCompletenessPct ?? 80, 0), 100) / 100;

  // Compute explainable factor contributions (rule-based baseline)
  const topRiskFactors: FactorContribution[] = [];

  if (compDeficit > 0.25) {
    const impact = Math.round(compDeficit * 28);
    topRiskFactors.push({
      id: 'comp_deficit',
      name: 'Compensation Disbursement Pending',
      contributionPercent: impact,
      severity: impact >= 20 ? 'high' : 'medium',
      description: `Disbursement rate is at ${(compRatio * 100).toFixed(0)}% with ₹${(
        totalComp - paidComp
      ).toFixed(2)} Cr pending across affected land parcels.`,
      metricLabel: 'Unpaid Compensation',
      metricValue: `₹${(totalComp - paidComp).toFixed(1)} Cr (${((1 - compRatio) * 100).toFixed(0)}% pending)`,
    });
  }

  if (approvalDelay > 30) {
    const impact = Math.round(approvalLagFactor * 22);
    topRiskFactors.push({
      id: 'approval_delay',
      name: 'Statutory & Interdepartmental Approval Lag',
      contributionPercent: impact,
      severity: impact >= 16 ? 'high' : 'medium',
      description: `Clearances have exceeded the normative processing window by ${approvalDelay} days.`,
      metricLabel: 'Processing Overdue',
      metricValue: `${approvalDelay} days past statutory window`,
    });
  }

  if (legalCases > 0) {
    const impact = Math.round(legalFactor * 18);
    topRiskFactors.push({
      id: 'legal_disputes',
      name: 'Pending High Court / Tribunal Objections',
      contributionPercent: impact,
      severity: legalSeverity === 'Critical' || legalSeverity === 'High' ? 'high' : 'medium',
      description: `${legalCases} active petitions pending concerning alignment and solatium calculation.`,
      metricLabel: 'Active Petitions',
      metricValue: `${legalCases} Petitions (${legalSeverity} severity)`,
    });
  }

  if (rrDeficit > 0.3) {
    const impact = Math.round(rrDeficit * 16);
    topRiskFactors.push({
      id: 'rr_lag',
      name: 'Rehabilitation & Resettlement (R&R) Backlog',
      contributionPercent: impact,
      severity: impact >= 12 ? 'medium' : 'low',
      description: `Only ${(rrProgress * 100).toFixed(0)}% of eligible project-affected families have completed alternate plot allotment or annuity entitlement.`,
      metricLabel: 'R&R Completed',
      metricValue: `${(rrProgress * 100).toFixed(0)}% of affected families`,
    });
  }

  if (possessionDeficit > 0.4) {
    const impact = Math.round(possessionDeficit * 16);
    topRiskFactors.push({
      id: 'possession_deficit',
      name: 'Physical Land Possession Deficit',
      contributionPercent: impact,
      severity: impact >= 12 ? 'medium' : 'low',
      description: `Physical handover pending for ${((1 - possessionProgress) * 100).toFixed(0)}% of required project right-of-way (RoW).`,
      metricLabel: 'RoW Possessed',
      metricValue: `${(possessionProgress * 100).toFixed(0)}% acquired`,
    });
  }

  if (stageDays > 45) {
    const impact = Math.round(stageStagnationFactor * 8);
    if (impact > 0) {
      topRiskFactors.push({
        id: 'stage_stagnation',
        name: 'Stage Stagnation Duration',
        contributionPercent: impact,
        severity: impact >= 6 ? 'medium' : 'low',
        description: `Project has spent ${stageDays} days at current statutory milestone without transition.`,
        metricLabel: 'Days at Stage',
        metricValue: `${stageDays} days elapsed`,
      });
    }
  }

  // Sort risk factors descending
  topRiskFactors.sort((a, b) => b.contributionPercent - a.contributionPercent);

  // Positive Mitigating factors (derived from the same formula, in points)
  const positiveFactors: PositiveFactor[] = [];
  if (surveyProgress >= 0.85) {
    const points = Math.round(surveyProgress * 5);
    positiveFactors.push({
      id: 'survey_done',
      name: 'Joint Measurement Survey (JMS) Completed',
      mitigationPercent: -points,
      description: 'Cadastral mapping and individual boundary demarcation have been validated with zero pending field objections.',
    });
  }

  if (docCompleteness >= 0.80) {
    const points = Math.round(docCompleteness * 5);
    positiveFactors.push({
      id: 'doc_ready',
      name: 'Digitized Land Record Title Completeness',
      mitigationPercent: -points,
      description: 'Record of Rights and title documentation verified across surveyed land parcels.',
    });
  }

  if (data.stakeholderResponsiveness === 'High') {
    const points = 4;
    positiveFactors.push({
      id: 'stakeholder_high',
      name: 'Strong Local Panchayat & Community Engagement',
      mitigationPercent: -points,
      description: 'High responsiveness in public consultations with village sarpanches and local community members.',
    });
  }

  // Base + factors − mitigations = final score
  const baseScore = BASE_RISK_SCORE;
  const factorScore = topRiskFactors.reduce((acc, f) => acc + f.contributionPercent, 0);
  const mitigationScore = positiveFactors.reduce((acc, pf) => acc + Math.abs(pf.mitigationPercent), 0);

  let calculatedScore = baseScore + factorScore - mitigationScore;
  calculatedScore = Math.max(8, Math.min(96, calculatedScore));

  const delayProbability = calculatedScore;
  const riskScore = calculatedScore;

  let riskLevel: RiskLevel = 'LOW';
  if (riskScore >= 81) riskLevel = 'CRITICAL';
  else if (riskScore >= 61) riskLevel = 'HIGH';
  else if (riskScore >= 31) riskLevel = 'MODERATE';
  else riskLevel = 'LOW';

  // Stage-wise risk assessments across all 11 statutory stages
  const stagesOrdered: ProjectStage[] = [
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

  const currentStage = data.currentStage ?? 'Compensation';
  const currentStageIndex = stagesOrdered.indexOf(currentStage);

  const stageRisks: StageRiskItem[] = stagesOrdered.map((st, idx) => {
    let status: 'Completed' | 'In Progress' | 'Pending' | 'Delayed' = 'Pending';
    let sRisk: RiskLevel = 'LOW';
    let blockers: string | undefined;

    if (idx < currentStageIndex) {
      status = 'Completed';
      sRisk = 'LOW';
    } else if (idx === currentStageIndex) {
      status = riskScore >= 61 ? 'Delayed' : 'In Progress';
      sRisk = riskLevel;
      if (st === 'Compensation') {
        blockers = `₹${(totalComp - paidComp).toFixed(1)} Cr compensation pending for ${(100 - compRatio * 100).toFixed(0)}% landowners`;
      } else if (st === 'Award') {
        blockers = 'Section 23 valuation objections under review by District Collector';
      } else if (st === 'RR') {
        blockers = 'Town planning layout approval for resettlement colony pending';
      } else if (st === 'Possession') {
        blockers = 'Standing crop removal and boundary pillar pegging pending';
      } else {
        blockers = 'Interdepartmental clearances in progress';
      }
    } else {
      status = 'Pending';
      if (st === 'Possession' || st === 'Handover') {
        sRisk = riskScore >= 61 ? 'HIGH' : riskScore >= 31 ? 'MODERATE' : 'LOW';
      } else if (st === 'RR') {
        sRisk = rrDeficit > 0.3 ? 'HIGH' : 'MODERATE';
      } else {
        sRisk = 'MODERATE';
      }
    }

    const stageConfig = STAGE_BENCHMARK_CONFIG[st] || { expectedDays: 60, typicalCompletedDays: 50 };
    const durationDays =
      status === 'Completed'
        ? stageConfig.typicalCompletedDays
        : idx === currentStageIndex
        ? stageDays
        : 0;
    const expectedDays = stageConfig.expectedDays;

    return {
      stage: st,
      label: st,
      status,
      riskLevel: sRisk,
      durationDays,
      expectedDays,
      blockers,
    };
  });

  return {
    riskScore,
    delayProbability,
    riskLevel,
    baseScore,
    factorScore,
    mitigationScore,
    topRiskFactors,
    positiveFactors,
    stageRisks,
  };
}
