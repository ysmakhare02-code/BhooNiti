import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Send,
  Scale,
  MapPin,
  ExternalLink,
  ArrowLeft,
  Copy,
  Check,
  Building,
  User,
  Phone,
  Mail,
  ChevronRight,
  ShieldCheck,
  Layers,
  ArrowRight,
  Lock,
  Unlock,
  KeyRound,
  RotateCcw,
  CheckCircle,
  Calendar,
  Building2,
  FolderKanban,
  Info,
  Shield,
  HelpCircle,
  FileCheck2,
  ChevronDown,
} from 'lucide-react';
import {
  LandParcel,
  sampleLandParcels,
  getParcelById,
  getCitizenById,
  getParcelsByLandOwnerId,
  getProjectOverviewInfo,
  ProjectOverviewInfo,
} from '../data/citizenData';
import {
  Complaint,
  ComplaintCategory,
  saveComplaint,
  findComplaint,
  getStoredComplaints,
} from '../data/complaintsData';
import {
  solutionsData,
  STATUTORY_LEGAL_DISCLAIMER,
  SolutionCategoryDetail,
} from '../data/solutionsData';
import { ParcelInfoModal } from './ParcelInfoModal';
import { LandMapView } from './LandMapView';
import { Language, AuthUser } from '../types';

interface CitizenDashboardViewProps {
  currentUser?: AuthUser | null;
  onLogout: () => void;
  currentLang?: Language;
}

export type CitizenTab =
  | 'project-overview'
  | 'my-land-details'
  | 'complaint-form'
  | 'track-complaint'
  | 'solutions'
  | 'land-map';

