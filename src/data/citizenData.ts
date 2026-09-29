import { CitizenRecord } from '../types';

export interface SurroundingVillage {
  name: string;
  distanceKm: number;
  direction: string;
  gramPanchayat: string;
}

export interface LandUseBreakdown {
  category: string;
  percentage: number;
  description: string;
}

export interface SurroundingRoad {
  name: string;
  type: 'National Highway' | 'State Highway' | 'Major District Road' | 'Village Road';
  distanceMeters: number;
  status: string;
}

export interface WaterBody {
  name: string;
  type: 'Canal' | 'River' | 'Stream / Nala' | 'Well / Borewell';
  distanceMeters: number;
  impact: string;
}

export interface CriticalInfrastructure {
  name: string;
  agency: string;
  distanceMeters: number;
  clearanceStatus: string;
}

export interface AdjacentParcel {
  parcelNumber: string;
  ownerName: string;
  areaHa: number;
  status: string;
}

export interface SurroundingAreaInfo {
  nearbyVillages: SurroundingVillage[];
  landUse: LandUseBreakdown[];
  roads: SurroundingRoad[];
  waterBodies: WaterBody[];
  infrastructure: CriticalInfrastructure[];
  otherParcels: AdjacentParcel[];
}

export interface LandParcel {
  id: string; // e.g. PRCL-MH-PUN-0104
  parcelNumber: string; // e.g. Gat No. 104/2B or Survey No. 89/1
  landOwnerId: string; // Unique Citizen ID / Land Owner ID (e.g. CIT-001)
  ownerName: string;
  // SENSITIVE OWNER CONTACT DETAILS (Visible ONLY to officers as mandated)
  ownerPhone: string;
  ownerEmail: string;
  ownerAadhaarMasked: string;
  areaHectares: number;
  areaAcres: number;
  totalLandAreaHectares: number;
  acquiredLandAreaHectares: number;
  remainingLandAreaHectares: number;
  location: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  projectId: string;
  projectName: string;
  acquisitionStatus: string;
  stage: 'Proposal' | 'Survey' | 'SIA' | 'Notification' | 'Objections' | 'Valuation' | 'Award' | 'Compensation' | 'RR' | 'Possession' | 'Handover';
  noticeDetails: {
    sec11NoticeNo: string;
    sec11Date: string;
    sec19NoticeNo: string;
    sec19Date: string;
    awardNoticeDate: string;
    gazetteRef: string;
    slaoOffice: string;
  };
  compensationSanctionedLakhs: number;
  compensationPaidLakhs: number;
  expectedAmountPayableLakhs: number;
  possessionStatus: 'Pending' | 'In Progress' | 'Completed';
  handoverStatus: 'Pending' | 'In Progress' | 'Completed';
  polygonCoordinates: [number, number][]; // Leaflet LatLng tuples
  centerCoordinates: [number, number];
  color: string;
  surroundingData: SurroundingAreaInfo;
}

export interface ProjectCorridor {
  id: string;
  projectId: string;
  projectName: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  totalAreaHa: number;
  rowWidthMeters: number;
  acquisitionStage: string;
  status: string;
  centerlineCoordinates: [number, number][];
  rowPolygonCoordinates: [number, number][];
}

export const sampleProjectCorridors: ProjectCorridor[] = [
  {
    id: 'CORR-MH-PUN-001',
    projectId: 'PRJ-EXP-2026-001',
    projectName: 'Pune-Bengaluru Industrial Expressway (Ch. 24+100 to 25+800)',
    village: 'Uruli Kanchan',
    taluka: 'Haveli',
    district: 'Pune',
    state: 'Maharashtra',
    totalAreaHa: 18.5,
    rowWidthMeters: 60,
    acquisitionStage: 'Gazetted RoW Alignment under Section 19',
    status: 'Static Project Corridor & Demarcated Right-of-Way (RoW)',
    centerlineCoordinates: [
      [18.4950, 74.1390],
      [18.4918, 74.1402],
      [18.4880, 74.1392],
      [18.4845, 74.1412],
      [18.4815, 74.1428],
      [18.4775, 74.1445],
    ],
    rowPolygonCoordinates: [
      [18.4955, 74.1375],
      [18.4922, 74.1388],
      [18.4885, 74.1378],
      [18.4850, 74.1398],
      [18.4818, 74.1412],
      [18.4772, 74.1432],
      [18.4778, 74.1458],
      [18.4812, 74.1445],
      [18.4840, 74.1428],
      [18.4875, 74.1408],
      [18.4914, 74.1418],
      [18.4945, 74.1405],
    ],
  },
  {
    id: 'CORR-GJ-AHM-004',
    projectId: 'PRJ-CORR-2026-004',
    projectName: 'Delhi-Mumbai Industrial Corridor (DMIC) Logistics Node',
    village: 'Sanand Rural',
    taluka: 'Sanand',
    district: 'Ahmedabad',
    state: 'Gujarat',
    totalAreaHa: 24.0,
    rowWidthMeters: 45,
    acquisitionStage: 'Preliminary Notification Feeder Alignment',
    status: 'Static Freight Corridor & Industrial RoW Boundary',
    centerlineCoordinates: [
      [22.9810, 72.3720],
      [22.9838, 72.3755],
      [22.9870, 72.3800],
      [22.9905, 72.3845],
    ],
    rowPolygonCoordinates: [
      [22.9825, 72.3710],
      [22.9852, 72.3745],
      [22.9885, 72.3790],
      [22.9918, 72.3835],
      [22.9892, 72.3855],
      [22.9858, 72.3810],
      [22.9825, 72.3765],
      [22.9798, 72.3730],
    ],
  },
  {
    id: 'CORR-UP-NOI-003',
    projectId: 'PRJ-AIR-2026-003',
    projectName: 'Noida International Airport (Jewar) Multi-Modal Cargo Link',
    village: 'Rohillapur',
    taluka: 'Jewar',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    totalAreaHa: 16.2,
    rowWidthMeters: 50,
    acquisitionStage: 'Cargo Expressway Statutory RoW',
    status: 'Static Dedicated Multi-Modal Link RoW Footprint',
    centerlineCoordinates: [
      [28.1690, 77.5815],
      [28.1730, 77.5860],
      [28.1775, 77.5905],
      [28.1820, 77.5950],
    ],
    rowPolygonCoordinates: [
      [28.1705, 77.5800],
      [28.1745, 77.5848],
      [28.1790, 77.5892],
      [28.1835, 77.5938],
      [28.1805, 77.5962],
      [28.1760, 77.5918],
      [28.1715, 77.5872],
      [28.1675, 77.5830],
    ],
  },
];

