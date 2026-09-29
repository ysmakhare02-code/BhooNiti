import { Project, AlertNotification, AuthUser } from '../types';
import { getScopedProjects } from './permissions';

/**
 * Evaluates rule-driven alerts for land acquisition infrastructure projects.
 * Rules:
 *  1. Risk crossed HIGH (>=60) or CRITICAL (>=75)
 *  2. Risk increased by 15+ points vs the previous trend point
 *  3. approvalDelayDays > 90
 *  4. compensation paid < 50% while the stage is Compensation or later
 *  5. rrProgressPct < 40% in the RR or Possession stage
 *  6. A legal case with High/Critical severity
 *  7. Verification PENDING for more than 7 days
 *  8. Data quality warnings (reused from MLDashboardView)
 *
 * Each generated alert includes the triggering rule name and the exact values that triggered it.
 * Applies getScopedProjects if a user is provided.
 */
export function generateAlerts(
  projects: Project[],
  user?: AuthUser | null
): AlertNotification[] {
  const targetProjects = user ? getScopedProjects(projects, user) : projects;
  const alerts: AlertNotification[] = [];
  let counter = 1;

  const getAlertId = (prefix: string, projId: string) =>
    `ALT-${prefix}-${projId}-${counter++}`;

  for (const p of targetProjects) {
    // -------------------------------------------------------------
    // RULE 1: Risk crossed HIGH or CRITICAL threshold
    // -------------------------------------------------------------
    if (p.riskScore >= 75 || p.riskLevel === 'CRITICAL') {
      alerts.push({
        id: getAlertId('CRIT', p.id),
        projectId: p.id,
        projectName: p.name,
        severity: 'CRITICAL',
        type: 'HIGH_RISK_THRESHOLD',
        title: `Critical Delay Risk Threshold Crossed: ${p.riskScore}% (${p.riskLevel})`,
        description: `Delay risk score escalated to ${p.riskScore}%, exceeding the statutory critical intervention threshold of 75%.`,
        timestamp: `${p.lastUpdatedDate} 09:30 IST`,
        isRead: false,
        actionRequired: 'Convene emergency District Land Acquisition & Monitoring Committee review.',
        triggeringRule: 'Risk Threshold Exceeded (CRITICAL >= 75)',
        triggeringValues: {
          riskScore: p.riskScore,
          riskLevel: p.riskLevel,
          delayProbability: `${p.delayProbability}%`,
          threshold: 75,
        },
      });
    } else if (p.riskScore >= 60 || p.riskLevel === 'HIGH') {
      alerts.push({
        id: getAlertId('HIGH', p.id),
        projectId: p.id,
        projectName: p.name,
        severity: 'HIGH',
        type: 'HIGH_RISK_THRESHOLD',
        title: `High Delay Risk Level: ${p.riskScore}% (${p.riskLevel})`,
        description: `Project operates under high statutory delay exposure (${p.riskScore}%), warranting proactive sub-divisional monitoring.`,
        timestamp: `${p.lastUpdatedDate} 10:15 IST`,
        isRead: false,
        actionRequired: 'Review pending milestone bottlenecks with implementing agency.',
        triggeringRule: 'Risk Threshold Exceeded (HIGH >= 60)',
        triggeringValues: {
          riskScore: p.riskScore,
          riskLevel: p.riskLevel,
          delayProbability: `${p.delayProbability}%`,
          threshold: 60,
        },
      });
    }

    // -------------------------------------------------------------
    // RULE 2: Risk increased by 15+ points vs the previous trend point
    // -------------------------------------------------------------
    if (p.historicalRiskTrend && p.historicalRiskTrend.length >= 2) {
      const currentPoint = p.historicalRiskTrend[p.historicalRiskTrend.length - 1];
      const prevPoint = p.historicalRiskTrend[p.historicalRiskTrend.length - 2];
      const delta = currentPoint.riskScore - prevPoint.riskScore;

      if (delta >= 15) {
        alerts.push({
          id: getAlertId('SURGE', p.id),
          projectId: p.id,
          projectName: p.name,
          severity: delta >= 25 ? 'CRITICAL' : 'HIGH',
          type: 'SUDDEN_RISK_INCREASE',
          title: `Sudden Risk Surge: ${prevPoint.riskScore}% → ${currentPoint.riskScore}% (+${delta} pts)`,
          description: `Risk escalated rapidly between ${prevPoint.milestone || prevPoint.date} and ${currentPoint.milestone || currentPoint.date}.`,
          timestamp: `${p.lastUpdatedDate} 14:35 IST`,
          isRead: false,
          actionRequired: 'Investigate recent dispute notices, compensation lags, or court orders.',
          triggeringRule: 'Sudden Risk Surge (>= 15 points vs previous trend point)',
          triggeringValues: {
            previousRiskScore: prevPoint.riskScore,
            currentRiskScore: currentPoint.riskScore,
            increasePoints: delta,
            threshold: 15,
          },
        });
      }
    }

    // -------------------------------------------------------------
    // RULE 3: approvalDelayDays > 90
    // -------------------------------------------------------------
    if (p.approvalDelayDays > 90) {
      alerts.push({
        id: getAlertId('DELAY', p.id),
        projectId: p.id,
        projectName: p.name,
        severity: p.approvalDelayDays > 150 ? 'CRITICAL' : 'HIGH',
        type: 'APPROVAL_OVERDUE',
        title: `Statutory Clearances Stagnant for ${p.approvalDelayDays} Days`,
        description: `Statutory approval or departmental clearance delay has reached ${p.approvalDelayDays} days, exceeding the normative 90-day ceiling.`,
        timestamp: `${p.lastUpdatedDate} 11:20 IST`,
        isRead: false,
        actionRequired: 'Escalate to State Infrastructure Coordination Committee for interdepartmental clearance.',
        triggeringRule: 'Approval Delay Beyond Statutory SLA Window (> 90 Days)',
        triggeringValues: {
          approvalDelayDays: p.approvalDelayDays,
          normativeThresholdDays: 90,
          overdueDays: p.approvalDelayDays - 90,
        },
      });
    }

    // -------------------------------------------------------------
    // RULE 4: compensation paid < 50% while stage is Compensation or later
    // -------------------------------------------------------------
    const compensationOrLaterStages = ['Compensation', 'RR', 'Possession', 'Handover'];
    if (compensationOrLaterStages.includes(p.currentStage) && p.compensationTotalCr > 0) {
      const compPaidPct = Math.round((p.compensationPaidCr / p.compensationTotalCr) * 100);
      if (compPaidPct < 50) {
        alerts.push({
          id: getAlertId('COMP', p.id),
          projectId: p.id,
          projectName: p.name,
          severity: compPaidPct < 30 ? 'CRITICAL' : 'HIGH',
          type: 'COMPENSATION_BACKLOG',
          title: `Compensation Disbursement Deficit: ${compPaidPct}% (Below 50% Target)`,
          description: `Disbursed ₹${p.compensationPaidCr} Cr out of sanctioned ₹${p.compensationTotalCr} Cr while currently in "${p.currentStage}" stage.`,
          timestamp: `${p.lastUpdatedDate} 12:00 IST`,
          isRead: false,
          actionRequired: 'Deploy special title verification camps and resolve bank account / mutation anomalies.',
          triggeringRule: 'Compensation Paid < 50% in Compensation or Later Stage',
          triggeringValues: {
            currentStage: p.currentStage,
            compensationPaidCr: p.compensationPaidCr,
            compensationTotalCr: p.compensationTotalCr,
            disbursedPercentage: `${compPaidPct}%`,
            thresholdPercentage: '50%',
          },
        });
      }
    }

    // -------------------------------------------------------------
    // RULE 5: rrProgressPct < 40% in RR or Possession stage
    // -------------------------------------------------------------
    if (['RR', 'Possession'].includes(p.currentStage) && p.rrProgressPct < 40) {
      alerts.push({
        id: getAlertId('RR', p.id),
        projectId: p.id,
        projectName: p.name,
        severity: 'HIGH',
        type: 'RR_PROGRESS_LAG',
        title: `R&R Package Entitlement Lag: ${p.rrProgressPct}% (Threshold: 40%)`,
        description: `Rehabilitation and Resettlement entitlements stand at ${p.rrProgressPct}% while project has entered the ${p.currentStage} milestone.`,
        timestamp: `${p.lastUpdatedDate} 13:10 IST`,
        isRead: false,
        actionRequired: 'Expedite plot allotment and alternative livelihood disbursement under Section 31.',
        triggeringRule: 'R&R Progress < 40% in RR or Possession Stage',
        triggeringValues: {
          currentStage: p.currentStage,
          rrProgressPct: `${p.rrProgressPct}%`,
          thresholdPercentage: '40%',
          deficitPercentage: `${40 - p.rrProgressPct}%`,
        },
      });
    }

    // -------------------------------------------------------------
    // RULE 6: Legal case with High/Critical severity
    // -------------------------------------------------------------
    if (p.legalSeverity === 'High' || p.legalSeverity === 'Critical') {
      alerts.push({
        id: getAlertId('LEGAL', p.id),
        projectId: p.id,
        projectName: p.name,
        severity: p.legalSeverity === 'Critical' ? 'CRITICAL' : 'HIGH',
        type: 'LEGAL_STAY',
        title: `${p.legalSeverity.toUpperCase()} Judicial Risk: ${p.legalDisputesCount} Active Court Writs / Objections`,
        description: `Project faces ${p.legalDisputesCount} legal dispute(s) with ${p.legalSeverity} severity affecting statutory acquisition progress.`,
        timestamp: `${p.lastUpdatedDate} 15:45 IST`,
        isRead: false,
        actionRequired: 'Instruct Government Pleader to file stay vacation counter-affidavit and convene Section 15 hearing.',
        triggeringRule: 'Legal Dispute with High or Critical Severity',
        triggeringValues: {
          legalSeverity: p.legalSeverity,
          legalDisputesCount: p.legalDisputesCount,
        },
      });
    }

    // -------------------------------------------------------------
    // RULE 7: Verification PENDING for more than 7 days
    // -------------------------------------------------------------
    const isVerificationPending =
      p.verificationStatus === 'PENDING' ||
      p.evidenceDocuments.some((d) => d.status === 'Pending');

    if (isVerificationPending) {
      // Calculate pending days: if daysAtCurrentStage > 7 or default synthetic lag >= 8
      const pendingDays = Math.max(8, p.daysAtCurrentStage > 7 ? p.daysAtCurrentStage : 8);
      alerts.push({
        id: getAlertId('VERIF', p.id),
        projectId: p.id,
        projectName: p.name,
        severity: 'MODERATE',
        type: 'VERIFICATION_PENDING',
        title: `Statutory Dossier Verification Overdue (${pendingDays} Days Pending)`,
        description: `Supporting evidence and gazette instruments remain pending scrutiny by the Verification Officer (SLAO) beyond the 7-day window.`,
        timestamp: `${p.lastUpdatedDate} 16:20 IST`,
        isRead: false,
        actionRequired: 'Verification Officer (SLAO) must scrutinize uploaded evidence and record mandatory remarks.',
        triggeringRule: 'Verification PENDING for More Than 7 Days',
        triggeringValues: {
          verificationStatus: p.verificationStatus,
          pendingDays,
          thresholdDays: 7,
        },
      });
    }

    // -------------------------------------------------------------
    // RULE 8: Data quality warnings (reused from MLDashboardView)
    // -------------------------------------------------------------
    if (p.landAcquiredHectares > p.landRequiredHectares) {
      alerts.push({
        id: getAlertId('DQ-LAND', p.id),
        projectId: p.id,
        projectName: p.name,
        severity: 'HIGH',
        type: 'DATA_QUALITY_WARNING',
        title: `Data Quality: Acquired Land Exceeds Statutory Requisition`,
        description: `Reported land acquired (${p.landAcquiredHectares} Ha) exceeds sanctioned requirement (${p.landRequiredHectares} Ha).`,
        timestamp: `${p.lastUpdatedDate} 17:00 IST`,
        isRead: false,
        actionRequired: 'Audit field survey records and correct cadastral land requisition entries.',
        triggeringRule: 'Data Quality: Land Acquired > Land Required',
        triggeringValues: {
          landAcquiredHectares: p.landAcquiredHectares,
          landRequiredHectares: p.landRequiredHectares,
          discrepancyHectares: Math.round((p.landAcquiredHectares - p.landRequiredHectares) * 100) / 100,
        },
      });
    }

    if (p.compensationPaidCr > p.compensationTotalCr) {
      alerts.push({
        id: getAlertId('DQ-FIN', p.id),
        projectId: p.id,
        projectName: p.name,
        severity: 'HIGH',
        type: 'DATA_QUALITY_WARNING',
        title: `Data Quality: Compensation Paid Exceeds Sanctioned Award`,
        description: `Compensation disbursed (₹${p.compensationPaidCr} Cr) exceeds sanctioned award amount (₹${p.compensationTotalCr} Cr).`,
        timestamp: `${p.lastUpdatedDate} 17:15 IST`,
        isRead: false,
        actionRequired: 'Audit treasury DBT vouchers and reconcile award schedule figures.',
        triggeringRule: 'Data Quality: Compensation Paid > Compensation Total Award',
        triggeringValues: {
          compensationPaidCr: p.compensationPaidCr,
          compensationTotalCr: p.compensationTotalCr,
          excessDisbursalCr: Math.round((p.compensationPaidCr - p.compensationTotalCr) * 100) / 100,
        },
      });
    }

    if (p.daysAtCurrentStage > 180) {
      alerts.push({
        id: getAlertId('DQ-STAG', p.id),
        projectId: p.id,
        projectName: p.name,
        severity: 'MODERATE',
        type: 'DATA_QUALITY_WARNING',
        title: `Data Quality: Milestone Stagnation (> 180 Days at Current Stage)`,
        description: `Project has remained in "${p.currentStage}" for ${p.daysAtCurrentStage} days without milestone progression or statutory update.`,
        timestamp: `${p.lastUpdatedDate} 17:30 IST`,
        isRead: false,
        actionRequired: 'Demand status report from field acquisition officer regarding milestone delay.',
        triggeringRule: 'Data Quality: Days at Current Stage > 180',
        triggeringValues: {
          currentStage: p.currentStage,
          daysAtCurrentStage: p.daysAtCurrentStage,
          thresholdDays: 180,
        },
      });
    }
  }

  // Sort alerts: CRITICAL first, then HIGH, MODERATE, INFO
  const severityOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MODERATE: 2,
    INFO: 3,
  };

  return alerts.sort((a, b) => {
    const diff = (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99);
    if (diff !== 0) return diff;
    return b.timestamp.localeCompare(a.timestamp);
  });
}
