import React from 'react';
import {
  X,
  MapPin,
  FileText,
  Shield,
  Lock,
  Phone,
  Mail,
  User,
  CheckCircle,
  Calendar,
  Building,
  Landmark,
  Scale,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { LandParcel } from '../data/citizenData';
import { UserRole } from '../types';

interface ParcelInfoModalProps {
  parcel: LandParcel | null;
  onClose: () => void;
  currentRole?: UserRole;
  citizenId?: string;
  onLocateOnMap?: (parcel: LandParcel) => void;
}

export const ParcelInfoModal: React.FC<ParcelInfoModalProps> = ({
  parcel,
  onClose,
  currentRole,
  citizenId,
  onLocateOnMap,
}) => {
  if (!parcel) return null;

  // Contact details are strictly visible ONLY to authorized government officers
  const isOfficer = currentRole && currentRole !== 'CITIZEN';
  // A citizen can only see their own landowner info if citizenId === parcel.landOwnerId
  const isParcelOwner = Boolean(citizenId && parcel.landOwnerId === citizenId);
  const canViewOwnerIdentity = isOfficer || isParcelOwner;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-lg shadow-xl border border-slate-300 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#123B63] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-amber-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-blue-200 uppercase tracking-wider block">
                Official Revenue Parcel Record &bull; {parcel.id}
              </span>
              <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                {parcel.parcelNumber} — Land Parcel Dossier
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition"
            aria-label="Close parcel dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-800">
          {/* Status highlight banner */}
          <div className="p-3 rounded border border-amber-300 bg-amber-50/70 flex items-start gap-2.5">
            <Scale className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                Acquisition Status: {parcel.acquisitionStatus}
              </span>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Current Statutory Stage: <strong>{parcel.stage}</strong> under RFCTLARR Act 2013 framework.
              </p>
            </div>
          </div>

          {/* Primary Land & Owner Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                <User className="w-4 h-4 text-[#123B63]" />
                <span>Recorded Landowner Information</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-slate-500 text-[11px] block">Landholder Name:</span>
                  <span className="text-sm font-bold text-slate-900 font-serif">
                    {canViewOwnerIdentity ? parcel.ownerName : 'Private Citizen Landholder (Concealed)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Aadhaar (Masked):</span>
                  <span className="font-mono text-slate-700">
                    {canViewOwnerIdentity ? parcel.ownerAadhaarMasked : 'XXXX-XXXX-XXXX (Concealed)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                <MapPin className="w-4 h-4 text-[#123B63]" />
                <span>Parcel Measurement & Area</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-slate-500 text-[11px] block">Total Parcel Number:</span>
                  <span className="font-bold text-slate-900">{parcel.parcelNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Acquired Area:</span>
                    <span className="font-bold text-slate-900">{parcel.areaHectares} Ha</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Imperial Area:</span>
                    <span className="font-bold text-slate-900">{parcel.areaAcres} Acres</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CRITICAL GOVERNANCE MANDATE: Owner contact details visible ONLY to officers */}
          <div className="border border-slate-200 rounded p-4 bg-white space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Phone className="w-4 h-4 text-[#123B63]" />
                <span>Owner Contact & Grievance Communication</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                isOfficer ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {isOfficer ? (
                  <>
                    <Shield className="w-3 h-3 text-emerald-600" />
                    Officer Authorized Access
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-slate-500" />
                    Restricted (Officers Only)
                  </>
                )}
              </span>
            </div>

            {isOfficer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded bg-emerald-50/50 border border-emerald-200 space-y-1">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" /> Registered Mobile Phone:
                  </span>
                  <a
                    href={`tel:${parcel.ownerPhone}`}
                    className="font-mono font-bold text-slate-900 text-xs hover:text-emerald-700 underline"
                  >
                    {parcel.ownerPhone}
                  </a>
                </div>

                <div className="p-2.5 rounded bg-emerald-50/50 border border-emerald-200 space-y-1">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Mail className="w-3 h-3 text-emerald-600" /> Official Email Address:
                  </span>
                  <a
                    href={`mailto:${parcel.ownerEmail}`}
                    className="font-mono font-bold text-slate-900 text-xs hover:text-emerald-700 underline truncate block"
                  >
                    {parcel.ownerEmail}
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded bg-slate-50 border border-slate-200 text-slate-600 flex items-start gap-2">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Privacy Notice:</strong> In accordance with Digital Personal Data Protection (DPDP) and statutory land governance norms, direct landowner contact details are concealed on the public portal and visible only to authorized government officers (SLARO, Tehsildar, CALA).
                </div>
              </div>
            )}
          </div>

          {/* Location & Jurisdiction Details */}
          <div className="border border-slate-200 rounded p-4 bg-white space-y-2">
            <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-[#123B63]" />
              <span>Location & Administrative Jurisdiction</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Village:</span>
                <span className="font-semibold text-slate-900">{parcel.village}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Taluka / Tehsil:</span>
                <span className="font-semibold text-slate-900">{parcel.taluka}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">District:</span>
                <span className="font-semibold text-slate-900">{parcel.district}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">State:</span>
                <span className="font-semibold text-slate-900">{parcel.state}</span>
              </div>
            </div>
            <div className="pt-1.5 text-[11px] text-slate-600">
              <strong>Acquiring Infrastructure Project:</strong> {parcel.projectName}
            </div>
          </div>

          {/* Statutory Gazette Notice Details */}
          <div className="border border-slate-200 rounded p-4 bg-white space-y-2.5">
            <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#123B63]" />
              <span>Statutory Gazette Notifications & SLAO Record</span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 gap-1">
                <div>
                  <span className="font-bold text-slate-800">Section 11 Preliminary Notification:</span>
                  <span className="font-mono text-slate-700 ml-1.5">{parcel.noticeDetails.sec11NoticeNo}</span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono">Published: {parcel.noticeDetails.sec11Date}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 gap-1">
                <div>
                  <span className="font-bold text-slate-800">Section 19 Statutory Declaration:</span>
                  <span className="font-mono text-slate-700 ml-1.5">{parcel.noticeDetails.sec19NoticeNo}</span>
                </div>
                <span className="text-slate-500 text-[11px] font-mono">Published: {parcel.noticeDetails.sec19Date}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 gap-1">
                <div>
                  <span className="font-bold text-slate-800">Section 23 Land Award Schedule:</span>
                  <span className="font-mono text-slate-700 ml-1.5">{parcel.noticeDetails.awardNoticeDate}</span>
                </div>
                <span className="text-emerald-700 text-[11px] font-semibold">Award Hearing Timetable</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 pt-1">
              <strong>Issuing Office:</strong> {parcel.noticeDetails.slaoOffice} &bull; Gazette Ref: {parcel.noticeDetails.gazetteRef}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Source: Digital Revenue Record (BhooNiti Master Database)
          </div>
          <div className="flex items-center gap-2">
            {onLocateOnMap && (
              <button
                onClick={() => {
                  onClose();
                  onLocateOnMap(parcel);
                }}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-xs inline-flex items-center gap-1.5 transition shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Locate on Land Map</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded font-semibold text-xs inline-flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back / Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