export const sampleLandParcels: LandParcel[] = [
  {
    id: 'PRCL-MH-PUN-0104',
    parcelNumber: 'Gat No. 104/2B',
    landOwnerId: 'CIT-001',
    ownerName: 'Shri Vithal Ganpat Deshmukh',
    ownerPhone: '+91 98220 44192',
    ownerEmail: 'vithal.deshmukh@gmail.com',
    ownerAadhaarMasked: 'XXXX-XXXX-4912',
    areaHectares: 1.45,
    areaAcres: 3.58,
    totalLandAreaHectares: 1.85,
    acquiredLandAreaHectares: 1.45,
    remainingLandAreaHectares: 0.40,
    location: 'Uruli Kanchan, Taluka Haveli, District Pune, Maharashtra',
    village: 'Uruli Kanchan',
    taluka: 'Haveli',
    district: 'Pune',
    state: 'Maharashtra',
    projectId: 'PRJ-EXP-2026-001',
    projectName: 'Pune-Bengaluru Industrial Expressway (Ch. 24+100 to 25+800)',
    acquisitionStatus: 'Section 19 Declaration Published — Award Valuation in Progress',
    stage: 'Valuation',
    noticeDetails: {
      sec11NoticeNo: 'MAH-PUN-LA-2025/11/402',
      sec11Date: '12-Nov-2025',
      sec19NoticeNo: 'MAH-PUN-LA-2026/19/088',
      sec19Date: '18-Feb-2026',
      awardNoticeDate: 'Scheduled: 15-May-2026',
      gazetteRef: 'Maharashtra Extraordinary Gazette Part-I No. 204/2026',
      slaoOffice: 'Special Land Acquisition Officer (SLARO) Haveli, Collectorate Pune',
    },
    compensationSanctionedLakhs: 82.50,
    compensationPaidLakhs: 41.25,
    expectedAmountPayableLakhs: 41.25,
    possessionStatus: 'In Progress',
    handoverStatus: 'Pending',
    polygonCoordinates: [
      [18.4875, 74.1350],
      [18.4905, 74.1385],
      [18.4870, 74.1420],
      [18.4835, 74.1375],
    ],
    centerCoordinates: [18.4871, 74.1382],
    color: '#EA580C', // Orange (Active / Valuation stage)
    surroundingData: {
      nearbyVillages: [
        { name: 'Uruli Kanchan (Gaothan)', distanceKm: 1.2, direction: 'South-West', gramPanchayat: 'Uruli Kanchan GP' },
        { name: 'Koregaon Mul', distanceKm: 2.8, direction: 'North', gramPanchayat: 'Koregaon Mul GP' },
        { name: 'Theur (Cane Mill Area)', distanceKm: 4.1, direction: 'West', gramPanchayat: 'Theur GP' },
      ],
      landUse: [
        { category: 'Perennially Irrigated Sugarcane', percentage: 65, description: 'Lift-irrigated farmland with active drip infrastructure' },
        { category: 'Fallow / Seasonal Crops (Jowar/Gram)', percentage: 22, description: 'Rainfed parcel on secondary terrace' },
        { category: 'Farmstead & Agro-Storage Structure', percentage: 13, description: 'Constructed brick godown & solar pump set' },
      ],
      roads: [
        { name: 'Pune-Solapur Highway (NH-65)', type: 'National Highway', distanceMeters: 450, status: 'Direct access via tar approach road' },
        { name: 'Uruli-Sortapwadi District Road (MDR-32)', type: 'Major District Road', distanceMeters: 120, status: 'Existing 2-lane bituminous road' },
        { name: 'Field Access Cart Track (Pandhan Road)', type: 'Village Road', distanceMeters: 0, status: 'Bordering southern boundary' },
      ],
      waterBodies: [
        { name: 'Mula-Mutha Left Bank Distributary Canal No. 4', type: 'Canal', distanceMeters: 380, impact: 'Irrigation siphon cross-drainage mandated' },
        { name: 'Community Irrigation Dug Well (Depth 42 ft)', type: 'Well / Borewell', distanceMeters: 65, impact: 'Valued separately in award tree inventory' },
      ],
      infrastructure: [
        { name: '33kV MSEDCL Hadapsar-Uruli Transmission Line', agency: 'MSEDCL', distanceMeters: 140, clearanceStatus: 'Tower shifting estimate sanctioned' },
        { name: 'GAIL Cross-Country Gas Pipeline Buffer', agency: 'GAIL India', distanceMeters: 920, clearanceStatus: 'Beyond mandatory 500m safety corridor' },
      ],
      otherParcels: [
        { parcelNumber: 'Gat No. 104/1', ownerName: 'Shri Baban R. Deshmukh', areaHa: 0.95, status: 'Compensation 100% Disbursed' },
        { parcelNumber: 'Gat No. 105/2', ownerName: 'Smt. Kamalabai S. Jagtap', areaHa: 1.80, status: 'Section 15 Objections Disposed' },
        { parcelNumber: 'Gat No. 108/3', ownerName: 'Smt. Savitribai K. Jadhav', areaHa: 2.10, status: 'Joint Demarcation Survey Underway' },
      ],
    },
  },
  {
    id: 'PRCL-MH-PUN-0106',
    parcelNumber: 'Gat No. 106/1B',
    landOwnerId: 'CIT-001',
    ownerName: 'Shri Vithal Ganpat Deshmukh',
    ownerPhone: '+91 98220 44192',
    ownerEmail: 'vithal.deshmukh@gmail.com',
    ownerAadhaarMasked: 'XXXX-XXXX-4912',
    areaHectares: 0.65,
    areaAcres: 1.61,
    totalLandAreaHectares: 0.80,
    acquiredLandAreaHectares: 0.65,
    remainingLandAreaHectares: 0.15,
    location: 'Uruli Kanchan, Taluka Haveli, District Pune, Maharashtra',
    village: 'Uruli Kanchan',
    taluka: 'Haveli',
    district: 'Pune',
    state: 'Maharashtra',
    projectId: 'PRJ-EXP-2026-001',
    projectName: 'Pune-Bengaluru Industrial Expressway (Ch. 24+100 to 25+800)',
    acquisitionStatus: 'Section 11 Preliminary Notification Gazetted — Joint Measurement Survey Ongoing',
    stage: 'Survey',
    noticeDetails: {
      sec11NoticeNo: 'MAH-PUN-LA-2025/11/402',
      sec11Date: '12-Nov-2025',
      sec19NoticeNo: 'Pending Section 15 Hearing',
      sec19Date: 'Expected: Jul-2026',
      awardNoticeDate: 'Scheduled: Dec-2026',
      gazetteRef: 'Maharashtra Extraordinary Gazette Part-I No. 204/2026',
      slaoOffice: 'Special Land Acquisition Officer (SLARO) Haveli, Collectorate Pune',
    },
    compensationSanctionedLakhs: 36.50,
    compensationPaidLakhs: 0.00,
    expectedAmountPayableLakhs: 36.50,
    possessionStatus: 'Pending',
    handoverStatus: 'Pending',
    polygonCoordinates: [
      [18.4920, 74.1355],
      [18.4950, 74.1390],
      [18.4925, 74.1425],
      [18.4895, 74.1390],
    ],
    centerCoordinates: [18.4922, 74.1390],
    color: '#EA580C', // Orange (Active / Survey stage)
    surroundingData: {
      nearbyVillages: [
        { name: 'Uruli Kanchan', distanceKm: 1.4, direction: 'South', gramPanchayat: 'Uruli Kanchan GP' },
      ],
      landUse: [
        { category: 'Seasonal Onion & Vegetable Farmland', percentage: 70, description: 'Irrigated plot with tubewell access' },
        { category: 'Agro Storage Godown', percentage: 30, description: 'Permanent brick structure' },
      ],
      roads: [
        { name: 'Uruli Village Connecting Tar Road', type: 'Village Road', distanceMeters: 40, status: 'Single-lane paved road' },
      ],
      waterBodies: [
        { name: 'Sub-Distributary Irrigation Canal', type: 'Canal', distanceMeters: 150, impact: 'Culvert planned' },
      ],
      infrastructure: [
        { name: 'MSEDCL Rural Feeder Line', agency: 'MSEDCL', distanceMeters: 80, clearanceStatus: 'In progress' },
      ],
      otherParcels: [
        { parcelNumber: 'Gat No. 104/2B', ownerName: 'Shri Vithal Ganpat Deshmukh', areaHa: 1.45, status: 'Valuation Stage' },
      ],
    },
  },
  {
    id: 'PRCL-MH-PUN-0105',
    parcelNumber: 'Gat No. 105/1A',
    landOwnerId: 'CIT-003',
    ownerName: 'Smt. Kamalabai Shankar Jagtap',
    ownerPhone: '+91 97654 32188',
    ownerEmail: 'kamala.jagtap@rediffmail.com',
    ownerAadhaarMasked: 'XXXX-XXXX-8821',
    areaHectares: 0.82,
    areaAcres: 2.03,
    totalLandAreaHectares: 0.82,
    acquiredLandAreaHectares: 0.82,
    remainingLandAreaHectares: 0.00,
    location: 'Uruli Kanchan, Taluka Haveli, District Pune, Maharashtra',
    village: 'Uruli Kanchan',
    taluka: 'Haveli',
    district: 'Pune',
    state: 'Maharashtra',
    projectId: 'PRJ-EXP-2026-001',
    projectName: 'Pune-Bengaluru Industrial Expressway',
    acquisitionStatus: 'Compensation 100% Disbursed — Physical Possession Handed Over',
    stage: 'Handover',
    noticeDetails: {
      sec11NoticeNo: 'MAH-PUN-LA-2025/11/402',
      sec11Date: '12-Nov-2025',
      sec19NoticeNo: 'MAH-PUN-LA-2026/19/088',
      sec19Date: '18-Feb-2026',
      awardNoticeDate: 'Award Declared: 05-Apr-2026',
      gazetteRef: 'Maharashtra Extraordinary Gazette Part-I No. 204/2026',
      slaoOffice: 'Special Land Acquisition Officer (SLARO) Haveli, Collectorate Pune',
    },
    compensationSanctionedLakhs: 48.60,
    compensationPaidLakhs: 48.60,
    expectedAmountPayableLakhs: 0.00,
    possessionStatus: 'Completed',
    handoverStatus: 'Completed',
    polygonCoordinates: [
      [18.4905, 74.1385],
      [18.4935, 74.1415],
      [18.4900, 74.1445],
      [18.4870, 74.1420],
    ],
    centerCoordinates: [18.4902, 74.1416],
    color: '#16A34A', // Green (Completed / Handover)
    surroundingData: {
      nearbyVillages: [
        { name: 'Uruli Kanchan', distanceKm: 1.5, direction: 'South', gramPanchayat: 'Uruli Kanchan GP' },
        { name: 'Koregaon Mul', distanceKm: 2.3, direction: 'North-East', gramPanchayat: 'Koregaon Mul GP' },
      ],
      landUse: [
        { category: 'Acquired RoW Construction Strip', percentage: 90, description: 'Demarcated Right of Way boundary with chainlink fencing' },
        { category: 'Service Road Buffer', percentage: 10, description: 'Grade-separated access apron' },
      ],
      roads: [
        { name: 'NH-65 Highway Connector', type: 'National Highway', distanceMeters: 300, status: 'Direct interchange access' },
      ],
      waterBodies: [
        { name: 'Natural Surface Nala Ch. 24+450', type: 'Stream / Nala', distanceMeters: 40, impact: 'RCC Box Culvert 4.0m span under construction' },
      ],
      infrastructure: [
        { name: 'Optical Fiber Cable (OFC) Trunk', agency: 'BSNL / BharatNet', distanceMeters: 25, clearanceStatus: 'Utility shift completed' },
      ],
      otherParcels: [
        { parcelNumber: 'Gat No. 104/2B', ownerName: 'Shri Vithal G. Deshmukh', areaHa: 1.45, status: 'Award Valuation in Progress' },
        { parcelNumber: 'Gat No. 106/1', ownerName: 'Shri Pandurang T. Bhosale', areaHa: 1.10, status: 'Possession Complete' },
      ],
    },
  },
  {
    id: 'PRCL-MH-PUN-0108',
    parcelNumber: 'Gat No. 108/3',
    landOwnerId: 'CIT-006',
    ownerName: 'Smt. Savitribai Kisan Jadhav',
    ownerPhone: '+91 98901 23456',
    ownerEmail: 'savitri.jadhav@gmail.com',
    ownerAadhaarMasked: 'XXXX-XXXX-3341',
    areaHectares: 2.10,
    areaAcres: 5.18,
    totalLandAreaHectares: 2.50,
    acquiredLandAreaHectares: 2.10,
    remainingLandAreaHectares: 0.40,
    location: 'Uruli Kanchan, Taluka Haveli, District Pune, Maharashtra',
    village: 'Uruli Kanchan',
    taluka: 'Haveli',
    district: 'Pune',
    state: 'Maharashtra',
    projectId: 'PRJ-EXP-2026-001',
    projectName: 'Pune-Bengaluru Industrial Expressway',
    acquisitionStatus: 'Section 15 Objection Filed — High Court Interim Stay Order Active',
    stage: 'Objections',
    noticeDetails: {
      sec11NoticeNo: 'MAH-PUN-LA-2025/11/402',
      sec11Date: '12-Nov-2025',
      sec19NoticeNo: 'Stayed Pending Summary Hearing',
      sec19Date: 'Hearing: 18-Oct-2026',
      awardNoticeDate: 'Delayed: Subject to Stay Vacation',
      gazetteRef: 'Maharashtra Extraordinary Gazette Part-I No. 204/2026',
      slaoOffice: 'Special Land Acquisition Officer (SLARO) Haveli, Collectorate Pune',
    },
    compensationSanctionedLakhs: 110.00,
    compensationPaidLakhs: 0.00,
    expectedAmountPayableLakhs: 110.00,
    possessionStatus: 'Pending',
    handoverStatus: 'Pending',
    polygonCoordinates: [
      [18.4835, 74.1375],
      [18.4870, 74.1420],
      [18.4840, 74.1455],
      [18.4805, 74.1405],
    ],
    centerCoordinates: [18.4838, 74.1415],
    color: '#DC2626', // Red (Delayed / High Risk)
    surroundingData: {
      nearbyVillages: [
        { name: 'Uruli Kanchan', distanceKm: 1.0, direction: 'South', gramPanchayat: 'Uruli Kanchan GP' },
      ],
      landUse: [
        { category: 'Disputed Farmland (Horticulture/Pomegranate)', percentage: 85, description: 'Under court-ordered status quo' },
        { category: 'Borewell & Drip Shed', percentage: 15, description: 'Survey demarcation contested' },
      ],
      roads: [
        { name: 'Uruli Approach MDR-32', type: 'Major District Road', distanceMeters: 80, status: '2-lane asphalt road' },
      ],
      waterBodies: [
        { name: 'Community Irrigation Canal', type: 'Canal', distanceMeters: 250, impact: 'Canal crossing alignment' },
      ],
      infrastructure: [
        { name: 'MSEDCL 11kV Rural Feeder', agency: 'MSEDCL', distanceMeters: 60, clearanceStatus: 'Clearance withheld' },
      ],
      otherParcels: [
        { parcelNumber: 'Gat No. 104/2B', ownerName: 'Shri Vithal G. Deshmukh', areaHa: 1.45, status: 'Award Valuation' },
      ],
    },
  },
  {
    id: 'PRCL-GJ-AHM-0045',
    parcelNumber: 'Survey No. 45/1',
    landOwnerId: 'CIT-004',
    ownerName: 'Shri Ashok Narayan Kulkarni',
    ownerPhone: '+91 94231 56780',
    ownerEmail: 'ashok.kulkarni@yahoo.co.in',
    ownerAadhaarMasked: 'XXXX-XXXX-6510',
    areaHectares: 2.15,
    areaAcres: 5.31,
    totalLandAreaHectares: 2.50,
    acquiredLandAreaHectares: 2.15,
    remainingLandAreaHectares: 0.35,
    location: 'Sanand Taluka, District Ahmedabad, Gujarat',
    village: 'Sanand Rural',
    taluka: 'Sanand',
    district: 'Ahmedabad',
    state: 'Gujarat',
    projectId: 'PRJ-CORR-2026-004',
    projectName: 'Delhi-Mumbai Industrial Corridor (DMIC) Logistics Node',
    acquisitionStatus: 'Section 11 Preliminary Notification Issued — Joint Survey in Progress',
    stage: 'Survey',
    noticeDetails: {
      sec11NoticeNo: 'GUJ-AHM-LA-2026/11/014',
      sec11Date: '10-Jan-2026',
      sec19NoticeNo: 'Pending Section 15 Hearing',
      sec19Date: 'Expected: Jun-2026',
      awardNoticeDate: 'Expected: Nov-2026',
      gazetteRef: 'Gujarat Government Gazette Extraordinary No. 45/2026',
      slaoOffice: 'Special Land Acquisition Officer, DMIC Project Cell Ahmedabad',
    },
    compensationSanctionedLakhs: 135.00,
    compensationPaidLakhs: 0.00,
    expectedAmountPayableLakhs: 135.00,
    possessionStatus: 'Pending',
    handoverStatus: 'Pending',
    polygonCoordinates: [
      [22.9850, 72.3750],
      [22.9890, 72.3780],
      [22.9860, 72.3830],
      [22.9820, 72.3800],
    ],
    centerCoordinates: [22.9855, 72.3790],
    color: '#EA580C', // Orange (Active / Survey stage)
    surroundingData: {
      nearbyVillages: [
        { name: 'Sanand Municipality Limit', distanceKm: 2.4, direction: 'East', gramPanchayat: 'Sanand Nagarpalika' },
        { name: 'Nidhrad Village', distanceKm: 3.1, direction: 'North-West', gramPanchayat: 'Nidhrad GP' },
      ],
      landUse: [
        { category: 'Dry-crop Semi-Arid Land (Cotton / Wheat)', percentage: 80, description: 'Seasonal single-crop agricultural holding' },
        { category: 'Uncultivated Scrub Border', percentage: 20, description: 'Natural boundary hedge & farm boundary' },
      ],
      roads: [
        { name: 'Ahmedabad-Sanand State Highway SH-17', type: 'State Highway', distanceMeters: 600, status: '4-lane divided corridor' },
        { name: 'GIDC Industrial Arterial Ring Road', type: 'Major District Road', distanceMeters: 180, status: 'Asphalt 2-lane heavy vehicle road' },
      ],
      waterBodies: [
        { name: 'Narmada Canal Sanand Branch', type: 'Canal', distanceMeters: 850, impact: 'No direct canal bed interference' },
      ],
      infrastructure: [
        { name: 'GETCO 66kV Sub-Station Sanand', agency: 'GETCO Gujarat', distanceMeters: 550, clearanceStatus: 'Under review' },
      ],
      otherParcels: [
        { parcelNumber: 'Survey No. 44/2', ownerName: 'Shri Pravinbhai Patel', areaHa: 1.75, status: 'Joint Survey Complete' },
        { parcelNumber: 'Survey No. 46', ownerName: 'Smt. Shantaben Parmar', areaHa: 3.10, status: 'Notice Delivered' },
      ],
    },
  },
  {
    id: 'PRCL-UP-NOI-0312',
    parcelNumber: 'Khasra No. 312/1',
    landOwnerId: 'CIT-005',
    ownerName: 'Shri Rameshwar Lal Meena',
    ownerPhone: '+91 98290 12345',
    ownerEmail: 'rameshwar.meena@gmail.com',
    ownerAadhaarMasked: 'XXXX-XXXX-9901',
    areaHectares: 1.10,
    areaAcres: 2.72,
    totalLandAreaHectares: 1.50,
    acquiredLandAreaHectares: 1.10,
    remainingLandAreaHectares: 0.40,
    location: 'Jewar Sub-Division, Gautam Buddha Nagar, Uttar Pradesh',
    village: 'Rohillapur',
    taluka: 'Jewar',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    projectId: 'PRJ-AIR-2026-003',
    projectName: 'Noida International Airport (Jewar) Multi-Modal Cargo Link',
    acquisitionStatus: 'Section 23 Award Announced — R&R Resettlement Package in Execution',
    stage: 'Compensation',
    noticeDetails: {
      sec11NoticeNo: 'UP-GBN-LA-2025/11/189',
      sec11Date: '24-May-2025',
      sec19NoticeNo: 'UP-GBN-LA-2025/19/310',
      sec19Date: '15-Oct-2025',
      awardNoticeDate: 'Award Notice: 12-Jan-2026',
      gazetteRef: 'Uttar Pradesh Rajpatra No. 512/2025',
      slaoOffice: 'Additional District Magistrate (LA) Jewar Airport Cell',
    },
    compensationSanctionedLakhs: 165.00,
    compensationPaidLakhs: 132.00,
    expectedAmountPayableLakhs: 33.00,
    possessionStatus: 'In Progress',
    handoverStatus: 'Pending',
    polygonCoordinates: [
      [28.1750, 77.5850],
      [28.1790, 77.5880],
      [28.1760, 77.5920],
      [28.1720, 77.5890],
    ],
    centerCoordinates: [28.1755, 77.5885],
    color: '#EA580C', // Orange (Active / Compensation stage)
    surroundingData: {
      nearbyVillages: [
        { name: 'Rohillapur Village Gaothan', distanceKm: 0.8, direction: 'North', gramPanchayat: 'Rohillapur GP' },
        { name: 'Dayanatpur', distanceKm: 2.1, direction: 'South-East', gramPanchayat: 'Dayanatpur GP' },
      ],
      landUse: [
        { category: 'Wheat & Mustard Agricultural Plots', percentage: 70, description: 'Tubewell irrigated alluvial soil' },
        { category: 'Settlement Habitation Periphery', percentage: 30, description: 'Residential abadi boundary with pakka houses' },
      ],
      roads: [
        { name: 'Yamuna Expressway (YEIDA)', type: 'National Highway', distanceMeters: 750, status: '6-lane access controlled tollway' },
        { name: 'Airport Cargo Terminal Service Corridor', type: 'Major District Road', distanceMeters: 50, status: 'Under formation' },
      ],
      waterBodies: [
        { name: 'Bhakra Distributary Feeder', type: 'Canal', distanceMeters: 450, impact: 'Culvert designed for stormwater run-off' },
      ],
      infrastructure: [
        { name: 'UPPTCL 400kV Substation Jewar', agency: 'UPPTCL', distanceMeters: 800, clearanceStatus: 'Sanctioned' },
        { name: 'Dedicated Freight Corridor (DFC) Railway Spur', agency: 'DFCCIL', distanceMeters: 1200, clearanceStatus: 'Under construction' },
      ],
      otherParcels: [
        { parcelNumber: 'Khasra No. 312/2', ownerName: 'Shri Ramavatar Sharma', areaHa: 0.85, status: 'R&R Plot Allotted' },
        { parcelNumber: 'Khasra No. 313', ownerName: 'Smt. Geeta Devi', areaHa: 1.40, status: 'Compensation 100% Paid' },
      ],
    },
  },
];

