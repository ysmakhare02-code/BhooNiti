import { Project, AlertNotification } from '../types';
import { calculateProjectRisk } from './riskEngine';

// Seeded pseudo-random number generator (Mulberry32) for deterministic data generation
function createMulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = createMulberry32(20260918);

// Flagship Project for the Demo
const flagshipProjectRaw: Omit<
  Project,
  'riskScore' | 'delayProbability' | 'riskLevel' | 'topRiskFactors' | 'positiveFactors' | 'stageRisks'
> = {
  id: 'NH-MH-001',
  name: 'Demo NH Corridor - Package A',
  type: 'National Highway',
  state: 'Maharashtra',
  district: 'Pune',
  tehsil: 'Haveli',
  villages: ['Village A1', 'Village A2', 'Village A3', 'Village A4', 'Village A5'],
  agency: 'National Highways Authority of India (Demo PIU)',
  landRequiredHectares: 342.5,
  landAcquiredHectares: 188.3,
  affectedFamilies: 1240,
  landownersCount: 2180,
  compensationTotalCr: 485.6,
  compensationPaidCr: 204.0, // ~42%
  compensationPendingCr: 281.6,
  approvalDelayDays: 114,
  legalDisputesCount: 5,
  legalSeverity: 'High',
  documentationCompletenessPct: 82,
  surveyProgressPct: 96,
  siaProgressPct: 100,
  notificationStatus: 'Gazetted',
  awardStatus: 'Sanctioned',
  rrProgressPct: 44,
  possessionProgressPct: 55,
  stakeholderResponsiveness: 'Moderate',
  daysAtCurrentStage: 142,
  historicalAgencyDelayMonths: 8,
  currentStage: 'Compensation',
  verificationStatus: 'PENDING',
  lastUpdatedDate: '2026-09-18',
  coordinates: [18.5204, 73.8567],
  evidenceDocuments: [
    {
      id: 'EV-01',
      title: 'Joint Measurement Survey (JMS) Field Report (Demo Form 3B)',
      type: 'Cadastral Survey Map',
      uploadedDate: '2026-08-14',
      verifiedBy: 'Officer A',
      verifiedDate: '2026-08-16',
      status: 'Verified',
      fileSize: '4.8 MB',
      referenceNo: 'REV/DEMO/JMS/0001/2026',
      remarks: 'Superimposed with GIS satellite baseline coordinates; signed by competent field officers.',
    },
    {
      id: 'EV-02',
      title: 'Statutory Section 19(1) Declaration (Demo Gazette Extract)',
      type: 'Official Gazette Notification',
      uploadedDate: '2026-07-10',
      verifiedBy: 'Officer B',
      verifiedDate: '2026-07-12',
      status: 'Verified',
      fileSize: '2.1 MB',
      referenceNo: 'E-GAZ/DEMO/0002/2026',
      remarks: 'Statutory declaration published in district daily newspapers.',
    },
    {
      id: 'EV-03',
      title: 'Compensation Sanction Roll & Disbursal Audit',
      type: 'Financial Disbursal Roll',
      uploadedDate: '2026-09-12',
      status: 'Pending',
      fileSize: '12.4 MB',
      referenceNo: 'SLAO/DEMO/0003/2026',
      remarks: 'Direct Benefit Transfer (DBT) pending for land parcel mutation verification.',
    },
    {
      id: 'EV-04',
      title: 'High Court Writ Petition WP/DEMO/0001/2026 Order Copy',
      type: 'Judicial Proceeding',
      uploadedDate: '2026-09-02',
      status: 'Pending',
      fileSize: '1.6 MB',
      referenceNo: 'WP/DEMO/0001/2026',
      remarks: 'Interim stay on physical possession for 4.2 hectares in Package A pending hearing.',
    },
  ],
  auditTrail: [
    {
      id: 'AUD-001',
      timestamp: '2026-09-18 14:32 IST',
      officerName: 'Officer A',
      officerRole: 'Project Officer',
      action: 'Compensation Roll Upload',
      fieldChanged: 'Compensation Disbursed (Cr ₹)',
      oldValue: '₹188.5 Cr',
      newValue: '₹204.0 Cr',
      reason: 'Batch direct bank transfer disbursed for Village A1 stretch.',
    },
    {
      id: 'AUD-002',
      timestamp: '2026-09-15 11:10 IST',
      officerName: 'Officer B',
      officerRole: 'Verification Officer',
      action: 'Data Quality Warning',
      fieldChanged: 'Verification Status',
      oldValue: 'Verified',
      newValue: 'Pending Verification',
      reason: 'Updated compensation ledger requires statutory re-verification of pending bank accounts.',
    },
    {
      id: 'AUD-003',
      timestamp: '2026-09-05 09:45 IST',
      officerName: 'Officer C',
      officerRole: 'Competent Authority',
      action: 'Intervention Order',
      reason: 'Directed field officer to hold special camp for fast-track title verification.',
    },
  ],
  actionItems: [
    {
      id: 'ACT-101',
      title: 'Organize Special Title Verification Camp for Package A',
      recommendationSource: 'Model Delay Factor: Compensation Disbursement Deficit',
      assignedOfficer: 'Officer A',
      assignedRole: 'Project Officer',
      dueDate: '2026-09-28',
      status: 'In Progress',
      priority: 'Urgent',
      notes: 'Coordinate with local revenue officials to resolve pending succession mutation entries.',
      createdDate: '2026-09-16',
    },
    {
      id: 'ACT-102',
      title: 'File Reply & Vacate Stay in High Court Writ Petition WP/DEMO/0001/2026',
      recommendationSource: 'Model Delay Factor: Active Court Writs & Objections',
      assignedOfficer: 'Officer D',
      assignedRole: 'Legal Counsel',
      dueDate: '2026-09-26',
      status: 'Open',
      priority: 'High',
      notes: 'Submit revised solatium calculation sheet under Section 26-30 of RFCTLARR Act 2013.',
      createdDate: '2026-09-14',
    },
    {
      id: 'ACT-103',
      title: 'Expedite Forest Stage-II Working Permission for Package A Ghat Section',
      recommendationSource: 'Model Delay Factor: Interdepartmental Approval Delay',
      assignedOfficer: 'Officer E',
      assignedRole: 'Interdepartmental Officer',
      dueDate: '2026-10-05',
      status: 'In Progress',
      priority: 'Medium',
      notes: 'Compensatory afforestation land transfer verified; awaiting final regional clearance sign-off.',
      createdDate: '2026-09-10',
    },
  ],
  historicalRiskTrend: [
    { date: '2026-04-15', riskScore: 35, delayProbability: 35, milestone: 'Section 11 Preliminary Notification' },
    { date: '2026-06-10', riskScore: 44, delayProbability: 44, milestone: 'Section 15 Hearing Completed' },
    { date: '2026-07-28', riskScore: 56, delayProbability: 56, milestone: 'Award Declared; Clearances Delayed' },
    { date: '2026-09-18', riskScore: 0, delayProbability: 0, milestone: 'Current Statutory Assessment' },
  ],
};

