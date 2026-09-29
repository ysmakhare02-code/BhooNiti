import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Shield,
  Bell,
  User,
  Globe,
  Contrast,
  ChevronDown,
  CheckCircle,
  LogOut,
  Building,
  KeyRound,
  Search,
} from 'lucide-react';
import { Language, UserRole, AuthUser, Project } from '../types';
import { translations, roleDescriptions, SUPPORTED_LANGUAGES } from '../data/translations';
import { getScopedProjects } from '../data/permissions';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  currentUser: AuthUser;
  projects?: Project[];
  onSelectProject?: (projectId: string) => void;
  highContrast: boolean;
  onToggleContrast: () => void;
  unreadAlertsCount: number;
  onNavigateAlerts: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onLanguageChange,
  currentUser,
  projects = [],
  onSelectProject,
  highContrast,
  onToggleContrast,
  unreadAlertsCount,
  onNavigateAlerts,
  onLogout,
}) => {
  const t = translations[currentLang];
  const roleInfo = roleDescriptions[currentUser.role] || roleDescriptions.DISTRICT_OFFICER;
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Scoped projects for header search
  const scopedProjects = useMemo(() => {
    return getScopedProjects(projects, currentUser);
  }, [projects, currentUser]);

  const matchingProjects = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return scopedProjects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          p.agency.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery, scopedProjects]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      {/* GIGW Accessibility & Information Banner */}
      <div className="bg-[#0b243d] text-white text-xs py-1 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 border-b border-blue-900/50">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold tracking-wide uppercase text-[11px] text-amber-300">
            {t.prototypeBanner}
          </span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="hidden md:inline text-slate-300 text-[11px]">
            {t.notOfficialNotice}
          </span>
        </div>

        {/* Accessibility Toolbar */}
        <div className="flex items-center gap-4 text-xs">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:bg-white focus:text-[#123B63] focus:px-2 focus:py-0.5 focus:rounded text-xs font-semibold"
          >
            {t.skipToContent}
          </a>

          {/* High Contrast Toggle */}
          <button
            onClick={onToggleContrast}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              highContrast
                ? 'bg-amber-400 text-black border-amber-400 font-bold'
                : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Contrast className="w-3.5 h-3.5" />
            <span className="text-[11px]">
              {highContrast ? t.normalContrast : t.highContrast}
            </span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="bg-[#123B63] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-sm">
            <div className="relative">
              <Shield className="w-6 h-6 text-amber-400 fill-amber-400/20 stroke-[1.8]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-300 stroke-[2.5]" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-serif">
                {t.appName}
              </span>
            </div>
            <p className="text-xs text-blue-100/80 font-normal hidden sm:block max-w-xl truncate">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Center / Search Section: Scoped Project Search */}
        <div ref={searchRef} className="relative hidden md:block flex-1 max-w-xs sm:max-w-sm lg:max-w-md mx-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-blue-200 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder={`Search ${currentUser.scope.district || currentUser.scope.state || currentUser.scope.agency || 'all'} projects...`}
              className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-blue-200/70 text-xs pl-8 pr-3 py-1.5 rounded border border-white/20 focus:border-amber-400 focus:outline-none transition"
            />
          </div>

          {/* Quick Search Dropdown */}
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-1 bg-white rounded shadow-xl border border-slate-200 text-slate-800 z-50 text-xs overflow-hidden max-h-72 overflow-y-auto">
              <div className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 flex items-center justify-between">
                <span>Scoped Projects ({matchingProjects.length})</span>
                <span className="font-normal text-slate-400">Jurisdiction: {currentUser.jurisdiction.split(',')[0]}</span>
              </div>
              {matchingProjects.length === 0 ? (
                <div className="p-3 text-center text-slate-500 text-xs">
                  No projects matching &ldquo;{searchQuery}&rdquo; within your statutory scope.
                </div>
              ) : (
                matchingProjects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (onSelectProject) {
                        onSelectProject(p.id);
                      }
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2.5 hover:bg-blue-50 border-b border-slate-100 flex items-center justify-between gap-2 transition"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-[#123B63]">
                          {p.id}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1 rounded font-medium">
                          {p.district}, {p.state}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-slate-900 truncate max-w-xs">
                        {p.name}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          p.riskLevel === 'CRITICAL'
                            ? 'bg-red-100 text-[#C62828]'
                            : p.riskLevel === 'HIGH'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.delayProbability}%
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Section: Language, Role Display, Alerts, Profile Menu, Direct Logout */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded text-xs font-medium border border-white/20 transition cursor-pointer"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-blue-200" />
              <span className="font-semibold">
                {SUPPORTED_LANGUAGES.find((l) => l.code === currentLang)?.nativeName || 'English'}
              </span>
              <ChevronDown className="w-3 h-3 text-blue-200" />
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-1 w-52 max-h-80 overflow-y-auto bg-white rounded shadow-xl border border-slate-200 py-1 text-slate-800 z-50 text-xs">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center justify-between transition cursor-pointer ${
                      currentLang === lang.code ? 'bg-blue-50 font-bold text-[#123B63]' : ''
                    }`}
                  >
                    <span>{lang.nativeName} ({lang.label})</span>
                    {currentLang === lang.code && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Authenticated Role & Jurisdiction Pill (Fixed Role, No Switching) */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded border border-white/25 transition text-left"
              title="View Officer Profile & Account Info"
              aria-label="Officer Profile and Account Info"
            >
              <div className="w-6 h-6 rounded bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name.slice(0, 1)}
              </div>
              <div className="hidden sm:block">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 leading-tight">
                  {currentUser.role.replace(/_/g, ' ')}
                </div>
                <div className="text-xs font-semibold text-white leading-tight truncate max-w-[130px]">
                  {currentUser.jurisdiction.split(',')[0]}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-blue-200 ml-0.5" />
            </button>

            {/* Profile & Account Info Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden text-xs">
                {/* Header: Authenticated Officer info */}
                <div className="p-4 bg-[#0d2a47] text-white border-b border-blue-900">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                      {currentUser.role.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-blue-200 font-mono">
                      {currentUser.username}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white font-serif mt-1">
                    {currentUser.name}
                  </div>
                  <div className="text-xs text-blue-200 mt-0.5 font-medium">
                    {currentUser.title}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{currentUser.dept}</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">&bull;</span>
                    <span>Jurisdiction: <strong>{currentUser.jurisdiction}</strong></span>
                  </div>
                </div>

                {/* Account Details & Session Security */}
                <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Statutory Bound Session
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Role Enforcement:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Active (Fixed)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Assigned Scope:</span>
                    <span className="font-semibold text-slate-800">
                      {currentUser.scope.district
                        ? `District: ${currentUser.scope.district}`
                        : currentUser.scope.state
                        ? `State: ${currentUser.scope.state}`
                        : currentUser.scope.agency
                        ? `Agency: ${currentUser.scope.agency}`
                        : 'National (All Projects)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Audit Trail:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Append-Only
                    </span>
                  </div>
                </div>

                {/* Direct Logout Option in Dropdown */}
                <div className="p-2.5 bg-white">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-[#C62828] border border-red-200 py-2 px-3 rounded font-bold transition text-xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out (Switch Account)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Alert Center Trigger */}
          <button
            onClick={onNavigateAlerts}
            className="relative p-2 rounded bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
            title="View Early-Warning Alerts"
            aria-label="Early Warning Alerts"
          >
            <Bell className="w-4 h-4 text-white" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full border border-white">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Prompt Mandate: Direct Logout Button in Header Bar */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-700 text-white px-2.5 py-1.5 rounded text-xs font-semibold border border-red-500 transition shadow-xs"
            title="Sign Out of BhooNiti"
            aria-label="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