export const sampleCitizens: CitizenRecord[] = [
  {
    citizenId: 'CIT-001',
    fullName: 'Shri Vithal Ganpat Deshmukh',
    mobileNumber: '+91 98220 44192',
    email: 'vithal.deshmukh@gmail.com',
    address: 'House No. 42, Bazar Peth, Uruli Kanchan, Taluka Haveli',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Haveli',
    village: 'Uruli Kanchan',
    parcelNumber: 'Gat No. 104/2B, 106/1B',
    projectId: 'PRJ-EXP-2026-001',
    projectName: 'Pune-Bengaluru Industrial Expressway',
    verificationStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    registrationDate: '2026-01-15',
    maskedAadhaar: 'XXXX-XXXX-4912',
  },
  {
    citizenId: 'CIT-002',
    fullName: 'Shri Rahul Kumar Sharma',
    mobileNumber: '+91 98111 22334',
    email: 'rahul.sharma@gmail.com',
    address: 'A-12, Sector 4, Koregaon Park, Pune',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Haveli',
    village: 'Uruli Kanchan',
    projectId: 'PRJ-EXP-2026-001',
    projectName: 'Pune-Bengaluru Industrial Expressway',
    verificationStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    registrationDate: '2026-03-10',
    maskedAadhaar: 'XXXX-XXXX-1134',
  },
  {
    citizenId: 'CIT-003',
    fullName: 'Smt. Kamalabai Shankar Jagtap',
    mobileNumber: '+91 97654 32188',
    email: 'kamala.jagtap@rediffmail.com',
    address: 'Near Old Gram Panchayat, Uruli Kanchan',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Haveli',
    village: 'Uruli Kanchan',
    parcelNumber: 'Gat No. 105/1A',
    projectId: 'PRJ-EXP-2026-001',
    projectName: 'Pune-Bengaluru Industrial Expressway',
    verificationStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    registrationDate: '2026-01-18',
    maskedAadhaar: 'XXXX-XXXX-8821',
  },
  {
    citizenId: 'CIT-004',
    fullName: 'Shri Ashok Narayan Kulkarni',
    mobileNumber: '+91 94231 56780',
    email: 'ashok.kulkarni@yahoo.co.in',
    address: 'Farm House No. 8, Sanand Rural',
    state: 'Gujarat',
    district: 'Ahmedabad',
    taluka: 'Sanand',
    village: 'Sanand Rural',
    parcelNumber: 'Survey No. 45/1',
    projectId: 'PRJ-CORR-2026-004',
    projectName: 'Delhi-Mumbai Industrial Corridor (DMIC)',
    verificationStatus: 'VERIFIED',
    accountStatus: 'ACTIVE',
    registrationDate: '2026-02-01',
    maskedAadhaar: 'XXXX-XXXX-6510',
  },
  {
    citizenId: 'CIT-005',
    fullName: 'Shri Rameshwar Lal Meena',
    mobileNumber: '+91 98290 12345',
    email: 'rameshwar.meena@gmail.com',
    address: 'Village Abadi, Rohillapur, Jewar',
    state: 'Uttar Pradesh',
    district: 'Gautam Buddha Nagar',
    taluka: 'Jewar',
    village: 'Rohillapur',
    parcelNumber: 'Khasra No. 312/1',
    projectId: 'PRJ-AIR-2026-003',
    projectName: 'Noida International Airport Cargo Link',
    verificationStatus: 'PENDING',
    accountStatus: 'ACTIVE',
    registrationDate: '2026-02-20',
    maskedAadhaar: 'XXXX-XXXX-9942',
  },
];

