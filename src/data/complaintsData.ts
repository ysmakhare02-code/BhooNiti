export type ComplaintCategory =
  | 'compensation'
  | 'boundary'
  | 'ownership'
  | 'notice'
  | 'other';

export type ComplaintStatus = 'Submitted' | 'Under Review' | 'Resolved';

export interface ComplaintTimelineEntry {
  status: ComplaintStatus;
  date: string;
  remarks: string;
  officer?: string;
}

export interface Complaint {
  id: string; // Unique Reference ID e.g. BHOONITI-GRV-2026-89412
  name: string;
  phone: string;
  email: string;
  parcelNumber: string;
  villageDistrict: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  submittedAt: string;
  updatedAt: string;
  assignedOfficer?: string;
  resolutionNotes?: string;
  statusTimeline: ComplaintTimelineEntry[];
}

const STORAGE_KEY = 'bhooniti_complaints';

// Initial pre-seeded citizen complaints for demonstration and officer review
const initialComplaints: Complaint[] = [
  {
    id: 'BHOONITI-GRV-2026-89412',
    name: 'Shri Vithal Ganpat Deshmukh',
    phone: '9822044192',
    email: 'vithal.deshmukh@gmail.com',
    parcelNumber: 'Gat No. 104/2B',
    villageDistrict: 'Uruli Kanchan, Haveli, Pune',
    category: 'compensation',
    description: 'Award was declared under Section 23 on 18-Jan-2026, but the solatium 100% addition under RFCTLARR Section 30 was not reflected in the Direct Benefit Transfer credit. Kindly expedite disbursement.',
    status: 'Under Review',
    submittedAt: '2026-09-15 10:30 IST',
    updatedAt: '2026-09-18 14:15 IST',
    assignedOfficer: 'Smt. Anjali Pawar (SLARO Pune)',
    statusTimeline: [
      {
        status: 'Submitted',
        date: '2026-09-15 10:30 IST',
        remarks: 'Complaint registered via BhooNiti Public Portal with Aadhaar e-verification.',
      },
      {
        status: 'Under Review',
        date: '2026-09-18 14:15 IST',
        remarks: 'Assigned to Special Land Acquisition Officer (SLARO) Haveli for bank treasury reconciliation.',
        officer: 'Smt. Anjali Pawar (SLARO)',
      },
    ],
  },
  {
    id: 'BHOONITI-GRV-2026-71045',
    name: 'Smt. Savitribai Kisan Jadhav',
    phone: '9765432109',
    email: 'savitri.jadhav@outlook.com',
    parcelNumber: 'Gat No. 108/3',
    villageDistrict: 'Koregaon Bhima, Shirur, Pune',
    category: 'boundary',
    description: 'The physical boundary pegs planted during Joint Measurement Survey (JMS) encroach 12 meters into unacquired fertile sugarcane field beyond the notified alignment coordinates.',
    status: 'Submitted',
    submittedAt: '2026-09-22 11:45 IST',
    updatedAt: '2026-09-22 11:45 IST',
    assignedOfficer: 'District Inspector of Land Records (DILR)',
    statusTimeline: [
      {
        status: 'Submitted',
        date: '2026-09-22 11:45 IST',
        remarks: 'Grievance acknowledged. Re-survey request queued for DILR field unit inspection.',
      },
    ],
  },
  {
    id: 'BHOONITI-GRV-2026-62189',
    name: 'Shri Ashok Narayan Kulkarni',
    phone: '9423156780',
    email: 'ashok.kulkarni@yahoo.co.in',
    parcelNumber: 'Survey No. 45/1',
    villageDistrict: 'Sanand, Ahmedabad, Gujarat',
    category: 'ownership',
    description: 'Succession certificate and Ferfar mutation entry No. 4410 were sanctioned in revenue records on 02-Feb-2026, but acquisition record still reflects the deceased grandfather name.',
    status: 'Resolved',
    submittedAt: '2026-08-28 09:15 IST',
    updatedAt: '2026-09-12 16:30 IST',
    assignedOfficer: 'Tehsildar & SDO Sanand',
    resolutionNotes: 'Updated 7/12 record verified with e-Dhara integration. Award compensation account corrected to current legal heirs.',
    statusTimeline: [
      {
        status: 'Submitted',
        date: '2026-08-28 09:15 IST',
        remarks: 'Grievance registered with attached legal heir certificate.',
      },
      {
        status: 'Under Review',
        date: '2026-09-02 11:00 IST',
        remarks: 'Revenue verification completed by Circle Officer Sanand.',
        officer: 'Shri R. P. Patel (Tehsildar)',
      },
      {
        status: 'Resolved',
        date: '2026-09-12 16:30 IST',
        remarks: 'Revenue title updated in land acquisition portal and award disbursement list updated.',
        officer: 'Shri R. P. Patel (Tehsildar)',
      },
    ],
  },
  {
    id: 'BHOONITI-GRV-2026-55320',
    name: 'Shri Rameshwar Lal Meena',
    phone: '9829012345',
    email: 'rameshwar.meena@gmail.com',
    parcelNumber: 'Khasra No. 312/1',
    villageDistrict: 'Dausa, Rajasthan',
    category: 'notice',
    description: 'Section 11 preliminary notification copy was not received at village Gram Panchayat notice board before the statutory hearing window.',
    status: 'Under Review',
    submittedAt: '2026-09-20 15:10 IST',
    updatedAt: '2026-09-23 10:00 IST',
    assignedOfficer: 'Sub-Divisional Magistrate (SDM) Dausa',
    statusTimeline: [
      {
        status: 'Submitted',
        date: '2026-09-20 15:10 IST',
        remarks: 'Representation received regarding Section 15 objection timeline.',
      },
      {
        status: 'Under Review',
        date: '2026-09-23 10:00 IST',
        remarks: 'SDM granted additional 15-day window for public hearing representation.',
        officer: 'SDM Dausa',
      },
    ],
  },
];

