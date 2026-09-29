import { ComplaintCategory } from './complaintsData';

export interface SolutionCategoryDetail {
  category: ComplaintCategory;
  categoryLabel: string;
  badgeColor: string;
  summary: string;
  statutoryReference: string;
  documentsNeeded: string[];
  appealProcess: { step: number; action: string; timeline: string }[];
  authorityToContact: {
    title: string;
    office: string;
    level: string;
    typicalLocation: string;
    officialHelpline: string;
  };
  recommendedActionsForOfficers: {
    step: string;
    action: string;
    timeline: string;
    standardProcedure: string;
  }[];
}

export const STATUTORY_LEGAL_DISCLAIMER =
  'Guidance, not legal advice: This information is provided for procedural guidance, administrative transparency, and citizen awareness under statutory land acquisition frameworks (RFCTLARR Act 2013). It does not constitute formal legal advice or substitute for statutory revenue court pleadings.';

export const solutionsData: Record<ComplaintCategory, SolutionCategoryDetail> = {
  compensation: {
    category: 'compensation',
    categoryLabel: 'Compensation & Award Solatium',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    summary:
      'Grievances regarding valuation, delayed compensation credit, circle rate disputes, or missing 100% statutory solatium under RFCTLARR Section 30.',
    statutoryReference:
      'RFCTLARR Act 2013: Section 23 (Enquiry and Land Acquisition Award), Section 30 (Award of Solatium & Market Value Multipliers), Section 64 (Reference to Authority).',
    documentsNeeded: [
      'Original 7/12 Extract / Record of Rights (Jamabandi / ROR / Khatauni) for last 3 years',
      'Certified Copy of Award Notice issued by SLAO under Section 23/Section 37',
      'Bank Account Passbook / Cancelled Cheque linked to Aadhaar for Direct Benefit Transfer (DBT)',
      'Registered Sale Deed / Title deed establishing clear non-encumbrance ownership',
      'Indemnity Bond on ₹500 non-judicial stamp paper as prescribed by Collectorate',
      'Copy of Objections submitted during Section 15 hearing (if applicable)',
    ],
    appealProcess: [
      {
        step: 1,
        action:
          'Submit written representation to the Special Land Acquisition Officer (SLARO) detailing award calculation discrepancy within 15 days of notice.',
        timeline: 'Within 15 days of receiving Award Notice',
      },
      {
        step: 2,
        action:
          'If unsatisfied with Collector determination, file a formal reference application under Section 64 to the Land Acquisition, Rehabilitation and Resettlement Authority (LARRA).',
        timeline: 'Within 6 weeks of award announcement if present, or 6 months if absent',
      },
      {
        step: 3,
        action:
          'The District Collector / SLARO is statutorily mandated to refer the matter to the LARRA presiding judicial officer within 30 days of application receipt.',
        timeline: '30 days statutory referral SLA',
      },
      {
        step: 4,
        action:
          'Participate in LARRA judicial inquiry; compensation enhancement awards carry 9% interest for Year 1 and 15% thereafter on excess amount.',
        timeline: '6 months target disposal under Section 69',
      },
    ],
    authorityToContact: {
      title: 'Special Land Acquisition Officer (SLARO) & Sub-Divisional Magistrate (SDM)',
      office: 'District Land Acquisition Cell, Collectorate Office',
      level: 'District Administrative & Quasi-Judicial Level',
      typicalLocation: 'Room 104, District Collectorate Building / Tehsil Office',
      officialHelpline: '1800-111-BHOOMI / District Jan Seva Portal',
    },
    recommendedActionsForOfficers: [
      {
        step: 'SLA-1',
        action: 'Treasury & PFMS Payment Gateway Audit',
        timeline: 'Within 5 Working Days',
        standardProcedure:
          'Reconcile PFMS electronic DBT batch with District Treasury to verify whether failure is technical (IFSC/Aadhaar seeding) or budgetary shortfall.',
      },
      {
        step: 'SLA-2',
        action: 'Solatium & Multiplier Audit Verification',
        timeline: 'Within 7 Working Days',
        standardProcedure:
          'Verify if rural multiplier (1.00 to 2.00) and 100% Solatium plus 12% additional interest under Section 30(3) was correctly calculated.',
      },
      {
        step: 'SLA-3',
        action: 'Special Compensation Camp Mobilization',
        timeline: 'Within 14 Days',
        standardProcedure:
          'Organize SLARO spot reconciliation camp at Gram Panchayat office with bank nodal officers to collect Aadhaar NPCI mandate forms.',
      },
    ],
  },

  boundary: {
    category: 'boundary',
    categoryLabel: 'Boundary & Demarcation Discrepancy',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    summary:
      'Grievances regarding alignment encroachment, misaligned Right-of-Way (RoW) boundary pegs, or disagreement with Joint Measurement Survey (JMS) area calculation.',
    statutoryReference:
      'RFCTLARR Act 2013: Section 12 (Preliminary Survey and Power to Measure), Land Revenue Code Section 135/demarcation rules.',
    documentsNeeded: [
      'Official Revenue Cadastral Map (Village Naksha / Tippan / FMB sketch)',
      'Signed Joint Measurement Survey (JMS) sheet copy from SLAO / PWD / NHAI unit',
      'Aadhaar Card and Landowner identity verification',
      'Govt Demarcation / Re-survey fee challan receipt (GRAS / Treasury receipt)',
      'Photographs with geotag showing boundary markers / peg stones on the ground',
    ],
    appealProcess: [
      {
        step: 1,
        action:
          'File an application for Joint Re-measurement Demarcation with the Tehsildar and District Inspector of Land Records (DILR).',
        timeline: 'Within 30 days of boundary peg placement',
      },
      {
        step: 2,
        action:
          'Field surveyor and DILR team conduct on-site differential GPS (DGPS) or Total Station survey in presence of landowner and acquisition agency.',
        timeline: 'Scheduled within 14 days of fee challan',
      },
      {
        step: 3,
        action:
          'A Joint Demarcation Panchnama is prepared and signed on-site with corrected physical coordinates.',
        timeline: 'Issued within 7 days of field inspection',
      },
      {
        step: 4,
        action:
          'If area reduction or enlargement is established, SLARO amends the Section 19 declaration schedule accordingly.',
        timeline: 'Before Section 23 award determination',
      },
    ],
    authorityToContact: {
      title: 'District Inspector of Land Records (DILR) & Taluka Surveyor',
      office: 'Land Records & Revenue Survey Office',
      level: 'Taluka / District Cadastral Survey Division',
      typicalLocation: 'Taluka Land Records Office (Bhoomi Abhilekh), Tehsil Office',
      officialHelpline: 'District Bhoomi Abhilekh Grievance Cell',
    },
    recommendedActionsForOfficers: [
      {
        step: 'SLA-1',
        action: 'Deploy DGPS Joint Verification Survey Team',
        timeline: 'Within 7 Working Days',
        standardProcedure:
          'Issue notice to project executing agency (NHAI/Railways) and depute DILR revenue surveyor to verify DGPS survey benchmarks.',
      },
      {
        step: 'SLA-2',
        action: 'Compare Satellite Orthophoto with RoW Alignment',
        timeline: 'Within 3 Working Days',
        standardProcedure:
          'Superimpose GIS cadastral layer over Google Earth / Drone orthomosaic in BhooNiti GIS viewer to identify boundary overlap.',
      },
      {
        step: 'SLA-3',
        action: 'Execute Spot Panchnama & Alignment Peg Reset',
        timeline: 'Within 10 Working Days',
        standardProcedure:
          'Relocate physical boundary markers if discrepancy exceeds 0.5% margin of error and record signed panchnama in presence of Gram Sevak.',
      },
    ],
  },

  ownership: {
    category: 'ownership',
    categoryLabel: 'Ownership & Mutation Record',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    summary:
      'Issues concerning deceased owners, pending inheritance Ferfar/mutation, partition disputes, or mismatched name spellings on Section 11 gazette notices.',
    statutoryReference:
      'RFCTLARR Act 2013: Section 11 (Publication of Preliminary Notification), State Land Revenue Code (Mutation & Title Entry Rules).',
    documentsNeeded: [
      'Latest Digital 7/12 Extract / Khatauni carrying digital verification code',
      'Death Certificate of original recorded landholder (if succession claim)',
      'Legal Heir Certificate (Varas Certificate) issued by Tehsildar / Court',
      'Registered Partition Deed or Family Settlement Panchnama',
      'Affidavit of all co-sharers declaring mutual consent and bank account details',
    ],
    appealProcess: [
      {
        step: 1,
        action:
          'Apply for Mutation Entry (Ferfar / Namantaran) through online revenue portal (e.g. Mahabhumi, e-Dhara, Bhulekh) or directly to the Talathi / Patwari.',
        timeline: 'Immediate upon inheritance/succession',
      },
      {
        step: 2,
        action:
          'Talathi issues 15-day statutory objection notice to all interested parties under Revenue Code.',
        timeline: '15-day public objection notice',
      },
      {
        step: 3,
        action:
          'Circle Officer certifies mutation entry after examining no objections were received.',
        timeline: 'Within 21 days of notice expiration',
      },
      {
        step: 4,
        action:
          'Submit certified mutation extract to SLARO to substitute claimant name in the statutory acquisition register.',
        timeline: 'Prior to final payment order generation',
      },
    ],
    authorityToContact: {
      title: 'Circle Officer / Tehsildar & Sub-Divisional Officer (SDO)',
      office: 'Taluka Revenue Office',
      level: 'Sub-Divisional Revenue Administration',
      typicalLocation: 'Tehsildar Office, Revenue Administrative Complex',
      officialHelpline: '1800-State-Revenue / e-Haqq Helpdesk',
    },
    recommendedActionsForOfficers: [
      {
        step: 'SLA-1',
        action: 'Expedited Revenue Mutation Verification',
        timeline: 'Within 7 Working Days',
        standardProcedure:
          'Cross-reference applicant title with state land records database API to verify genuine inheritance line and prevent impersonation.',
      },
      {
        step: 'SLA-2',
        action: 'Section 76 Escrow Deposit if Title in Active Dispute',
        timeline: 'Immediate',
        standardProcedure:
          'If co-heirs are in civil dispute, deposit disputed share into LARRA civil court escrow under Section 76 to prevent project stagnation.',
      },
      {
        step: 'SLA-3',
        action: 'Update Award Register with Legal Heir Pro-Rata Share',
        timeline: 'Within 5 Working Days',
        standardProcedure:
          'Apportion individual compensation entitlement based on validated Varas register and issue amended form.',
      },
    ],
  },

  notice: {
    category: 'notice',
    categoryLabel: 'Statutory Notice & Public Hearing',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    summary:
      'Grievances regarding missed Section 11 notices, lack of intimation for Section 15 objection hearings, or non-receipt of rehabilitation award copy.',
    statutoryReference:
      'RFCTLARR Act 2013: Section 11 (Preliminary Notification), Section 15 (Hearing of Objections within 60 days), Section 19 (Declaration of Acquisition).',
    documentsNeeded: [
      'Copy of Gazette notification details (Project name and District number)',
      'Proof of land parcel ownership (7/12 extract / Patta / Khasra)',
      'Copy of postal envelope / delivery slip showing late delivery or non-service',
      'Written statement of objections under Section 15(1) with specific relief sought',
      'Affidavit declaring date of first knowledge of acquisition proceedings',
    ],
    appealProcess: [
      {
        step: 1,
        action:
          'Submit a formal representation to the Competent Authority for Land Acquisition (CALA) stating lack of notice and requesting extension.',
        timeline: 'Within 15 days of becoming aware of proceedings',
      },
      {
        step: 2,
        action:
          'Collector / CALA is required to schedule a personal hearing under Section 15(2) and record oral and documentary submissions.',
        timeline: 'CALA issues notice with 7 days hearing date',
      },
      {
        step: 3,
        action:
          'CALA submits statutory report on objections to the State Government with recommendations.',
        timeline: 'Within 60 days of Section 11 notification expiry',
      },
      {
        step: 4,
        action:
          'Final decision of the State Government on objections is published alongside the Section 19 declaration.',
        timeline: 'Within 12 months of Section 11 publication',
      },
    ],
    authorityToContact: {
      title: 'Competent Authority for Land Acquisition (CALA) / SDM',
      office: 'Office of the Sub-Divisional Magistrate (CALA)',
      level: 'Statutory Competent Authority',
      typicalLocation: 'Sub-Divisional Administrative Office / CALA Special Cell',
      officialHelpline: 'District Land Acquisition Information Desk',
    },
    recommendedActionsForOfficers: [
      {
        step: 'SLA-1',
        action: 'Audit Notice Delivery & Gram Panchayat Publication Panchnama',
        timeline: 'Within 48 Hours',
        standardProcedure:
          'Verify whether public notice was duly published in two local vernacular newspapers and posted at Taluka and Gram Panchayat offices as per Sec 11(1).',
      },
      {
        step: 'SLA-2',
        action: 'Schedule Special Summary Hearing for Affected Landholder',
        timeline: 'Within 7 Working Days',
        standardProcedure:
          'Issue summons for special hearing before CALA to record objections under Section 15(2) without denying natural justice.',
      },
      {
        step: 'SLA-3',
        action: 'Upload Certified Notice Delivery Receipt to BhooNiti Evidence Repository',
        timeline: 'Within 3 Working Days',
        standardProcedure:
          'Ensure speed-post tracking acknowledgement or Gram Panchayat panchnama is digitally archived for audit trail defense.',
      },
    ],
  },

  other: {
    category: 'other',
    categoryLabel: 'Rehabilitation & Resettlement / Other',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    summary:
      'Grievances relating to Rehabilitation & Resettlement (R&R) entitlements (Second Schedule), housing plots, cattle shed grants, or livelihood subsistence allowances.',
    statutoryReference:
      'RFCTLARR Act 2013: Section 31 (Rehabilitation and Resettlement Award), Second Schedule (Mandatory R&R Elements), Third Schedule (Infrastructural Amenities).',
    documentsNeeded: [
      'Family ration card / Parivar register proving residence within affected area',
      'Proof of displacement or loss of homestead / commercial livelihood',
      'Gram Panchayat residence certificate proving 3 years domicile prior to notification',
      'Disability / Widow / BPL certificate (for special statutory livelihood supplements)',
      'Bank Account details with Aadhaar linkage',
    ],
    appealProcess: [
      {
        step: 1,
        action:
          'Submit petition to Administrator for Rehabilitation and Resettlement (Commissioner / Additional Collector).',
        timeline: 'Within 30 days of R&R draft scheme publication',
      },
      {
        step: 2,
        action:
          'Administrator conducts public consultation with affected families and submits final R&R plan to Collector.',
        timeline: 'Within 30 days of public hearing',
      },
      {
        step: 3,
        action:
          'Collector reviews, approves R&R award and sanctions plot allotments and one-time resettlement allowances.',
        timeline: 'Concurrent with Section 23 land award',
      },
      {
        step: 4,
        action:
          'Any dispute concerning R&R execution is referable to the Land Acquisition, Rehabilitation and Resettlement Authority (LARRA).',
        timeline: 'Under Section 64 reference',
      },
    ],
    authorityToContact: {
      title: 'Administrator for Rehabilitation & Resettlement (R&R) / Additional Collector',
      office: 'District R&R Oversight Committee',
      level: 'District & Divisional Oversight Authority',
      typicalLocation: 'District Rural Development Agency (DRDA) / Collectorate',
      officialHelpline: '1800-RNR-ASSIST / Collector Helpline',
    },
    recommendedActionsForOfficers: [
      {
        step: 'SLA-1',
        action: 'R&R Entitlement Matrix Scrutiny',
        timeline: 'Within 5 Working Days',
        standardProcedure:
          'Scrutinize family roster against Second Schedule provisions (₹50,000 transportation grant, ₹3,000/month subsistence annuity, house construction subsidy).',
      },
      {
        step: 'SLA-2',
        action: 'Alternate Residential Plot Allotment Verification',
        timeline: 'Within 14 Working Days',
        standardProcedure:
          'Coordinate with Town Planning and Revenue authorities to confirm layout demarcated with basic amenities (drinking water, roads, electricity) under Third Schedule.',
      },
      {
        step: 'SLA-3',
        action: 'Livelihood Training & Skill Development Onboarding',
        timeline: 'Within 30 Working Days',
        standardProcedure:
          'Onboard eligible affected youth into PMKVY / National Apprenticeship Scheme as part of project CSR/R&R commitments.',
      },
    ],
  },
};