export function getCitizenById(citizenId: string): CitizenRecord | null {
  return sampleCitizens.find((c) => c.citizenId === citizenId) || null;
}

export function getParcelsByLandOwnerId(landOwnerId: string): LandParcel[] {
  return sampleLandParcels.filter((p) => p.landOwnerId === landOwnerId);
}

export function getParcelById(id: string): LandParcel | null {
  return sampleLandParcels.find((p) => p.id === id) || null;
}

export function searchParcels(query: string): LandParcel[] {
  const q = query.trim().toLowerCase();
  if (!q) return sampleLandParcels;
  return sampleLandParcels.filter(
    (p) =>
      p.parcelNumber.toLowerCase().includes(q) ||
      p.ownerName.toLowerCase().includes(q) ||
      p.village.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
  );
}

export function getCorridorByProjectId(projectId: string): ProjectCorridor | null {
  return sampleProjectCorridors.find((c) => c.projectId === projectId) || null;
}

export interface ProjectMilestone {
  stage: string;
  milestone: string;
  status: 'Completed' | 'In Progress' | 'Upcoming';
  targetDate: string;
}

export interface ProjectOverviewInfo {
  projectId: string;
  projectName: string;
  location: string;
  projectPurpose: string;
  currentStage: string;
  overallProgressPct: number;
  timelineMilestones: ProjectMilestone[];
  projectedCompletion: string;
  generalAcquisitionStatus: string;
  totalLandRequiredHa: number;
  totalLandAcquiredHa: number;
  totalVillagesAffected: number;
  executingAgency: string;
}

