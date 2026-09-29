import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Shield,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Scale,
  Building,
  ArrowLeft,
} from 'lucide-react';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  getStoredComplaints,
} from '../data/complaintsData';
import { solutionsData } from '../data/solutionsData';
import { LandParcel, getParcelById, sampleLandParcels } from '../data/citizenData';
import { ParcelInfoModal } from './ParcelInfoModal';
import { UserRole } from '../types';

interface OfficerComplaintsViewProps {
  currentRole?: UserRole;
  onOpenMapParcel?: (parcel: LandParcel) => void;
}

export const OfficerComplaintsView: React.FC<OfficerComplaintsViewProps> = ({
  currentRole,
  onOpenMapParcel,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>(getStoredComplaints);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ComplaintStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ComplaintCategory>('ALL');

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedParcelForDossier, setSelectedParcelForDossier] = useState<LandParcel | null>(null);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.id.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.parcelNumber.toLowerCase().includes(q) ||
          c.villageDistrict.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [complaints, statusFilter, categoryFilter, searchQuery]);

  const activeCategoryForRecommendedActions =
    selectedComplaint?.category || (categoryFilter !== 'ALL' ? categoryFilter : 'compensation');

  const recommendedActions =
    solutionsData[activeCategoryForRecommendedActions]?.recommendedActionsForOfficers || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-[#123B63]" />
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              Public Landholder Grievance & Citizen Complaints Registry
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Read-only statutory oversight queue for Special Land Acquisition Officers (SLARO), Tehsildars, and Competent Authorities.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-[#123B63] bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            {complaints.length} Total Registered Grievances
          </span>
        </div>
      </div>

      {/* RECOMMENDED ACTIONS CARD FOR OFFICERS (Mandated by Requirement 4) */}
      <div className="bg-gradient-to-r from-blue-900 to-[#123B63] text-white rounded-lg p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Recommended Statutory Actions for Officers
            </h3>
          </div>
          <span className="text-[11px] font-mono bg-white/10 text-blue-200 px-2.5 py-0.5 rounded border border-white/20">
            Category: {solutionsData[activeCategoryForRecommendedActions]?.categoryLabel}
          </span>
        </div>

        <p className="text-xs text-blue-100/90 leading-relaxed">
          Standard statutory operating procedures (SOP) under RFCTLARR Act 2013 and Revenue Court rules for disposing of <strong>{solutionsData[activeCategoryForRecommendedActions]?.categoryLabel}</strong> complaints:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {recommendedActions.map((rec) => (
            <div
              key={rec.step}
              className="bg-white/10 border border-white/15 rounded p-3 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 font-mono text-[11px]">{rec.step}</span>
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.2 rounded font-mono">
                  {rec.timeline}
                </span>
              </div>
              <div className="font-bold text-white text-xs">{rec.action}</div>
              <p className="text-[11px] text-blue-100/80 leading-relaxed">
                {rec.standardProcedure}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Reference ID, Citizen Name, Parcel Number, or Village..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#123B63]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-xs font-medium focus:ring-1 focus:ring-[#123B63]"
              aria-label="Filter by Status"
            >
              <option value="ALL">All Statuses</option>
              <option value="Submitted">Submitted (Pending Allocation)</option>
              <option value="Under Review">Under Review (SLARO)</option>
              <option value="Resolved">Resolved (Order Issued)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="shrink-0 text-xs">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-xs font-medium focus:ring-1 focus:ring-[#123B63]"
              aria-label="Filter by Category"
            >
              <option value="ALL">All Categories</option>
              <option value="compensation">Compensation Discrepancy</option>
              <option value="boundary">Boundary & Demarcation</option>
              <option value="ownership">Ownership & Mutation</option>
              <option value="notice">Notice & Hearing</option>
              <option value="other">R&R / Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Table (Read-Only as requested) */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Reference ID</th>
                <th className="p-3">Complainant / Contact</th>
                <th className="p-3">Parcel / Location</th>
                <th className="p-3">Category</th>
                <th className="p-3">Lodged On</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No citizen complaints matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => {
                  const s = solutionsData[c.category];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#123B63]">
                        {c.id}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{c.parcelNumber}</div>
                        <div className="text-[11px] text-slate-500">{c.villageDistrict}</div>
                      </td>

                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${s?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                          {s?.categoryLabel || c.category}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        {c.submittedAt}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            c.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : c.status === 'Under Review'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedComplaint(c)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <span>Review Dossier</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dossier Detail Modal */}
      {selectedComplaint && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Header */}
            <div className="bg-[#123B63] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono text-blue-200 uppercase tracking-wider block">
                  Statutory Grievance Dossier &bull; Officer View
                </span>
                <h3 className="text-base font-bold font-mono text-white">
                  {selectedComplaint.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-slate-500 text-[11px]">Complainant Citizen:</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedComplaint.name}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px]">Status:</span>
                  <div className="font-bold text-slate-800 uppercase font-mono">{selectedComplaint.status}</div>
                </div>
              </div>

              {/* Contact info (Visible to Officers) */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Phone:</span>
                  <a href={`tel:${selectedComplaint.phone}`} className="font-mono font-bold text-blue-900">
                    {selectedComplaint.phone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block">Email:</span>
                  <a href={`mailto:${selectedComplaint.email}`} className="font-mono text-blue-900 truncate block">
                    {selectedComplaint.email}
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block">Parcel / Gat Number:</span>
                  <strong className="text-slate-900 font-mono">{selectedComplaint.parcelNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Village & District:</span>
                  <span className="text-slate-900">{selectedComplaint.villageDistrict}</span>
                </div>
              </div>

              {/* Grievance Statement */}
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded space-y-1">
                <span className="font-bold text-slate-900 block text-xs">
                  Grievance Representation:
                </span>
                <p className="text-slate-800 leading-relaxed text-xs">
                  "{selectedComplaint.description}"
                </p>
              </div>

              {/* Timeline audit trail */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 block text-xs">
                  Redressal Audit Trail:
                </span>
                <div className="space-y-1.5">
                  {selectedComplaint.statusTimeline.map((t, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px]">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>{t.status}</span>
                        <span className="text-slate-400 font-mono">{t.date}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{t.remarks}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions for this specific complaint */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded text-xs space-y-2">
                <div className="font-bold text-[#123B63] flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Officer Statutory Checklist for this Category:</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-700">
                  {solutionsData[selectedComplaint.category]?.recommendedActionsForOfficers.map((act) => (
                    <div key={act.step} className="flex items-start gap-1.5">
                      <span className="font-bold text-blue-900 shrink-0 font-mono">{act.step}:</span>
                      <span>{act.action} ({act.timeline})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-500 font-mono">
                Read-Only Official Queue
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded font-semibold text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Grievance Registry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parcel Info Dossier Modal if opened */}
      {selectedParcelForDossier && (
        <ParcelInfoModal
          parcel={selectedParcelForDossier}
          onClose={() => setSelectedParcelForDossier(null)}
          currentRole={currentRole}
        />
      )}
    </div>
  );
};