// Calculate initial risk metrics using deterministic risk engine
const flagshipCalcs = calculateProjectRisk(flagshipProjectRaw);

// Set the last point of historicalRiskTrend strictly to flagshipCalcs.riskScore
const flagshipTrendWithCurrent = flagshipProjectRaw.historicalRiskTrend.map((pt, idx) => {
  if (idx === flagshipProjectRaw.historicalRiskTrend.length - 1) {
    return {
      ...pt,
      riskScore: flagshipCalcs.riskScore,
      delayProbability: flagshipCalcs.delayProbability,
    };
  }
  return pt;
});

export const flagshipProject: Project = {
  ...flagshipProjectRaw,
  historicalRiskTrend: flagshipTrendWithCurrent,
  riskScore: flagshipCalcs.riskScore,
  delayProbability: flagshipCalcs.delayProbability,
  riskLevel: flagshipCalcs.riskLevel,
  topRiskFactors: flagshipCalcs.topRiskFactors,
  positiveFactors: flagshipCalcs.positiveFactors,
  stageRisks: flagshipCalcs.stageRisks,
};

// Synthetic project templates with fictionalized names
const rawProjectTemplates = [
  {
    id: 'METRO-MH-002',
    name: 'Demo Metro Link - Package B',
    type: 'Metro' as const,
    state: 'Maharashtra',
    district: 'Pune',
    tehsil: 'Mulshi',
    villages: ['Village B1', 'Village B2', 'Village B3'],
    agency: 'Demo Metro Rail Corporation',
    landRequired: 48.2,
    landAcquired: 38.5,
    compTotal: 310.0,
    compPaid: 260.0,
    approvalDelay: 32,
    legalCases: 1,
    legalSeverity: 'Medium' as const,
    rrProgress: 75,
    possessionProgress: 80,
    currentStage: 'Possession' as const,
    coords: [18.5913, 73.7389] as [number, number],
    verificationStatus: 'VERIFIED' as const,
  },
  {
    id: 'HSR-MH-003',
    name: 'Demo HSR Rail Corridor - Package C',
    type: 'Railway' as const,
    state: 'Maharashtra',
    district: 'Thane',
    tehsil: 'Bhiwandi',
    villages: ['Village C1', 'Village C2', 'Village C3'],
    agency: 'Demo High Speed Rail Corporation',
    landRequired: 112.0,
    landAcquired: 54.0,
    compTotal: 840.0,
    compPaid: 320.0,
    approvalDelay: 140,
    legalCases: 6,
    legalSeverity: 'Critical' as const,
    rrProgress: 32,
    possessionProgress: 48,
    currentStage: 'Objections' as const,
    coords: [19.2967, 73.0631] as [number, number],
    verificationStatus: 'PENDING' as const,
  },
  {
    id: 'EXP-UP-004',
    name: 'Demo Expressway Phase-II - Package D',
    type: 'Expressway' as const,
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    tehsil: 'Pindra',
    villages: ['Village D1', 'Village D2', 'Village D3'],
    agency: 'Demo Expressway Authority',
    landRequired: 520.0,
    landAcquired: 440.0,
    compTotal: 620.0,
    compPaid: 510.0,
    approvalDelay: 24,
    legalCases: 2,
    legalSeverity: 'Low' as const,
    rrProgress: 88,
    possessionProgress: 85,
    currentStage: 'Possession' as const,
    coords: [25.3176, 82.9739] as [number, number],
    verificationStatus: 'VERIFIED' as const,
  },
  {
    id: 'AIR-UP-005',
    name: 'Demo Cargo Airport Zone - Package E',
    type: 'Airport' as const,
    state: 'Uttar Pradesh',
    district: 'Gautam Buddha Nagar',
    tehsil: 'Jewar',
    villages: ['Village E1', 'Village E2', 'Village E3', 'Village E4'],
    agency: 'Demo Airport Authority',
    landRequired: 1365.0,
    landAcquired: 920.0,
    compTotal: 2890.0,
    compPaid: 1850.0,
    approvalDelay: 85,
    legalCases: 4,
    legalSeverity: 'High' as const,
    rrProgress: 52,
    possessionProgress: 67,
    currentStage: 'Compensation' as const,
    coords: [28.1818, 77.5815] as [number, number],
    verificationStatus: 'PENDING' as const,
  },
  {
    id: 'IND-GJ-006',
    name: 'Demo Industrial Freight Spine - Package F',
    type: 'Industrial Corridor' as const,
    state: 'Gujarat',
    district: 'Ahmedabad',
    tehsil: 'Dholera',
    villages: ['Village F1', 'Village F2', 'Village F3'],
    agency: 'Demo Industrial City Development Corp',
    landRequired: 680.0,
    landAcquired: 640.0,
    compTotal: 410.0,
    compPaid: 395.0,
    approvalDelay: 15,
    legalCases: 0,
    legalSeverity: 'Low' as const,
    rrProgress: 95,
    possessionProgress: 94,
    currentStage: 'Handover' as const,
    coords: [22.2475, 72.1932] as [number, number],
    verificationStatus: 'VERIFIED' as const,
  },
  {
    id: 'SOLAR-GJ-007',
    name: 'Demo Renewable Energy Park Link - Package G',
    type: 'Renewable Energy' as const,
    state: 'Gujarat',
    district: 'Kutch',
    tehsil: 'Bhuj',
    villages: ['Village G1', 'Village G2', 'Village G3'],
    agency: 'Demo Power Grid Corporation',
    landRequired: 420.0,
    landAcquired: 380.0,
    compTotal: 185.0,
    compPaid: 172.0,
    approvalDelay: 20,
    legalCases: 1,
    legalSeverity: 'Low' as const,
    rrProgress: 90,
    possessionProgress: 90,
    currentStage: 'Possession' as const,
    coords: [23.8436, 69.7282] as [number, number],
    verificationStatus: 'VERIFIED' as const,
  },
  {
    id: 'IRR-AP-008',
    name: 'Demo Irrigation Canal - Package H',
    type: 'Irrigation & Canal' as const,
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    tehsil: 'Anakapalli',
    villages: ['Village H1', 'Village H2', 'Village H3'],
    agency: 'Demo Water Resources Department',
    landRequired: 310.0,
    landAcquired: 140.0,
    compTotal: 340.0,
    compPaid: 110.0,
    approvalDelay: 175,
    legalCases: 7,
    legalSeverity: 'Critical' as const,
    rrProgress: 24,
    possessionProgress: 45,
    currentStage: 'Award' as const,
    coords: [17.6868, 83.2185] as [number, number],
    verificationStatus: 'CORRECTION_REQUESTED' as const,
  },
  {
    id: 'NH-KA-009',
    name: 'Demo Ring Road Corridor - Package I',
    type: 'National Highway' as const,
    state: 'Karnataka',
    district: 'Bengaluru Rural',
    tehsil: 'Doddaballapura',
    villages: ['Village I1', 'Village I2', 'Village I3'],
    agency: 'National Highways Authority of India (Demo RO)',
    landRequired: 412.0,
    landAcquired: 265.0,
    compTotal: 790.0,
    compPaid: 480.0,
    approvalDelay: 68,
    legalCases: 3,
    legalSeverity: 'Medium' as const,
    rrProgress: 60,
    possessionProgress: 64,
    currentStage: 'Compensation' as const,
    coords: [13.2924, 77.5401] as [number, number],
    verificationStatus: 'PENDING' as const,
  },
  {
    id: 'DFC-RJ-010',
    name: 'Demo Freight Rail Line - Package J',
    type: 'Railway' as const,
    state: 'Rajasthan',
    district: 'Jaipur',
    tehsil: 'Phulera',
    villages: ['Village J1', 'Village J2', 'Village J3'],
    agency: 'Demo Freight Corridor Corporation',
    landRequired: 195.0,
    landAcquired: 180.0,
    compTotal: 215.0,
    compPaid: 205.0,
    approvalDelay: 18,
    legalCases: 1,
    legalSeverity: 'Low' as const,
    rrProgress: 92,
    possessionProgress: 92,
    currentStage: 'Handover' as const,
    coords: [26.9124, 75.7873] as [number, number],
    verificationStatus: 'VERIFIED' as const,
  },
  {
    id: 'IND-TN-011',
    name: 'Demo Industrial Node - Package K',
    type: 'Industrial Corridor' as const,
    state: 'Tamil Nadu',
    district: 'Tiruvallur',
    tehsil: 'Ponneri',
    villages: ['Village K1', 'Village K2', 'Village K3'],
    agency: 'Demo Industrial Corridor Agency',
    landRequired: 840.0,
    landAcquired: 510.0,
    compTotal: 960.0,
    compPaid: 580.0,
    approvalDelay: 92,
    legalCases: 4,
    legalSeverity: 'High' as const,
    rrProgress: 48,
    possessionProgress: 60,
    currentStage: 'Valuation' as const,
    coords: [13.3323, 80.1983] as [number, number],
    verificationStatus: 'PENDING' as const,
  },
  {
    id: 'EXP-MP-012',
    name: 'Demo Expressway Link - Package L',
    type: 'Expressway' as const,
    state: 'Madhya Pradesh',
    district: 'Morena',
    tehsil: 'Ambah',
    villages: ['Village L1', 'Village L2', 'Village L3'],
    agency: 'Demo Road Development Corporation',
    landRequired: 630.0,
    landAcquired: 290.0,
    compTotal: 410.0,
    compPaid: 145.0,
    approvalDelay: 160,
    legalCases: 5,
    legalSeverity: 'High' as const,
    rrProgress: 35,
    possessionProgress: 46,
    currentStage: 'Objections' as const,
    coords: [26.4947, 77.9940] as [number, number],
    verificationStatus: 'CORRECTION_REQUESTED' as const,
  },
];