/**
 * Loads all complaints from localStorage or seeds default sample records.
 */
export function getStoredComplaints(): Complaint[] {
  if (typeof window === 'undefined') return initialComplaints;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialComplaints));
      return initialComplaints;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialComplaints;
  } catch (e) {
    console.error('Failed to parse complaints from localStorage', e);
    return initialComplaints;
  }
}

/**
 * Saves a new citizen complaint into localStorage.
 */
export function saveComplaint(complaint: Omit<Complaint, 'id' | 'status' | 'submittedAt' | 'updatedAt' | 'statusTimeline'>): Complaint {
  const currentList = getStoredComplaints();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const newId = `BHOONITI-GRV-2026-${randomSuffix}`;
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} IST`;

  const newRecord: Complaint = {
    ...complaint,
    id: newId,
    status: 'Submitted',
    submittedAt: formattedDate,
    updatedAt: formattedDate,
    statusTimeline: [
      {
        status: 'Submitted',
        date: formattedDate,
        remarks: 'Complaint registered in BhooNiti Public Portal. Acknowledgement issued with unique tracking reference.',
      },
    ],
  };

  const updatedList = [newRecord, ...currentList];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }
  return newRecord;
}

/**
 * Finds a complaint by ID or phone number.
 */
export function findComplaint(query: string): Complaint | null {
  const cleanQuery = query.trim().toUpperCase();
  if (!cleanQuery) return null;
  const list = getStoredComplaints();
  return (
    list.find(
      (c) =>
        c.id.toUpperCase() === cleanQuery ||
        c.phone.replace(/\D/g, '') === cleanQuery.replace(/\D/g, '')
    ) || null
  );
}

/**
 * Updates a complaint's status (officer tool).
 */
export function updateComplaintStatus(
  id: string,
  newStatus: ComplaintStatus,
  remarks: string,
  officerName: string
): Complaint | null {
  const list = getStoredComplaints();
  const index = list.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} IST`;

  const target = list[index];
  const updatedRecord: Complaint = {
    ...target,
    status: newStatus,
    updatedAt: formattedDate,
    assignedOfficer: officerName,
    resolutionNotes: newStatus === 'Resolved' ? remarks : target.resolutionNotes,
    statusTimeline: [
      ...target.statusTimeline,
      {
        status: newStatus,
        date: formattedDate,
        remarks,
        officer: officerName,
      },
    ],
  };

  list[index] = updatedRecord;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to update localStorage', e);
    }
  }
  return updatedRecord;
}
