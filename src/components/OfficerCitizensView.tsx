import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle,
  Clock,
  ShieldCheck,
  MapPin,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  FileText,
  X,
  Eye,
  Check,
  Building2,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import {
  sampleCitizens,
  getParcelsByLandOwnerId,
} from '../data/citizenData';
import { AuthUser, CitizenRecord } from '../types';

interface OfficerCitizensViewProps {
  currentUser?: AuthUser | null;
}

export const OfficerCitizensView: React.FC<OfficerCitizensViewProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<'ALL' | 'LANDOWNERS' | 'NON_LANDOWNERS'>('ALL');
  const [verificationFilter, setVerificationFilter] = useState<string>('ALL');
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('ALL');
  const [selectedCitizen, setSelectedCitizen] = useState<CitizenRecord | null>(null);

  // Filtered citizens list
  const filteredCitizens = useMemo(() => {
    return sampleCitizens.filter((c) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.citizenId.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.village.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        (c.projectName && c.projectName.toLowerCase().includes(q)) ||
        (c.projectId && c.projectId.toLowerCase().includes(q)) ||
        c.mobileNumber.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Ownership filter
      const parcels = getParcelsByLandOwnerId(c.citizenId);
      const isLandowner = parcels.length > 0;
      if (ownershipFilter === 'LANDOWNERS' && !isLandowner) return false;
      if (ownershipFilter === 'NON_LANDOWNERS' && isLandowner) return false;

      // Verification filter
      if (verificationFilter !== 'ALL' && c.verificationStatus !== verificationFilter) return false;

      // Account status filter
      if (accountStatusFilter !== 'ALL' && c.accountStatus !== accountStatusFilter) return false;

      return true;
    });
  }, [searchQuery, ownershipFilter, verificationFilter, accountStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = sampleCitizens.length;
    const landowners = sampleCitizens.filter((c) => getParcelsByLandOwnerId(c.citizenId).length > 0).length;
    const nonLandowners = total - landowners;
    const verified = sampleCitizens.filter((c) => c.verificationStatus === 'VERIFIED').length;
    return { total, landowners, nonLandowners, verified };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#123B63] text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">
              Statutory Registry
            </span>
            <span className="text-xs text-slate-500 font-medium">BhooNiti Officer Administration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif mt-1">
            Citizens &amp; Landowner End-User Registry
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Official statutory directory of registered citizens, verified landowners, and affected project stakeholders. Under RBAC, authorized officers can review citizen IDs, verification status, and linked survey landholdings.
          </p>
        </div>

        <div className="text-right text-xs text-slate-500 shrink-0 hidden sm:block">
          <div>Authorized Officer:</div>
          <strong className="text-slate-800">{currentUser?.name || 'Authorized Officer'}</strong>
          <div className="font-mono text-[11px] text-[#123B63]">{currentUser?.role}</div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span>Total Citizens</span>
            <Users className="w-4 h-4 text-[#123B63]" />
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono">{stats.total}</div>
          <span className="text-[10px] text-slate-500">Registered platform users</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span>Verified Landowners</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 font-mono">{stats.landowners}</div>
          <span className="text-[10px] text-emerald-800 font-semibold">Matched with parcel records</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span>Public Citizens</span>
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-bold text-slate-700 font-mono">{stats.nonLandowners}</div>
          <span className="text-[10px] text-slate-500">Public overview access</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span>Verified Status</span>
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-[#123B63] font-mono">{stats.verified}</div>
          <span className="text-[10px] text-slate-500">Statutory identity confirmed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Search Box (6 cols) */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Citizen ID, Name, Village, Mobile, or Project..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#123B63] bg-slate-50/50"
            />
          </div>

          {/* Ownership Filter (2 cols) */}
          <div className="sm:col-span-2">
            <select
              value={ownershipFilter}
              onChange={(e) => setOwnershipFilter(e.target.value as any)}
              className="w-full py-2 px-2.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#123B63] font-medium"
              aria-label="Filter by Ownership"
            >
              <option value="ALL">All Ownerships</option>
              <option value="LANDOWNERS">Landowners Only</option>
              <option value="NON_LANDOWNERS">Public Citizens</option>
            </select>
          </div>

          {/* Verification Status Filter (2 cols) */}
          <div className="sm:col-span-2">
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full py-2 px-2.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#123B63] font-medium"
              aria-label="Filter by Verification Status"
            >
              <option value="ALL">All Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Account Status Filter (2 cols) */}
          <div className="sm:col-span-2">
            <select
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value)}
              className="w-full py-2 px-2.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#123B63] font-medium"
              aria-label="Filter by Account Status"
            >
              <option value="ALL">All Account Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong>{filteredCitizens.length}</strong> of <strong>{sampleCitizens.length}</strong> citizen records
          </div>
          {(searchQuery || ownershipFilter !== 'ALL' || verificationFilter !== 'ALL' || accountStatusFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setOwnershipFilter('ALL');
                setVerificationFilter('ALL');
                setAccountStatusFilter('ALL');
              }}
              className="text-[#123B63] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Citizen Directory Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Citizen ID</th>
                <th className="py-3 px-3.5">Citizen Name</th>
                <th className="py-3 px-3.5">Village &amp; District</th>
                <th className="py-3 px-3.5">Associated Project</th>
                <th className="py-3 px-3.5">Parcel / Landholding</th>
                <th className="py-3 px-3.5 text-center">Verification</th>
                <th className="py-3 px-3.5 text-center">Account</th>
                <th className="py-3 px-3.5 text-center">Registration</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredCitizens.map((c) => {
                const parcels = getParcelsByLandOwnerId(c.citizenId);
                const isLandowner = parcels.length > 0;

                return (
                  <tr key={c.citizenId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3.5 font-mono font-bold text-[#123B63]">
                      {c.citizenId}
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900">{c.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{c.mobileNumber}</div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-800">{c.village}</div>
                      <div className="text-[11px] text-slate-500">{c.district}, {c.state}</div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-800 line-clamp-1">{c.projectName || c.projectId}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.projectId}</div>
                    </td>

                    <td className="py-3 px-3.5">
                      {isLandowner ? (
                        <div>
                          <span className="font-semibold text-emerald-800">
                            {parcels.map((p) => p.parcelNumber).join(', ')}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {parcels.length} {parcels.length > 1 ? 'Parcels' : 'Parcel'} &bull;{' '}
                            {parcels.reduce((sum, p) => sum + p.areaHectares, 0).toFixed(2)} Ha
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          Non-Landowner (Public)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          c.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : c.verificationStatus === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {c.verificationStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.accountStatus === 'ACTIVE'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {c.accountStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-center text-[11px] text-slate-600 font-mono">
                      {c.registrationDate}
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => setSelectedCitizen(c)}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-[#123B63] border border-slate-300 transition inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Citizen Details Modal / Drawer */}
      {selectedCitizen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="bg-[#123B63] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-amber-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-blue-200 uppercase tracking-wider block">
                    Citizen Record &bull; {selectedCitizen.citizenId}
                  </span>
                  <h3 className="text-base font-bold text-white font-serif">
                    {selectedCitizen.fullName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedCitizen(null)}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 text-[11px] block">Citizen ID:</span>
                  <strong className="font-mono text-[#123B63] text-sm">{selectedCitizen.citizenId}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Account &amp; Verification:</span>
                  <span className="font-semibold text-emerald-800">
                    {selectedCitizen.accountStatus} &bull; {selectedCitizen.verificationStatus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Mobile Number:</span>
                  <strong className="font-mono text-slate-800">{selectedCitizen.mobileNumber}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Email Address:</span>
                  <strong className="font-mono text-slate-800">{selectedCitizen.email}</strong>
                </div>
                {selectedCitizen.maskedAadhaar && (
                  <div>
                    <span className="text-slate-500 text-[11px] block">Aadhaar (Masked):</span>
                    <strong className="font-mono text-slate-800">{selectedCitizen.maskedAadhaar}</strong>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 text-[11px] block">Registration Date:</span>
                  <span className="font-mono text-slate-700">{selectedCitizen.registrationDate}</span>
                </div>
              </div>

              {/* Geographic Demographics */}
              <div className="border border-slate-200 rounded-lg p-3.5 space-y-2">
                <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#123B63]" />
                  <span>Geographic &amp; Administrative Jurisdiction</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-800">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Village:</span>
                    <strong>{selectedCitizen.village}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Taluka / Tehsil:</span>
                    <strong>{selectedCitizen.taluka}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">District &amp; State:</span>
                    <strong>{selectedCitizen.district}, {selectedCitizen.state}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Residential Address:</span>
                    <span>{selectedCitizen.address}</span>
                  </div>
                </div>
              </div>

              {/* Linked Landholding Records */}
              {(() => {
                const parcels = getParcelsByLandOwnerId(selectedCitizen.citizenId);
                const isLandowner = parcels.length > 0;
                return (
                  <div className="border border-slate-200 rounded-lg p-3.5 space-y-2 bg-slate-50/50">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#123B63]" />
                      <span>Linked Landholding Records ({parcels.length} Parcels Owned)</span>
                    </span>

                    {isLandowner ? (
                      <div className="space-y-2 pt-1">
                        {parcels.map((p) => (
                          <div
                            key={p.id}
                            className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{p.parcelNumber}</div>
                              <div className="text-[11px] text-slate-500">
                                {p.village} &bull; Stage: {p.stage}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-xs font-bold text-emerald-800">
                                {p.areaHectares} Ha
                              </span>
                              <div className="text-[10px] text-slate-500">
                                ₹{p.compensationSanctionedLakhs.toFixed(2)} Lakhs
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-slate-200 rounded text-slate-500 text-center italic text-xs">
                        No private land parcels recorded for Citizen ID {selectedCitizen.citizenId}. Citizen has general public overview access.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCitizen(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded shadow-xs transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Citizens Registry
              </button>
              <button
                type="button"
                onClick={() => setSelectedCitizen(null)}
                className="px-4 py-1.5 bg-[#123B63] hover:bg-[#0e2f50] text-white text-xs font-semibold rounded transition"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