export const sampleProjectOverviews: Record<string, ProjectOverviewInfo> = {
  'PRJ-EXP-2026-001': {
    projectId: 'PRJ-EXP-2026-001',
    projectName: 'Pune-Bengaluru Industrial Expressway (Ch. 24+100 to 25+800)',
    location: 'Uruli Kanchan, Taluka Haveli, District Pune, Maharashtra',
    projectPurpose:
      'Construction of an 8-lane access-controlled greenfield industrial expressway corridor to link major manufacturing and warehousing clusters between Pune and Bengaluru, reducing commercial logistics transit times by 45% and decongesting regional highway networks.',
    currentStage: 'Award Valuation & Section 19 Declarations',
    overallProgressPct: 68,
    timelineMilestones: [
      { stage: 'Stage 1: Proposal & SIA', milestone: 'Social Impact Assessment & Public Hearing', status: 'Completed', targetDate: 'Aug 2025' },
      { stage: 'Stage 2: Section 11', milestone: 'Preliminary Acquisition Notification Gazetted', status: 'Completed', targetDate: 'Nov 2025' },
      { stage: 'Stage 3: Section 15', milestone: 'Summary Disposal of Statutory Objections', status: 'Completed', targetDate: 'Jan 2026' },
      { stage: 'Stage 4: Section 19', milestone: 'Final Declaration of Public Purpose Published', status: 'Completed', targetDate: 'Feb 2026' },
      { stage: 'Stage 5: Valuation', milestone: 'Joint Award Valuation & Compensation Determination', status: 'In Progress', targetDate: 'May 2026' },
      { stage: 'Stage 6: DBT Release', milestone: 'Direct Benefit Transfer (DBT) Treasury Payouts', status: 'In Progress', targetDate: 'Aug 2026' },
      { stage: 'Stage 7: Possession', milestone: 'Panchnama Possession & Civil Corridor Handover', status: 'Upcoming', targetDate: 'Dec 2026' },
    ],
    projectedCompletion: 'Civil Handover: Dec 2026 • Commercial Highway Commissioning: March 2028',
    generalAcquisitionStatus:
      'Statutory acquisition proceeding under the RFCTLARR Act 2013 read with the National Highways Act, 1956. Section 19 gazette declaration active across 14 revenue villages in Haveli tehsil. Total compensation determined under Section 26-30 statutory formula with 100% solatium and 12% additional market value interest.',
    totalLandRequiredHa: 142.8,
    totalLandAcquiredHa: 97.1,
    totalVillagesAffected: 14,
    executingAgency: 'National Highways Authority of India (NHAI PIU Pune) & Revenue Dept Maharashtra',
  },
  'PRJ-CORR-2026-004': {
    projectId: 'PRJ-CORR-2026-004',
    projectName: 'Delhi-Mumbai Industrial Corridor (DMIC) Logistics Node',
    location: 'Sanand Rural, Taluka Sanand, District Ahmedabad, Gujarat',
    projectPurpose:
      'Establishment of an integrated multi-modal logistics hub and freight feeder corridor linking Western Dedicated Freight Corridor with Sanand industrial automobile manufacturing zone.',
    currentStage: 'Joint Measurement Cadastral Survey & Section 11 Notification',
    overallProgressPct: 42,
    timelineMilestones: [
      { stage: 'Stage 1: Proposal & SIA', milestone: 'Feasibility & Environmental Clearances', status: 'Completed', targetDate: 'Oct 2025' },
      { stage: 'Stage 2: Section 11', milestone: 'Preliminary Notification Gazetted', status: 'Completed', targetDate: 'Jan 2026' },
      { stage: 'Stage 3: Section 15', milestone: 'Public Hearing on Claims & Objections', status: 'In Progress', targetDate: 'Jun 2026' },
      { stage: 'Stage 4: Section 19', milestone: 'Final Statutory Declaration', status: 'Upcoming', targetDate: 'Sep 2026' },
      { stage: 'Stage 5: Award', milestone: 'Award Valuation & Solatium Approval', status: 'Upcoming', targetDate: 'Nov 2026' },
    ],
    projectedCompletion: 'Corridor Handover: Mid 2027 • Logistics Hub Operations: Late 2028',
    generalAcquisitionStatus:
      'Preliminary notifications issued for 8 villages in Sanand taluka. Ground cadastral verification and tree/structure asset inventories currently underway.',
    totalLandRequiredHa: 98.4,
    totalLandAcquiredHa: 41.3,
    totalVillagesAffected: 8,
    executingAgency: 'Gujarat Industrial Development Corporation (GIDC) & DMICDC',
  },
  'PRJ-AIR-2026-003': {
    projectId: 'PRJ-AIR-2026-003',
    projectName: 'Noida International Airport (Jewar) Multi-Modal Cargo Link',
    location: 'Rohillapur, Taluka Jewar, District Gautam Buddha Nagar, Uttar Pradesh',
    projectPurpose:
      'Dedicated express cargo logistics access corridor linking Noida International Airport (Jewar) directly with Yamuna Expressway and Delhi-Mumbai Expressway network.',
    currentStage: 'Section 19 Declaration & R&R Resettlement Planning',
    overallProgressPct: 56,
    timelineMilestones: [
      { stage: 'Stage 1: SIA', milestone: 'Social Impact Assessment Clearances', status: 'Completed', targetDate: 'Sep 2025' },
      { stage: 'Stage 2: Section 11', milestone: 'Preliminary Notification Gazetted', status: 'Completed', targetDate: 'Dec 2025' },
      { stage: 'Stage 3: Section 19', milestone: 'Declaration of Acquisition Published', status: 'Completed', targetDate: 'Feb 2026' },
      { stage: 'Stage 4: Award & R&R', milestone: 'Award Approval & Resettlement Plot Allotment', status: 'In Progress', targetDate: 'Jun 2026' },
      { stage: 'Stage 5: Handover', milestone: 'Possession Handover to YEDA', status: 'Upcoming', targetDate: 'Oct 2026' },
    ],
    projectedCompletion: 'Site Possession: Oct 2026 • Cargo Expressway Operations: Dec 2027',
    generalAcquisitionStatus:
      'Acquisition under Section 19 finalized. 216 landowner families covered under mandatory Rehabilitation and Resettlement (R&R) scheme with residential plot allotments.',
    totalLandRequiredHa: 118.0,
    totalLandAcquiredHa: 66.1,
    totalVillagesAffected: 6,
    executingAgency: 'Yamuna Expressway Industrial Development Authority (YEIDA)',
  },
};

export function getProjectOverviewInfo(projectId?: string): ProjectOverviewInfo {
  if (projectId && sampleProjectOverviews[projectId]) {
    return sampleProjectOverviews[projectId];
  }
  return sampleProjectOverviews['PRJ-EXP-2026-001'];
}