export const CitizenDashboardView: React.FC<CitizenDashboardViewProps> = ({
  currentUser,
  onLogout,
  currentLang = 'en',
}) => {
  // 1. RESOLVE LOGGED-IN CITIZEN
  const citizenId =
    currentUser?.citizenId ||
    (currentUser?.username === 'citizen_owner' ? 'CIT-001' : 'CIT-002');

  const citizenRecord = useMemo(() => getCitizenById(citizenId), [citizenId]);

  // 2. IMPORTANT OWNERSHIP RULE:
  // A citizen is NOT automatically a land owner.
  // A citizen is a land owner ONLY when: loggedInCitizen.citizenId === landParcel.landOwnerId
  // Use Citizen ID / Land Owner ID. Never determine ownership using Name, Email, Mobile, or Address!
  const ownedParcels = useMemo(() => getParcelsByLandOwnerId(citizenId), [citizenId]);
  const isLandOwner = ownedParcels.length > 0;

  // Selected parcel for landowner (supports multiple parcels ownership)
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(
    isLandOwner ? ownedParcels[0] : null
  );

  // Synchronize selectedParcel when citizen changes
  useEffect(() => {
    if (isLandOwner && ownedParcels.length > 0) {
      if (!selectedParcel || !ownedParcels.some((p) => p.id === selectedParcel.id)) {
        setSelectedParcel(ownedParcels[0]);
      }
    } else {
      setSelectedParcel(null);
    }
  }, [citizenId, isLandOwner, ownedParcels]);

  // Navigation tab state with back history tracking and refresh persistence
  const [activeTab, setActiveTab] = useState<CitizenTab>(() => {
    try {
      const saved = sessionStorage.getItem('bhooniti_citizen_tab') as CitizenTab;
      return saved || 'project-overview';
    } catch {
      return 'project-overview';
    }
  });
  const [tabHistory, setTabHistory] = useState<CitizenTab[]>(['project-overview']);

  const navigateToTab = (newTab: CitizenTab) => {
    if (newTab !== activeTab) {
      setTabHistory((prev) => [...prev, activeTab]);
      setActiveTab(newTab);
      try {
        sessionStorage.setItem('bhooniti_citizen_tab', newTab);
      } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBackNavigation = () => {
    if (tabHistory.length > 0) {
      const prev = tabHistory[tabHistory.length - 1];
      setTabHistory((h) => h.slice(0, -1));
      setActiveTab(prev);
      try {
        sessionStorage.setItem('bhooniti_citizen_tab', prev);
      } catch {}
    } else {
      setActiveTab('project-overview');
      try {
        sessionStorage.setItem('bhooniti_citizen_tab', 'project-overview');
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPreviousTabLabel = () => {
    const prev = tabHistory.length > 0 ? tabHistory[tabHistory.length - 1] : 'project-overview';
    switch (prev) {
      case 'my-land-details':
        return 'My Land Details';
      case 'complaint-form':
        return 'File Grievance';
      case 'track-complaint':
        return 'Track Grievance';
      case 'solutions':
        return 'Legal Remedies';
      case 'land-map':
        return 'GIS Land Map';
      case 'project-overview':
      default:
        return 'Project Overview';
    }
  };

  // Direct access to 'my-land-details' by non-landowners is handled explicitly in the render logic:
  // Authenticated && Citizen ID === Land Owner ID && OTP Verified are strictly required.
  // When a non-landowner directly navigates to 'my-land-details', an explicit Access Denied screen is displayed.

  // 3. OTP VERIFICATION STATE FOR "MY LAND DETAILS"
  // Authenticated Citizen && Citizen ID === Land Owner ID && OTP Verified (persisted per session)
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(`bhooniti_otp_verified_${citizenId}`) === 'true';
    } catch {
      return false;
    }
  });
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string>('742918');
  const [otpSuccessToast, setOtpSuccessToast] = useState<boolean>(false);
  const [showCitizenProfile, setShowCitizenProfile] = useState<boolean>(false);

  // Reset OTP status only if citizen account actually switches to a different citizen ID
  const prevCitizenIdRef = React.useRef(citizenId);
  useEffect(() => {
    if (prevCitizenIdRef.current !== citizenId) {
      prevCitizenIdRef.current = citizenId;
      setIsOtpVerified(false);
      try {
        sessionStorage.removeItem(`bhooniti_otp_verified_${citizenId}`);
      } catch {}
      setOtpInput('');
      setOtpError(null);
      setShowParcelModal(false);
    }
  }, [citizenId]);

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = otpInput.trim();
    if (!clean) {
      setOtpError('Please enter the 6-digit OTP code sent to your registered mobile.');
      return;
    }
    // Accept either the generated OTP or standard test code 123456
    if (clean === generatedOtp || clean === '123456') {
      setIsOtpVerified(true);
      try {
        sessionStorage.setItem(`bhooniti_otp_verified_${citizenId}`, 'true');
      } catch {}
      setOtpError(null);
      setOtpSuccessToast(true);
      setTimeout(() => setOtpSuccessToast(false), 4000);
    } else {
      setOtpError('Invalid OTP code. Please enter the 6-digit verification code sent to your registered mobile number.');
    }
  };

  const handleResendOtp = () => {
    const newOtp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(newOtp);
    setOtpInput('');
    setOtpError(null);
  };

  const handleLockLandDetails = () => {
    setIsOtpVerified(false);
    try {
      sessionStorage.removeItem(`bhooniti_otp_verified_${citizenId}`);
    } catch {}
    setOtpInput('');
    setOtpError(null);
    setOtpSuccessToast(false);
  };

  // Modal Dossier state
  const [showParcelModal, setShowParcelModal] = useState<boolean>(false);
  const [modalParcel, setModalParcel] = useState<LandParcel | null>(null);

  // Project Overview Data
  const projectOverview: ProjectOverviewInfo = useMemo(() => {
    return getProjectOverviewInfo(citizenRecord?.projectId || selectedParcel?.projectId);
  }, [citizenRecord, selectedParcel]);

  // Complaint Form State
  const [name, setName] = useState(citizenRecord?.fullName || '');
  const [phone, setPhone] = useState(
    citizenRecord?.mobileNumber ? citizenRecord.mobileNumber.replace(/\D/g, '').slice(-10) : ''
  );
  const [email, setEmail] = useState(citizenRecord?.email || '');
  const [parcelNumber, setParcelNumber] = useState(
    selectedParcel ? selectedParcel.parcelNumber : citizenRecord?.parcelNumber || ''
  );
  const [villageDistrict, setVillageDistrict] = useState(
    selectedParcel
      ? `${selectedParcel.village}, ${selectedParcel.district}`
      : citizenRecord
      ? `${citizenRecord.village}, ${citizenRecord.district}`
      : ''
  );
  const [category, setCategory] = useState<ComplaintCategory>('compensation');
  const [description, setDescription] = useState('');

  // Update complaint pre-fill when selectedParcel changes
  useEffect(() => {
    if (selectedParcel) {
      setParcelNumber(selectedParcel.parcelNumber);
      setVillageDistrict(`${selectedParcel.village}, ${selectedParcel.district}`);
    }
  }, [selectedParcel]);

  // Form Validation & Feedback
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [copiedRefId, setCopiedRefId] = useState(false);

  // Tracking State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedResult, setTrackedResult] = useState<Complaint | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);

  // Active solution category for viewing
  const [selectedSolutionCat, setSelectedSolutionCat] = useState<ComplaintCategory>('compensation');

  // Handle Complaint Submission with Validation
  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Full citizen name is required.';
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Please provide a valid 10-digit mobile number for SMS tracking.';
    }
    if (!email.trim() || !email.includes('@')) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!parcelNumber.trim()) errors.parcelNumber = 'Parcel / Gat / Survey number is required.';
    if (!villageDistrict.trim()) errors.villageDistrict = 'Village and District are required.';
    if (!description.trim() || description.trim().length < 15) {
      errors.description = 'Please describe your grievance in at least 15 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const saved = saveComplaint({
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim(),
      parcelNumber: parcelNumber.trim(),
      villageDistrict: villageDistrict.trim(),
      category,
      description: description.trim(),
    });

    setSubmittedComplaint(saved);
    setSelectedSolutionCat(category);
    setDescription('');
  };

  const handleCopyRefId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedRefId(true);
    setTimeout(() => setCopiedRefId(false), 2000);
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    const found = findComplaint(trackQuery);
    setTrackedResult(found);
    setTrackSearched(true);
  };

  const handleOpenDossier = (p: LandParcel) => {
    setModalParcel(p);
    setShowParcelModal(true);
  };

  const handleLocateOnMap = (p: LandParcel) => {
    setSelectedParcel(p);
    setActiveTab('land-map');
  };

  // Masking helpers for citizen privacy
  const maskedMobile = useMemo(() => {
    if (!citizenRecord?.mobileNumber) return '+91 98*** **192';
    const digits = citizenRecord.mobileNumber.replace(/\D/g, '');
    if (digits.length >= 10) {
      const last3 = digits.slice(-3);
      const first2 = digits.slice(-10, -8);
      return `+91 ${first2}*** **${last3}`;
    }
    return '+91 98*** **192';
  }, [citizenRecord]);

  const maskedEmail = useMemo(() => {
    if (!citizenRecord?.email) return 'v***@gmail.com';
    const parts = citizenRecord.email.split('@');
    if (parts.length === 2) {
      const namePart = parts[0];
      const visible = namePart.slice(0, 2);
      return `${visible}***@${parts[1]}`;
    }
    return 'c***@domain.com';
  }, [citizenRecord]);

  // Tab configuration: "My Land Details" is strictly visible ONLY to Landowners
  const navigationTabs: { id: CitizenTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'project-overview',
      label: 'Project Overview',
      icon: <FolderKanban className="w-4 h-4" />,
    },
    ...(isLandOwner
      ? [
          {
            id: 'my-land-details' as CitizenTab,
            label: 'My Land Details',
            icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
            badge: isOtpVerified ? 'Unlocked' : 'OTP Protected',
          },
        ]
      : []),
    {
      id: 'complaint-form',
      label: 'Grievance / Complaint Box',
      icon: <Send className="w-4 h-4" />,
    },
    {
      id: 'track-complaint',
      label: 'Track Complaint Status',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'solutions',
      label: 'Suggested Solutions & Legal Guidance',
      icon: <Scale className="w-4 h-4" />,
    },
    {
      id: 'land-map',
      label: 'Cadastral Land Map',
      icon: <MapPin className="w-4 h-4 text-emerald-600" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. CITIZEN WELCOME BANNER (Differentiates Landowner vs Non-Landowner) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#123B63] text-white text-[11px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">
              BhooNiti Citizen Portal
            </span>

            {isLandOwner ? (
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Landowner &bull; Citizen ID: {citizenId}</span>
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold px-2.5 py-0.5 rounded flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Public Citizen &bull; Citizen ID: {citizenId}</span>
              </span>
            )}

            <span className="text-xs text-slate-500 font-medium">
              {citizenRecord?.village ? `${citizenRecord.village}, ${citizenRecord.district}` : 'Public Portal'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
            {isLandOwner
              ? `Welcome, ${citizenRecord?.fullName || 'Landholder'}`
              : `Welcome, ${citizenRecord?.fullName || 'Resident Citizen'}`}
          </h1>

          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            {isLandOwner
              ? `You are logged in with verified ownership credentials. Access public infrastructure project overviews, explore cadastral GIS boundaries, or verify identity via OTP to access your confidential landholding and compensation records.`
              : `You are viewing statutory public project disclosures, environmental & SIA notifications, and public grievance mechanisms. No private land parcels are registered under Citizen ID ${citizenId}.`}
          </p>
        </div>

        {/* Ownership Status Card */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs space-y-1.5 shrink-0 min-w-[260px]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Account Authorization
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                isLandOwner ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isLandOwner ? 'Landowner Status' : 'Non-Landowner'}
            </span>
          </div>

          <div className="text-slate-800 text-xs">
            <span className="text-slate-500">Citizen ID: </span>
            <strong className="font-mono text-slate-900">{citizenId}</strong>
          </div>

          <div className="text-slate-800 text-xs">
            <span className="text-slate-500">Registered Parcels: </span>
            <strong className={isLandOwner ? 'text-emerald-700 font-bold' : 'text-slate-700'}>
              {ownedParcels.length > 0 ? `${ownedParcels.length} Parcels Owned` : 'None (Public Access Only)'}
            </strong>
          </div>

          {isLandOwner && (
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Private Land Data:</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  isOtpVerified ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {isOtpVerified ? (
                  <>
                    <Unlock className="w-3 h-3 text-emerald-600" />
                    <span>Unlocked (OTP)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Locked (Requires OTP)</span>
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Registered Citizen Record & Demographics (Requirement 1) */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setShowCitizenProfile(!showCitizenProfile)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <User className="w-4 h-4 text-[#123B63]" />
            <span className="text-xs font-bold text-slate-900">
              Registered Citizen Profile &amp; Demographics ({citizenId})
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300">
              Status: {citizenRecord?.accountStatus || 'ACTIVE'} &bull; {citizenRecord?.verificationStatus || 'VERIFIED'}
            </span>
          </div>
          <button
            type="button"
            className="text-xs text-[#123B63] hover:underline font-semibold flex items-center gap-1 shrink-0 ml-2"
          >
            <span>{showCitizenProfile ? 'Hide Profile' : 'View Citizen Details'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCitizenProfile ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showCitizenProfile && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in fade-in">
            <div>
              <span className="text-slate-500 text-[11px] block">Citizen ID:</span>
              <strong className="font-mono text-slate-900">{citizenRecord?.citizenId}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Full Name:</span>
              <strong className="text-slate-900">{citizenRecord?.fullName}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Registered Mobile:</span>
              <strong className="font-mono text-slate-800">{maskedMobile}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Email Address:</span>
              <strong className="font-mono text-slate-800">{maskedEmail}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Village:</span>
              <span className="text-slate-900 font-medium">{citizenRecord?.village}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Taluka / Tehsil:</span>
              <span className="text-slate-900 font-medium">{citizenRecord?.taluka}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">District &amp; State:</span>
              <span className="text-slate-900 font-medium">{citizenRecord?.district}, {citizenRecord?.state}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Residential Address:</span>
              <span className="text-slate-800 line-clamp-1">{citizenRecord?.address}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Project ID:</span>
              <strong className="font-mono text-[#123B63]">{citizenRecord?.projectId || 'PRJ-EXP-2026-001'}</strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Parcel / Survey Number:</span>
              <strong className="font-mono text-slate-900">
                {isLandOwner
                  ? ownedParcels.map((p) => p.parcelNumber).join(', ')
                  : 'None (Non-Landowner Resident)'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Verification &amp; Account Status:</span>
              <span className="font-semibold text-emerald-800">
                {citizenRecord?.verificationStatus} &bull; {citizenRecord?.accountStatus}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Registration Date:</span>
              <span className="font-mono text-slate-700">{citizenRecord?.registrationDate}</span>
            </div>
            {citizenRecord?.maskedAadhaar && (
              <div>
                <span className="text-slate-500 text-[11px] block">Aadhaar (Masked):</span>
                <span className="font-mono text-slate-700">{citizenRecord.maskedAadhaar}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. CITIZEN NAVIGATION MENU TABS */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2 text-xs">
        {navigationTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => navigateToTab(tab.id)}
              className={`px-4 py-2 rounded-t font-semibold transition flex items-center gap-2 ${
                isActive
                  ? 'bg-[#123B63] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 border-b-0'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : tab.badge === 'Unlocked'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Success notification for OTP verification */}
      {otpSuccessToast && (
        <div
          role="status"
          className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Two-Factor Authentication Successful:</strong> Identity confirmed for{' '}
              {citizenRecord?.fullName}. Private land parcel and compensation records unlocked.
            </span>
          </div>
          <button
            onClick={() => setOtpSuccessToast(false)}
            className="text-emerald-800 font-bold ml-2 text-xs hover:text-emerald-950"
          >
            &times;
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PROJECT OVERVIEW (Accessible to all: Landowners and Non-Landowners) */}
      {/* ========================================================================= */}
      {activeTab === 'project-overview' && (
        <div className="space-y-6">
          {/* Main Project Header Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#123B63] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    {projectOverview.projectId}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {projectOverview.currentStage}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Public Statutory Overview</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif mt-2">
                  {projectOverview.projectName}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>{projectOverview.location}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {isLandOwner && (
                  <button
                    onClick={() => navigateToTab('my-land-details')}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>View My Land Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => navigateToTab('land-map')}
                  className="px-3.5 py-2 bg-[#123B63] hover:bg-[#0e2f50] text-white font-semibold text-xs rounded transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Explore Cadastral GIS</span>
                </button>
              </div>
            </div>

            {/* Project Purpose */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#123B63]" />
                <span>Project Purpose & Public Necessity</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded border border-slate-200">
                {projectOverview.projectPurpose}
              </p>
            </div>

            {/* Key Project Statistics & Overall Progress */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3 rounded border border-slate-200 bg-white space-y-1 shadow-2xs">
                <span className="text-[11px] text-slate-500 block">Total Land Required:</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {projectOverview.totalLandRequiredHa} Ha
                </span>
                <span className="text-[10px] text-slate-500 block">Corridor Right-of-Way</span>
              </div>

              <div className="p-3 rounded border border-slate-200 bg-white space-y-1 shadow-2xs">
                <span className="text-[11px] text-slate-500 block">Land Acquired to Date:</span>
                <span className="text-base font-bold text-emerald-700 font-mono">
                  {projectOverview.totalLandAcquiredHa} Ha
                </span>
                <span className="text-[10px] text-emerald-800 font-semibold block">
                  {Math.round((projectOverview.totalLandAcquiredHa / projectOverview.totalLandRequiredHa) * 100)}% Acquired
                </span>
              </div>

              <div className="p-3 rounded border border-slate-200 bg-white space-y-1 shadow-2xs">
                <span className="text-[11px] text-slate-500 block">Affected Revenue Villages:</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {projectOverview.totalVillagesAffected} Villages
                </span>
                <span className="text-[10px] text-slate-500 block">In Haveli / Pune Tehsil</span>
              </div>

              <div className="p-3 rounded border border-slate-200 bg-white space-y-1 shadow-2xs">
                <span className="text-[11px] text-slate-500 block">Executing Authority:</span>
                <span className="text-xs font-bold text-slate-900 line-clamp-2">
                  {projectOverview.executingAgency}
                </span>
              </div>
            </div>

            {/* Overall Statutory Progress Bar */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Overall Statutory Acquisition Progression:
                </span>
                <strong className="text-emerald-700 font-bold text-sm">
                  {projectOverview.overallProgressPct}% Completed
                </strong>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${projectOverview.overallProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                <span>1. SIA Feasibility</span>
                <span>2. Sec 11 Notification</span>
                <span>3. Sec 19 Declaration</span>
                <span>4. Award Valuation</span>
                <span>5. Possession & Handover</span>
              </div>
            </div>
          </div>

          {/* Project Timeline & Milestones */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#123B63]" />
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                  Statutory Project Timeline & Milestone Schedule
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Official Gazetted Milestone Schedule
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {projectOverview.timelineMilestones.map((ms, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                    ms.status === 'Completed'
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                      : ms.status === 'In Progress'
                      ? 'bg-amber-50/60 border-amber-300 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        ms.status === 'Completed'
                          ? 'bg-emerald-600 text-white'
                          : ms.status === 'In Progress'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                    >
                      {ms.status === 'Completed' ? '✓' : index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{ms.milestone}</div>
                      <div className="text-[11px] text-slate-500">{ms.stage}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider ${
                        ms.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : ms.status === 'In Progress'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {ms.status}
                    </span>
                    <span className="font-mono text-slate-600 font-semibold min-w-[70px] text-right">
                      {ms.targetDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Expected / Projected Completion Information */}
            <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1 text-xs">
              <div className="font-bold text-[#123B63] flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Targeted Project Commissioning & Completion Information:</span>
              </div>
              <p className="text-slate-800 text-xs leading-relaxed font-medium">
                {projectOverview.projectedCompletion}
              </p>
            </div>
          </div>

          {/* General Acquisition Status & Legal Framework */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#123B63]" />
              <span>General Acquisition Status & Statutory Framework</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded border border-slate-200">
              {projectOverview.generalAcquisitionStatus}
            </p>

            {/* Non-Landowner Transparency Notice */}
            {!isLandOwner && (
              <div className="p-3.5 rounded bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-700" />
                  <span>Citizen Information Notice:</span>
                </div>
                <p className="text-[11px] text-amber-950 leading-relaxed">
                  You are viewing authorized public infrastructure disclosures. If you own property in this corridor and your parcel details are not visible, please contact the Special Land Acquisition Officer (SLARO) Haveli with your 7/12 extract or Gat number to update your official Landowner ID.
                </p>
                <div className="pt-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('my-land-details')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded transition cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Security Direct Access Test (Citizen ID: {citizenId}) &rarr;</span>
                  </button>
                  <span className="text-[10px] text-slate-500">
                    Tests security boundary: Direct route to private land details without Landowner ID
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY LAND DETAILS (OTP PROTECTED — STRICTLY FOR LANDOWNERS ONLY) */}
      {/* ========================================================================= */}
      {activeTab === 'my-land-details' && (
        !isLandOwner ? (
          /* ========================================================================= */
          /* SECURITY CHECK FAILURE: NON-LANDOWNER DIRECT ACCESS                       */
          /* Authenticated Citizen && Citizen ID === Land Owner ID (FAILED)            */
          /* ========================================================================= */
          <div className="bg-white border-2 border-red-300 rounded-lg p-6 sm:p-8 shadow-sm max-w-2xl mx-auto space-y-5">
            <div className="flex items-center gap-3 border-b border-red-100 pb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-red-600 font-bold uppercase tracking-wider block">
                  Security Protocol &bull; DPDP Act Compliance &bull; 403 Forbidden
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                  Access Denied — Landowner Verification Failed
                </h2>
              </div>
            </div>

            <div className="p-4 rounded bg-red-50/80 border border-red-200 text-xs text-red-950 space-y-2">
              <p className="font-semibold text-red-900">
                You do not hold registered land ownership credentials in this project corridor.
              </p>
              <p className="text-slate-700 leading-relaxed">
                Private land parcel measurements, compensation valuations, bank details, and statutory possession notices are protected confidential records. Access requires strict tripartite verification:
              </p>
            </div>

            {/* Tripartite Security Validation Matrix */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2.5 text-xs">
              <span className="text-xs font-bold text-slate-900 block border-b border-slate-200 pb-1.5">
                Underlying Access Logic Verification:
              </span>
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>1. Authenticated Citizen</span>
                </div>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                  PASS ({citizenRecord?.fullName || citizenId})
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>2. Citizen ID === Land Owner ID</span>
                </div>
                <span className="font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded text-[10px]">
                  FAILED ({citizenId} has no matching Land Owner ID)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>3. Two-Factor Authentication (OTP)</span>
                </div>
                <span className="font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded text-[10px]">
                  BLOCKED (Requires Landowner ID)
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900">
              <strong>Zero Private Information Disclosed:</strong> No survey numbers, compensation figures, bank records, or legal notices are exposed to non-landowners.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleBackNavigation}
                className="px-4 py-2 bg-[#123B63] hover:bg-[#0e2f50] text-white text-xs font-bold rounded transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Public Project Overview</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* ------------------------------------------------------------- */}
            {/* STEP 1: OTP VERIFICATION CHALLENGE (If NOT verified)          */}
            {/* ------------------------------------------------------------- */}
          {!isOtpVerified ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs max-w-2xl mx-auto space-y-6">
              {/* Top Back Navigation */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={handleBackNavigation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-[#123B63] hover:text-blue-900 border border-slate-300 rounded text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to {getPreviousTabLabel()}</span>
                </button>
                <span className="text-[11px] text-slate-500 font-mono">OTP Verification</span>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-amber-700" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                  Two-Factor Authentication (OTP) Required
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  In accordance with the Digital Personal Data Protection (DPDP) Act and statutory land record security guidelines, individual compensation determinations, survey measurements, and direct benefit transfer (DBT) accounts are private.
                </p>
              </div>

              {/* Citizen Details Card */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Registered Landowner:</span>
                  <strong className="text-slate-900 font-semibold">{citizenRecord?.fullName}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Citizen ID / Land Owner ID:</span>
                  <strong className="font-mono text-[#123B63]">{citizenId}</strong>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-medium">Registered Mobile Number:</span>
                  <strong className="font-mono text-slate-800">{maskedMobile}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Official Email:</span>
                  <strong className="font-mono text-slate-800">{maskedEmail}</strong>
                </div>
              </div>

              {/* Simulated Registered Mobile SMS Banner (for demonstration) */}
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-[#123B63] space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#123B63]" />
                    <span>Simulated Aadhaar / DigiLocker SMS Delivery</span>
                  </div>
                  <span className="text-[10px] bg-white text-[#123B63] px-1.5 py-0.2 rounded border border-blue-300 font-mono">
                    SMS Gateway Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 font-mono bg-white p-2.5 rounded border border-blue-100">
                  &ldquo;BhooNiti verification code is <strong>{generatedOtp}</strong> for Citizen ID {citizenId}. Valid for 10 minutes. Do not share this OTP with anyone.&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpInput(generatedOtp);
                      setOtpError(null);
                    }}
                    className="text-xs font-bold text-[#123B63] hover:underline flex items-center gap-1"
                  >
                    <span>Auto-fill Demo Code ({generatedOtp})</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs text-slate-600 hover:text-slate-900 underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Generate New Code</span>
                  </button>
                </div>
              </div>

              {/* OTP Input Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp-input" className="block text-xs font-bold text-slate-800 mb-1.5 text-center">
                    Enter 6-Digit Verification Code:
                  </label>
                  <div className="max-w-xs mx-auto">
                    <input
                      id="otp-input"
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => {
                        setOtpInput(e.target.value.replace(/\D/g, ''));
                        setOtpError(null);
                      }}
                      placeholder="• • • • • •"
                      className="w-full py-2.5 text-center font-mono text-xl tracking-[0.5em] font-bold rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#123B63] bg-white"
                      autoFocus
                    />
                  </div>
                  {otpError && (
                    <div className="mt-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded text-center flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#123B63] hover:bg-[#0e2f50] text-white font-bold text-xs sm:text-sm rounded transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Verify OTP & Unlock Records</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 text-center">
                  Tip: Use the simulated code above or test code <code>123456</code>.
                </p>
              </form>
            </div>
          ) : selectedParcel ? (
            /* ------------------------------------------------------------- */
            /* STEP 2: PRIVATE LAND DETAILS (Rendered when OTP is verified) */
            /* ------------------------------------------------------------- */
            <div className="space-y-6 animate-in fade-in">
              {/* Back Button Navigation */}
              <div className="flex items-center justify-between pb-1">
                <button
                  type="button"
                  onClick={handleBackNavigation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-[#123B63] hover:text-blue-900 border border-slate-300 rounded text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to {getPreviousTabLabel()}</span>
                </button>
                <span className="text-xs text-slate-500 font-mono">
                  Parcel: {selectedParcel.parcelNumber}
                </span>
              </div>

              {/* OTP Verified Header Status Bar with Lock Action */}
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-950">
                      Two-Factor Authentication Confirmed:
                    </span>{' '}
                    <span className="text-emerald-800">
                      Private statutory landholding records unlocked for <strong>{citizenRecord?.fullName}</strong> (Citizen ID: {citizenId}).
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLockLandDetails}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded border border-slate-300 text-xs flex items-center gap-1 shrink-0 self-start sm:self-auto"
                  title="Lock records to re-authenticate with OTP"
                >
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Lock Records</span>
                </button>
              </div>

              {/* ----------------------------------------------------------- */}
              {/* REQUIREMENT 5: MULTIPLE PARCELS SELECTOR                    */}
              {/* ----------------------------------------------------------- */}
              {ownedParcels.length > 1 && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#123B63]" />
                      <span>Multiple Parcels Registered Under Citizen ID {citizenId} ({ownedParcels.length} Parcels Owned):</span>
                    </span>
                    <span className="text-[10px] bg-blue-50 text-[#123B63] font-bold px-2 py-0.5 rounded border border-blue-200">
                      Select Parcel to Inspect
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ownedParcels.map((parcel) => {
                      const isSelected = selectedParcel.id === parcel.id;
                      return (
                        <button
                          key={parcel.id}
                          type="button"
                          onClick={() => setSelectedParcel(parcel)}
                          className={`p-3 rounded border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50/80 border-[#123B63] ring-1 ring-[#123B63] shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-white text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 text-xs">{parcel.parcelNumber}</span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                isSelected ? 'bg-[#123B63] text-white' : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {parcel.areaHectares} Ha
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            {parcel.village}, {parcel.district}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 font-medium">
                            Stage: <span className="font-semibold text-slate-800">{parcel.stage}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------- */}
              {/* REQUIREMENT 3B: ALL 10 PRIVATE LAND DETAILS                 */}
              {/* Strict Security: Authenticated && Citizen ID === Land Owner ID && OTP Verified */}
              {/* ----------------------------------------------------------- */}
              {!selectedParcel || selectedParcel.landOwnerId !== citizenId ? (
                <div className="bg-white border-2 border-red-300 rounded-lg p-6 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
                  <h3 className="font-bold text-slate-900 text-sm">Access Denied: Land Owner ID Mismatch</h3>
                  <p className="text-xs text-slate-600">The selected parcel does not belong to Citizen ID {citizenId}. No private information displayed.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                      Confidential Landholding Record &bull; {selectedParcel.id}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 font-serif mt-0.5">
                      {selectedParcel.parcelNumber} — Private Land & Compensation Dossier
                    </h2>
                    <span className="text-xs text-slate-600 block mt-0.5">
                      Owner: <strong>{selectedParcel.ownerName}</strong> &bull; Aadhaar (Masked):{' '}
                      <strong className="font-mono">{selectedParcel.ownerAadhaarMasked}</strong>
                    </span>
                  </div>

                  {/* REQUIREMENT 6: "My Parcel → View on GIS Map" Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleLocateOnMap(selectedParcel)}
                      className="px-4 py-2 bg-[#123B63] hover:bg-[#0e2f50] text-white text-xs font-bold rounded inline-flex items-center gap-2 transition shadow-xs"
                    >
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>My Parcel &rarr; View on GIS Map</span>
                    </button>
                  </div>
                </div>

                {/* 10 Required Private Land Information Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  {/* 1. Parcel / Survey Number */}
                  <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] text-slate-500 block">1. Parcel / Survey Number:</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {selectedParcel.parcelNumber}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Revenue Parcel ID: {selectedParcel.id}
                    </span>
                  </div>

                  {/* 2. Total Land Area */}
                  <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] text-slate-500 block">2. Total Land Area:</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {selectedParcel.totalLandAreaHectares.toFixed(2)} Ha ({selectedParcel.areaAcres.toFixed(2)} Acres)
                    </span>
                    <span className="text-[10px] text-slate-500 block">Total agricultural holding</span>
                  </div>

                  {/* 3. Acquired / Used Land Area */}
                  <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] text-slate-500 block">3. Acquired / Used Land Area:</span>
                    <span className="text-sm font-bold text-red-700 font-mono">
                      {selectedParcel.acquiredLandAreaHectares.toFixed(2)} Ha
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Required for RoW corridor alignment
                    </span>
                  </div>

                  {/* 4. Remaining Land Area */}
                  <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] text-slate-500 block">4. Remaining Land Area:</span>
                    <span className="text-sm font-bold text-emerald-700 font-mono">
                      {selectedParcel.remainingLandAreaHectares.toFixed(2)} Ha
                    </span>
                    <span className="text-[10px] text-slate-500 block">Retained by landholder</span>
                  </div>

                  {/* 5. Acquisition Status */}
                  <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1 sm:col-span-2">
                    <span className="text-[11px] text-slate-500 block">5. Acquisition Status & Stage:</span>
                    <span className="text-xs font-bold text-slate-900 block">
                      {selectedParcel.acquisitionStatus}
                    </span>
                    <span className="text-[10px] text-slate-600 block">
                      Current Stage: <strong>{selectedParcel.stage}</strong> under RFCTLARR Act 2013
                    </span>
                  </div>

                  {/* 6. Compensation Amount (Sanctioned) */}
                  <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] text-slate-500 block">6. Compensation Sanctioned:</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      ₹{selectedParcel.compensationSanctionedLakhs.toFixed(2)} Lakhs
                    </span>
                    <span className="text-[10px] text-slate-500 block">Determined under Sec 26-30 formula</span>
                  </div>

                  {/* 7. Expected Amount Payable */}
                  <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] text-slate-500 block">7. Expected Amount Payable:</span>
                    <span className="text-base font-bold text-[#123B63] font-mono">
                      ₹{selectedParcel.expectedAmountPayableLakhs.toFixed(2)} Lakhs
                    </span>
                    <span className="text-[10px] text-slate-500 block">Balance treasury DBT entitlement</span>
                  </div>

                  {/* 8. Payment / Compensation Status */}
                  <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1 sm:col-span-1">
                    <span className="text-[11px] text-slate-500 block">8. Payment / Compensation Status:</span>
                    <div className="text-xs font-bold text-emerald-800">
                      ₹{selectedParcel.compensationPaidLakhs.toFixed(2)} Lakhs Disbursed
                    </div>
                    <span className="text-[10px] text-slate-600 block">
                      {Math.round((selectedParcel.compensationPaidLakhs / Math.max(selectedParcel.compensationSanctionedLakhs, 1)) * 100)}% Released via DBT
                    </span>
                  </div>

                  {/* 9. Possession Status */}
                  <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] text-slate-500 block">9. Physical Possession Status:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${
                        selectedParcel.possessionStatus === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedParcel.possessionStatus === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedParcel.possessionStatus}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Section 38 Panchnama Status</span>
                  </div>

                  {/* 10. Handover Status */}
                  <div className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                    <span className="text-[11px] text-slate-500 block">10. Handover to Executing Agency:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${
                        selectedParcel.handoverStatus === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedParcel.handoverStatus === 'In Progress'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {selectedParcel.handoverStatus}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Corridor RoW Transfer Status</span>
                  </div>
                </div>

                {/* Compensation Disbursement Progress Bar */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Sanctioned Land Award: </span>
                      <strong className="text-slate-900">
                        ₹{selectedParcel.compensationSanctionedLakhs.toFixed(2)} Lakhs
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Directly Disbursed (DBT): </span>
                      <strong className="text-emerald-700">
                        ₹{selectedParcel.compensationPaidLakhs.toFixed(2)} Lakhs
                      </strong>
                    </div>
                    <div className="font-bold text-slate-800">
                      {Math.round((selectedParcel.compensationPaidLakhs / Math.max(selectedParcel.compensationSanctionedLakhs, 1)) * 100)}% Released
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((selectedParcel.compensationPaidLakhs / Math.max(selectedParcel.compensationSanctionedLakhs, 1)) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Award Valuation</span>
                    <span>Bank Mandate Verification</span>
                    <span>DBT Treasury Release</span>
                    <span>Possession Panchnama</span>
                  </div>
                </div>

                {/* Statutory Notice Details */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-[#123B63]" />
                    <span>Statutory Gazette Notices & Hearing References</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-800">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Section 11 Preliminary Notice:</span>
                      <strong className="font-mono text-slate-900">{selectedParcel.noticeDetails.sec11NoticeNo}</strong>
                      <span className="text-slate-500 text-[10px] block">Date: {selectedParcel.noticeDetails.sec11Date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Section 19 Declaration:</span>
                      <strong className="font-mono text-slate-900">{selectedParcel.noticeDetails.sec19NoticeNo}</strong>
                      <span className="text-slate-500 text-[10px] block">Date: {selectedParcel.noticeDetails.sec19Date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Gazette Publication:</span>
                      <span className="text-slate-800 text-[11px] font-semibold">{selectedParcel.noticeDetails.gazetteRef}</span>
                      <span className="text-slate-500 text-[10px] block">Award: {selectedParcel.noticeDetails.awardNoticeDate}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Designated Authority: </span>
                    <strong className="text-slate-800">{selectedParcel.noticeDetails.slaoOffice}</strong>
                  </div>
                </div>

                {/* Official Statutory Land Parcel Actions & Dossier */}
                <div className="pt-2">
                  <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-5 h-5 text-[#123B63]" />
                        <h3 className="text-sm font-bold text-slate-900 font-serif">
                          Official Land Parcel Statutory Dossier & GIS Services
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 max-w-xl">
                        Review verified survey measurements, gazette notifications, award determination details, and geospatial demarcations for Parcel {selectedParcel.parcelNumber}.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenDossier(selectedParcel)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#123B63] hover:bg-[#0e2f50] text-white text-xs font-semibold rounded transition shadow-xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Complete Parcel Dossier</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLocateOnMap(selectedParcel)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#123B63] border border-blue-200 text-xs font-semibold rounded transition cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Locate on GIS Map</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions for Landowner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div
                    onClick={() => navigateToTab('complaint-form')}
                    className="p-3.5 rounded border border-slate-200 hover:border-[#123B63] bg-white hover:bg-slate-50 cursor-pointer transition space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>File a Grievance</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Dispute compensation, report boundary overlap, or request notice hearing.
                    </p>
                  </div>

                  <div
                    onClick={() => navigateToTab('solutions')}
                    className="p-3.5 rounded border border-slate-200 hover:border-[#123B63] bg-white hover:bg-slate-50 cursor-pointer transition space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Legal & Procedural Guide</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Check required documents, Section 64 appeal timelines, and SLARO offices.
                    </p>
                  </div>

                  <div
                    onClick={() => handleLocateOnMap(selectedParcel)}
                    className="p-3.5 rounded border border-slate-200 hover:border-[#123B63] bg-white hover:bg-slate-50 cursor-pointer transition space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>View Cadastral Map</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Examine parcel polygon, Right of Way alignment, and nearby village roads.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    )
  )}

      {/* ========================================================================= */}
      {/* TAB 3: COMPLAINT FORM                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'complaint-form' && (
        <div className="bg-white border border-slate-200 rounded p-5 sm:p-6 shadow-xs space-y-6">
          {/* Back Navigation Button */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-[#123B63] hover:text-blue-900 border border-slate-300 rounded text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {getPreviousTabLabel()}</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              Citizen ID: {citizenId}
            </span>
          </div>

          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-[#123B63]" />
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                Citizen Grievance & Land Acquisition Complaint Form
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit formal representations under the statutory Citizen&apos;s Charter. All submissions receive an instant tracking ID and are directly transmitted to the District Land Acquisition Cell.
            </p>
          </div>

          {/* Submission Success Alert */}
          {submittedComplaint && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-3 animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Grievance Successfully Registered!</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Your complaint has been logged into the BhooNiti statutory registry and assigned to the Special Land Acquisition Officer.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSubmittedComplaint(null)}
                  className="text-xs text-emerald-700 hover:text-emerald-900 underline"
                >
                  Dismiss
                </button>
              </div>

              {/* Unique Reference ID Box */}
              <div className="p-3 bg-white rounded border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Unique Complaint Tracking Reference ID:
                  </span>
                  <span className="text-base font-bold font-mono text-[#123B63]">
                    {submittedComplaint.id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyRefId(submittedComplaint.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded inline-flex items-center gap-1.5 transition"
                  >
                    {copiedRefId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Ref ID</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setTrackQuery(submittedComplaint.id);
                      setTrackedResult(submittedComplaint);
                      setActiveTab('track-complaint');
                    }}
                    className="px-3 py-1.5 bg-[#123B63] hover:bg-[#0e2f50] text-white text-xs font-semibold rounded inline-flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Track Status Now</span>
                  </button>
                </div>
              </div>

              {/* Suggested Solutions Callout */}
              <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div>
                  <strong>Recommended Next Steps Available:</strong> Review documentation requirements and Section 64 appeal pathways for <em>{solutionsData[submittedComplaint.category]?.categoryLabel}</em>.
                </div>
                <button
                  onClick={() => {
                    setSelectedSolutionCat(submittedComplaint.category);
                    setActiveTab('solutions');
                  }}
                  className="px-2.5 py-1 bg-amber-800 text-white rounded text-[11px] font-semibold hover:bg-amber-900 shrink-0 ml-2"
                >
                  View Solutions
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleComplaintSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Citizen Name */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Full Name of Citizen / Landholder <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shri Ramesh Kisan Patil"
                    className={`w-full pl-9 pr-3 py-2 rounded border ${
                      formErrors.name ? 'border-red-500' : 'border-slate-300'
                    } focus:outline-none focus:ring-1 focus:ring-[#123B63] text-xs sm:text-sm`}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-red-600 text-[11px] mt-0.5">{formErrors.name}</p>
                )}
              </div>

              {/* Mobile Phone */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Mobile Number (10 Digits for SMS Tracking) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9822012345"
                    className={`w-full pl-9 pr-3 py-2 rounded border font-mono ${
                      formErrors.phone ? 'border-red-500' : 'border-slate-300'
                    } focus:outline-none focus:ring-1 focus:ring-[#123B63] text-xs sm:text-sm`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-red-600 text-[11px] mt-0.5">{formErrors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Email Address (For Acknowledgement Copy) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. citizen@gmail.com"
                    className={`w-full pl-9 pr-3 py-2 rounded border ${
                      formErrors.email ? 'border-red-500' : 'border-slate-300'
                    } focus:outline-none focus:ring-1 focus:ring-[#123B63] text-xs sm:text-sm`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-red-600 text-[11px] mt-0.5">{formErrors.email}</p>
                )}
              </div>

              {/* Parcel Number */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Parcel / Gat / Survey / Khasra Number <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={parcelNumber}
                    onChange={(e) => setParcelNumber(e.target.value)}
                    placeholder="e.g. Gat No. 104/2B"
                    className={`w-full pl-9 pr-3 py-2 rounded border ${
                      formErrors.parcelNumber ? 'border-red-500' : 'border-slate-300'
                    } focus:outline-none focus:ring-1 focus:ring-[#123B63] text-xs sm:text-sm font-mono`}
                  />
                </div>
                {formErrors.parcelNumber && (
                  <p className="text-red-600 text-[11px] mt-0.5">{formErrors.parcelNumber}</p>
                )}
              </div>

              {/* Village & District */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Village & District <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={villageDistrict}
                    onChange={(e) => setVillageDistrict(e.target.value)}
                    placeholder="e.g. Uruli Kanchan, Haveli, Pune"
                    className={`w-full pl-9 pr-3 py-2 rounded border ${
                      formErrors.villageDistrict ? 'border-red-500' : 'border-slate-300'
                    } focus:outline-none focus:ring-1 focus:ring-[#123B63] text-xs sm:text-sm`}
                  />
                </div>
                {formErrors.villageDistrict && (
                  <p className="text-red-600 text-[11px] mt-0.5">{formErrors.villageDistrict}</p>
                )}
              </div>

              {/* Grievance Category */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Grievance Category <span className="text-red-600">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#123B63] text-xs sm:text-sm bg-white font-medium"
                >
                  <option value="compensation">Compensation Discrepancy / Solatium Delay</option>
                  <option value="boundary">Boundary / Demarcation / Overlap Discrepancy</option>
                  <option value="ownership">Ownership / Mutation / Ferfar Title Dispute</option>
                  <option value="notice">Statutory Notice & Hearing Non-Receipt</option>
                  <option value="other">Rehabilitation & Resettlement (R&R) / Other</option>
                </select>
              </div>
            </div>

            {/* Grievance Description */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Detailed Description of Grievance <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="State your exact grounds of objection, dates of prior notices, discrepancy in award valuation or boundary measurement, and specific relief requested from the competent authority..."
                className={`w-full p-3 rounded border ${
                  formErrors.description ? 'border-red-500' : 'border-slate-300'
                } focus:outline-none focus:ring-1 focus:ring-[#123B63] text-xs sm:text-sm`}
              />
              {formErrors.description && (
                <p className="text-red-600 text-[11px] mt-0.5">{formErrors.description}</p>
              )}
            </div>

            {/* Statutory Disclaimer Note */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Statutory Acknowledgement Guarantee:</span>
              </div>
              <p>
                Under Section 64 of RFCTLARR Act 2013 and State Citizen Service Guarantees, every registered complaint is immutably archived with audit timestamp and served to the Special Land Acquisition Officer. Data is persisted in your browser and syncs to official oversight registers.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#123B63] hover:bg-[#0e2f50] text-white font-bold text-xs sm:text-sm rounded transition inline-flex items-center gap-2 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Submit Grievance & Generate Reference ID</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TRACK COMPLAINT                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'track-complaint' && (
        <div className="bg-white border border-slate-200 rounded p-5 sm:p-6 shadow-xs space-y-6">
          {/* Back Navigation Button */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-[#123B63] hover:text-blue-900 border border-slate-300 rounded text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {getPreviousTabLabel()}</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              Grievance Redressal
            </span>
          </div>

          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#123B63]" />
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                Track Grievance Redressal Status
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your unique Grievance Reference ID (e.g. <code>BHOONITI-GRV-2026-89412</code>) or your 10-digit mobile number to view real-time stage progress: <strong>Submitted &rarr; Under Review &rarr; Resolved</strong>.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder="Enter Reference ID or 10-Digit Mobile"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#123B63] font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-[#123B63] hover:bg-[#0e2f50] text-white font-bold text-xs sm:text-sm rounded transition inline-flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Track Grievance</span>
            </button>
          </form>

          {/* Results Display */}
          {trackSearched && !trackedResult && (
            <div className="p-5 rounded border border-amber-200 bg-amber-50 text-amber-900 text-xs space-y-1">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>No Grievance Record Found</span>
              </div>
              <p>
                No complaint matched the query &ldquo;<strong>{trackQuery}</strong>&rdquo;. Please verify the reference ID or phone number.
              </p>
              <div className="pt-2 text-[11px] text-amber-800">
                Try sample reference:{' '}
                <code
                  className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold cursor-pointer"
                  onClick={() => {
                    setTrackQuery('BHOONITI-GRV-2026-89412');
                    setTrackedResult(findComplaint('BHOONITI-GRV-2026-89412'));
                  }}
                >
                  BHOONITI-GRV-2026-89412
                </code>{' '}
                or{' '}
                <code
                  className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold cursor-pointer"
                  onClick={() => {
                    setTrackQuery('BHOONITI-GRV-2026-62189');
                    setTrackedResult(findComplaint('BHOONITI-GRV-2026-62189'));
                  }}
                >
                  BHOONITI-GRV-2026-62189
                </code>
              </div>
            </div>
          )}

          {trackedResult && (
            <div className="border border-slate-200 rounded-lg p-5 bg-white space-y-6 animate-in fade-in">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">
                    Grievance Reference Record
                  </span>
                  <h3 className="text-lg font-bold font-mono text-[#123B63]">
                    {trackedResult.id}
                  </h3>
                  <span className="text-xs text-slate-600 block mt-0.5">
                    Filed by: <strong>{trackedResult.name}</strong> &bull; Parcel:{' '}
                    <strong>{trackedResult.parcelNumber}</strong> ({trackedResult.villageDistrict})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                      trackedResult.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : trackedResult.status === 'Under Review'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}
                  >
                    Status: {trackedResult.status}
                  </span>
                </div>
              </div>

              {/* Visual 3-Stage Progress Tracker: Submitted -> Under Review -> Resolved */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Statutory Redressal Stages
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {/* Step 1: Submitted */}
                  <div
                    className={`p-3 rounded border flex flex-col items-center gap-1.5 transition ${
                      trackedResult.status === 'Submitted' ||
                      trackedResult.status === 'Under Review' ||
                      trackedResult.status === 'Resolved'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <span className="text-xs">1. Submitted</span>
                    <span className="text-[10px] text-slate-500">{trackedResult.submittedAt}</span>
                  </div>

                  {/* Step 2: Under Review */}
                  <div
                    className={`p-3 rounded border flex flex-col items-center gap-1.5 transition ${
                      trackedResult.status === 'Under Review' ||
                      trackedResult.status === 'Resolved'
                        ? 'border-amber-300 bg-amber-50 text-amber-950 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        trackedResult.status === 'Under Review' ||
                        trackedResult.status === 'Resolved'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-300 text-slate-600'
                      }`}
                    >
                      {trackedResult.status === 'Resolved' ? '✓' : '2'}
                    </div>
                    <span className="text-xs">2. Under Review</span>
                    <span className="text-[10px] text-slate-500">
                      {trackedResult.assignedOfficer || 'SLARO Office'}
                    </span>
                  </div>

                  {/* Step 3: Resolved */}
                  <div
                    className={`p-3 rounded border flex flex-col items-center gap-1.5 transition ${
                      trackedResult.status === 'Resolved'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        trackedResult.status === 'Resolved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 text-slate-600'
                      }`}
                    >
                      {trackedResult.status === 'Resolved' ? '✓' : '3'}
                    </div>
                    <span className="text-xs">3. Redressal Order</span>
                    <span className="text-[10px] text-slate-500">
                      {trackedResult.status === 'Resolved' ? 'Order Passed' : 'Pending Order'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grievance Details & Resolution */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[11px] block font-semibold">
                    Description of Grievance as Submitted:
                  </span>
                  <p className="text-slate-800 leading-relaxed italic">
                    &ldquo;{trackedResult.description}&rdquo;
                  </p>
                </div>

                {trackedResult.resolutionNotes && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded space-y-1.5 text-emerald-950">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Competent Authority Official Redressal Order:</span>
                    </div>
                    <p className="text-xs leading-relaxed">{trackedResult.resolutionNotes}</p>
                    <div className="text-[10px] text-emerald-800 font-mono pt-1">
                      Assigned to: {trackedResult.assignedOfficer} &bull; Updated:{' '}
                      {trackedResult.updatedAt}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: SOLUTIONS & LEGAL GUIDANCE                                         */}
      {/* ========================================================================= */}
      {activeTab === 'solutions' && (
        <div className="bg-white border border-slate-200 rounded p-5 sm:p-6 shadow-xs space-y-6">
          {/* Back Navigation Button */}
          <div className="flex items-center justify-between pb-1">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-[#123B63] hover:text-blue-900 border border-slate-300 rounded text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {getPreviousTabLabel()}</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">
              RFCTLARR 2013 Advisory
            </span>
          </div>

          <div className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#123B63]" />
              <h2 className="text-lg font-bold text-slate-900 font-serif">
                Statutory Solutions & Citizen Legal Guidance
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative procedural pathways, required evidentiary documents, and statutory appeal timelines under the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement (RFCTLARR) Act, 2013.
            </p>
          </div>

          {/* Legal Disclaimer Card */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded text-[11px] text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Scale className="w-3.5 h-3.5" />
              <span>Statutory Advisory Disclaimer:</span>
            </div>
            <p className="leading-relaxed">{STATUTORY_LEGAL_DISCLAIMER}</p>
          </div>

          {/* Solution Category Selector */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(
              Object.keys(solutionsData) as ComplaintCategory[]
            ).map((cat) => {
              const info = solutionsData[cat];
              const isSelected = selectedSolutionCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedSolutionCat(cat)}
                  className={`px-3.5 py-2 rounded text-xs font-semibold transition border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#123B63] text-white border-[#123B63] shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                >
                  <span>{info.categoryLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Solution Category Details */}
          <div className="border border-slate-200 rounded-lg p-5 space-y-5 bg-white">
            {(() => {
              const active = solutionsData[selectedSolutionCat];
              return (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-mono text-[#123B63] bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase font-bold">
                      {active.statutoryReference}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-serif mt-1.5">
                      {active.categoryLabel} — Procedural Redressal Guide
                    </h3>
                  </div>

                  {/* Summary & Overview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Statutory Framework Overview:
                    </h4>
                    <p className="text-xs text-slate-700 bg-slate-50/70 p-3 rounded border border-slate-200 leading-relaxed">
                      {active.summary}
                    </p>
                  </div>

                  {/* Documents Required */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#123B63]" />
                      Required Evidentiary Documentation:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {active.documentsNeeded.map((doc, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-start gap-2"
                        >
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-[#123B63] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-slate-800 text-[11px] leading-relaxed">
                            {doc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Appeal Process Workflow */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-[#123B63]" />
                      Statutory Appeal & Representation Milestones:
                    </h4>
                    <div className="space-y-2 text-xs">
                      {active.appealProcess.map((step) => (
                        <div
                          key={step.step}
                          className="p-3 rounded border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#123B63] text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {step.step}
                            </span>
                            <p className="text-slate-800 text-xs leading-relaxed">
                              {step.action}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-amber-800 shrink-0 self-start">
                            {step.timeline}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Authority to Contact */}
                  <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#123B63]">
                      <Building className="w-4 h-4" />
                      <span>Competent Authority to Contact:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500 block">Designated Official:</span>
                        <strong className="text-slate-900 text-xs">{active.authorityToContact.title}</strong>
                        <span className="text-slate-600 block mt-0.5">{active.authorityToContact.office}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Typical Physical Office Location:</span>
                        <span className="text-slate-800">{active.authorityToContact.typicalLocation}</span>
                        <span className="text-emerald-800 font-bold block mt-0.5">
                          Helpline: {active.authorityToContact.officialHelpline}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CADASTRAL LAND MAP                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'land-map' && (
        <LandMapView
          initialParcelId={selectedParcel ? selectedParcel.id : sampleLandParcels[0].id}
          onOpenParcelDossier={handleOpenDossier}
          isCitizenView={true}
          onBack={handleBackNavigation}
          backLabel={`Back to ${getPreviousTabLabel()}`}
        />
      )}

      {/* Parcel Info Dossier Modal */}
      {showParcelModal && modalParcel && (
        <ParcelInfoModal
          parcel={modalParcel}
          onClose={() => setShowParcelModal(false)}
          currentRole="CITIZEN"
          citizenId={citizenId}
          onLocateOnMap={handleLocateOnMap}
        />
      )}
    </div>
  );
};