// Extended synthetic pool of projects across Indian states
const statesPool = [
  { state: 'Maharashtra', districts: ['Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Solapur', 'Thane', 'Kolhapur'] },
  { state: 'Uttar Pradesh', districts: ['Varanasi', 'Lucknow', 'Kanpur', 'Agra', 'Prayagraj', 'Gorakhpur', 'Gautam Buddha Nagar'] },
  { state: 'Gujarat', districts: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Kutch', 'Bharuch'] },
  { state: 'Karnataka', districts: ['Bengaluru Rural', 'Mysuru', 'Belagavi', 'Hubballi', 'Mangaluru', 'Tumakuru'] },
  { state: 'Tamil Nadu', districts: ['Tiruvallur', 'Coimbatore', 'Madurai', 'Salem', 'Kanchipuram', 'Tiruchirappalli'] },
  { state: 'Madhya Pradesh', districts: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Morena', 'Ujjain'] },
  { state: 'Rajasthan', districts: ['Jaipur', 'Jodhpur', 'Kota', 'Alwar', 'Barmer', 'Bikaner'] },
  { state: 'Odisha', districts: ['Khordha', 'Cuttack', 'Sundargarh', 'Sambalpur', 'Ganjam', 'Jharsuguda'] },
  { state: 'Bihar', districts: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Vaishali'] },
  { state: 'Andhra Pradesh', districts: ['Visakhapatnam', 'Krishna', 'Guntur', 'Kurnool', 'Chittoor'] },
];

const typesPool: Project['type'][] = [
  'National Highway',
  'State Highway',
  'Railway',
  'Metro',
  'Expressway',
  'Industrial Corridor',
  'Airport',
  'Irrigation & Canal',
  'Renewable Energy',
  'Power Transmission',
  'Urban Infrastructure',
];

const agenciesPool = [
  'National Highways Authority of India (Demo)',
  'Ministry of Road Transport (Demo)',
  'Dedicated Freight Corridor Corp (Demo)',
  'Rail Vikas Corporation (Demo)',
  'State Public Works Department (Demo)',
  'Metro Rail Corporation (Demo)',
  'Industrial Corridor Dev Corp (Demo)',
  'State Industrial Development Corp (Demo)',
  'Power Grid Corporation (Demo)',
  'State Water Resources Department (Demo)',
];

const stagesPool: Project['currentStage'][] = [
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

const generatedProjects: Project[] = [flagshipProject];

// Add template projects
rawProjectTemplates.forEach((t) => {
  const compTotal = t.compTotal;
  const compPaid = t.compPaid;
  const compPending = compTotal - compPaid;

  const projectRaw: Omit<
    Project,
    'riskScore' | 'delayProbability' | 'riskLevel' | 'topRiskFactors' | 'positiveFactors' | 'stageRisks'
  > = {
    id: t.id,
    name: t.name,
    type: t.type,
    state: t.state,
    district: t.district,
    tehsil: t.tehsil,
    villages: t.villages,
    agency: t.agency,
    landRequiredHectares: t.landRequired,
    landAcquiredHectares: t.landAcquired,
    affectedFamilies: Math.round(t.landRequired * 3.4),
    landownersCount: Math.round(t.landRequired * 5.8),
    compensationTotalCr: compTotal,
    compensationPaidCr: compPaid,
    compensationPendingCr: compPending,
    approvalDelayDays: t.approvalDelay,
    legalDisputesCount: t.legalCases,
    legalSeverity: t.legalSeverity,
    documentationCompletenessPct: Math.round(65 + rng() * 30),
    surveyProgressPct: Math.round(75 + rng() * 25),
    siaProgressPct: 100,
    notificationStatus: 'Gazetted',
    awardStatus: compPaid / compTotal > 0.6 ? 'Sanctioned' : 'Draft',
    rrProgressPct: t.rrProgress,
    possessionProgressPct: t.possessionProgress,
    stakeholderResponsiveness: t.legalCases > 3 ? 'Low' : 'Moderate',
    daysAtCurrentStage: Math.round(30 + rng() * 90),
    historicalAgencyDelayMonths: Math.round(2 + rng() * 8),
    currentStage: t.currentStage,
    verificationStatus: t.verificationStatus,
    lastUpdatedDate: '2026-09-17',
    coordinates: t.coords,
    evidenceDocuments: [
      {
        id: `EV-${t.id}-01`,
        title: 'Joint Measurement Survey (JMS) Cadastral Extract',
        type: 'Survey Record',
        uploadedDate: '2026-08-10',
        verifiedBy: 'Officer A',
        status: t.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending',
        fileSize: '3.4 MB',
        referenceNo: `SURV/DEMO/${t.id}/2026`,
      },
      {
        id: `EV-${t.id}-02`,
        title: 'Statutory Section 11/19 Notification Gazette Excerpt',
        type: 'Gazette Notification',
        uploadedDate: '2026-07-22',
        verifiedBy: 'Officer B',
        status: 'Verified',
        fileSize: '1.8 MB',
        referenceNo: `GAZ/DEMO/${t.id}/2026`,
      },
    ],
    auditTrail: [
      {
        id: `AUD-${t.id}-01`,
        timestamp: '2026-09-17 10:15 IST',
        officerName: 'Officer A',
        officerRole: 'Project Officer',
        action: 'Quarterly Milestone Sync',
        reason: 'Updated acquisition progress and ledger verification.',
      },
    ],
    actionItems: [
      {
        id: `ACT-${t.id}-01`,
        title: 'Address pending land parcel valuation discrepancies',
        recommendationSource: 'Stage-Wise Valuation Bottleneck',
        assignedOfficer: 'Officer A',
        assignedRole: 'Project Officer',
        dueDate: '2026-10-10',
        status: 'Open',
        priority: 'High',
        notes: 'Align compensation calculations with statutory multiplier.',
        createdDate: '2026-09-15',
      },
    ],
    historicalRiskTrend: [
      { date: '2026-05-10', riskScore: 35, delayProbability: 35, milestone: 'SIA Completed' },
      { date: '2026-07-15', riskScore: 45, delayProbability: 45, milestone: 'Preliminary Notification' },
      { date: '2026-09-17', riskScore: 0, delayProbability: 0, milestone: 'Current Assessment' },
    ],
  };

  const calcs = calculateProjectRisk(projectRaw);
  const trendWithCurrent = projectRaw.historicalRiskTrend.map((pt, idx) => {
    if (idx === projectRaw.historicalRiskTrend.length - 1) {
      return {
        ...pt,
        riskScore: calcs.riskScore,
        delayProbability: calcs.delayProbability,
      };
    }
    return pt;
  });

  generatedProjects.push({
    ...projectRaw,
    historicalRiskTrend: trendWithCurrent,
    riskScore: calcs.riskScore,
    delayProbability: calcs.delayProbability,
    riskLevel: calcs.riskLevel,
    topRiskFactors: calcs.topRiskFactors,
    positiveFactors: calcs.positiveFactors,
    stageRisks: calcs.stageRisks,
  });
});

// Seed up to 125 realistic projects using deterministic mulberry32 PRNG
let counter = 13;
for (let i = 0; i < 112; i++) {
  const stObj = statesPool[i % statesPool.length];
  const state = stObj.state;
  const district = stObj.districts[i % stObj.districts.length];
  const type = typesPool[i % typesPool.length];
  const agency = agenciesPool[i % agenciesPool.length];
  const stage = stagesPool[(i * 3 + 4) % stagesPool.length];

  const id = `PRJ-${state.substring(0, 2).toUpperCase()}-${String(counter).padStart(3, '0')}`;
  counter++;

  const landReq = Math.round(40 + (i * 17) % 650);
  const compTotal = Math.round(landReq * 0.95 + 15);
  // Spread risk levels deterministically
  const seed = (i * 37 + 13) % 100;
  let paidRatio = 0.85;
  let approvalDelay = 15;
  let legalCases = 0;
  let legalSeverity: Project['legalSeverity'] = 'Low';
  let rrProgress = 85;
  let possessionProgress = 88;

  if (seed > 75) {
    paidRatio = 0.35 + (seed % 15) / 100;
    approvalDelay = 95 + (seed % 80);
    legalCases = 3 + (seed % 6);
    legalSeverity = seed > 88 ? 'Critical' : 'High';
    rrProgress = 30 + (seed % 20);
    possessionProgress = 40 + (seed % 25);
  } else if (seed > 40) {
    paidRatio = 0.55 + (seed % 20) / 100;
    approvalDelay = 35 + (seed % 45);
    legalCases = 1 + (seed % 3);
    legalSeverity = 'Medium';
    rrProgress = 55 + (seed % 25);
    possessionProgress = 60 + (seed % 20);
  } else {
    paidRatio = 0.82 + (seed % 16) / 100;
    approvalDelay = 10 + (seed % 20);
    legalCases = 0;
    legalSeverity = 'Low';
    rrProgress = 85 + (seed % 15);
    possessionProgress = 85 + (seed % 15);
  }

  const compPaid = Math.round(compTotal * paidRatio);
  const compPending = compTotal - compPaid;
  const landAcquired = Math.round(landReq * (possessionProgress / 100));

  // Geocoordinates approximate jitter around state capitals / regional centers
  const baseCoords: Record<string, [number, number]> = {
    Maharashtra: [18.9, 74.2],
    'Uttar Pradesh': [26.8, 81.0],
    Gujarat: [22.8, 71.8],
    Karnataka: [13.8, 76.5],
    'Tamil Nadu': [11.5, 78.8],
    'Madhya Pradesh': [23.2, 77.4],
    Rajasthan: [26.5, 74.8],
    Odisha: [20.5, 84.8],
    Bihar: [25.6, 85.5],
    'Andhra Pradesh': [16.5, 80.6],
  };
  const base = baseCoords[state] || [21.0, 78.0];
  const lat = Number((base[0] + ((i * 19) % 300 - 150) / 100).toFixed(4));
  const lng = Number((base[1] + ((i * 23) % 300 - 150) / 100).toFixed(4));

  const verifStatus: Project['verificationStatus'] =
    seed > 80 ? 'PENDING' : seed > 70 ? 'CORRECTION_REQUESTED' : 'VERIFIED';

  const projectRaw: Omit<
    Project,
    'riskScore' | 'delayProbability' | 'riskLevel' | 'topRiskFactors' | 'positiveFactors' | 'stageRisks'
  > = {
    id,
    name: `Demo ${type} - Section ${((i % 7) + 1)} (${district})`,
    type,
    state,
    district,
    tehsil: `Tehsil-${((i % 5) + 1)}`,
    villages: [`Village-${((i % 10) + 1)}A`, `Village-${((i % 10) + 1)}B`],
    agency,
    landRequiredHectares: landReq,
    landAcquiredHectares: landAcquired,
    affectedFamilies: Math.round(landReq * 2.8),
    landownersCount: Math.round(landReq * 4.6),
    compensationTotalCr: compTotal,
    compensationPaidCr: compPaid,
    compensationPendingCr: compPending,
    approvalDelayDays: approvalDelay,
    legalDisputesCount: legalCases,
    legalSeverity,
    documentationCompletenessPct: Math.round(60 + (i % 38)),
    surveyProgressPct: Math.round(70 + (i % 30)),
    siaProgressPct: stage === 'Proposal' || stage === 'Survey' ? 50 : 100,
    notificationStatus: 'Gazetted',
    awardStatus: paidRatio > 0.6 ? 'Sanctioned' : 'Draft',
    rrProgressPct: rrProgress,
    possessionProgressPct: possessionProgress,
    stakeholderResponsiveness: legalCases > 2 ? 'Low' : 'Moderate',
    daysAtCurrentStage: Math.round(20 + (i * 7) % 110),
    historicalAgencyDelayMonths: Math.round(1 + (i % 9)),
    currentStage: stage,
    verificationStatus: verifStatus,
    lastUpdatedDate: '2026-09-16',
    coordinates: [lat, lng],
    evidenceDocuments: [
      {
        id: `EV-${id}-01`,
        title: 'Joint Measurement Survey Demarcation Certificate',
        type: 'Field Cadastral Plan',
        uploadedDate: '2026-08-15',
        verifiedBy: 'Officer A',
        status: verifStatus === 'VERIFIED' ? 'Verified' : 'Pending',
        fileSize: '2.8 MB',
        referenceNo: `JMS/DEMO/${id}/2026`,
      },
    ],
    auditTrail: [
      {
        id: `AUD-${id}-01`,
        timestamp: '2026-09-14 16:20 IST',
        officerName: 'Officer A',
        officerRole: 'Project Officer',
        action: 'Status Review',
        reason: 'Routine statutory progress logging.',
      },
    ],
    actionItems: [
      {
        id: `ACT-${id}-01`,
        title: 'Review title record discrepancies with sub-registrar',
        recommendationSource: 'System Early Warning',
        assignedOfficer: 'Officer B',
        assignedRole: 'Project Officer',
        dueDate: '2026-10-15',
        status: 'Open',
        priority: seed > 75 ? 'Urgent' : 'Medium',
        notes: 'Validate Khatauni/Jamabandi inheritance mutations.',
        createdDate: '2026-09-14',
      },
    ],
    historicalRiskTrend: [
      { date: '2026-05-01', riskScore: 30, delayProbability: 30, milestone: 'Stage Entry' },
      { date: '2026-07-15', riskScore: 45, delayProbability: 45, milestone: 'Mid-term Audit' },
      { date: '2026-09-16', riskScore: 0, delayProbability: 0, milestone: 'Latest Model Refresh' },
    ],
  };

  const calcs = calculateProjectRisk(projectRaw);
  const trendWithCurrent = projectRaw.historicalRiskTrend.map((pt, idx) => {
    if (idx === projectRaw.historicalRiskTrend.length - 1) {
      return {
        ...pt,
        riskScore: calcs.riskScore,
        delayProbability: calcs.delayProbability,
      };
    }
    return pt;
  });

  generatedProjects.push({
    ...projectRaw,
    historicalRiskTrend: trendWithCurrent,
    riskScore: calcs.riskScore,
    delayProbability: calcs.delayProbability,
    riskLevel: calcs.riskLevel,
    topRiskFactors: calcs.topRiskFactors,
    positiveFactors: calcs.positiveFactors,
    stageRisks: calcs.stageRisks,
  });
}

import { generateAlerts } from './alerts';

export const initialProjects: Project[] = generatedProjects;

export const initialAlerts: AlertNotification[] = generateAlerts(initialProjects);

