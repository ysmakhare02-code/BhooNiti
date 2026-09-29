import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ProjectListView } from './components/ProjectListView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { RiskMapView } from './components/RiskMapView';
import { AlertsView } from './components/AlertsView';
import { ReportsView } from './components/ReportsView';
import { MLDashboardView } from './components/MLDashboardView';
import { AdminAuditView } from './components/AdminAuditView';
import { LoginScreen } from './components/LoginScreen';
import { AccessRestrictedView } from './components/AccessRestrictedView';
import { CitizenDashboardView } from './components/CitizenDashboardView';
import { LandMapView } from './components/LandMapView';
import { OfficerComplaintsView } from './components/OfficerComplaintsView';
import { OfficerCitizensView } from './components/OfficerCitizensView';
import { ParcelInfoModal } from './components/ParcelInfoModal';
import { LandParcel } from './data/citizenData';

import { Project, AlertNotification, Language, UserRole, AuthUser } from './types';
import { initialProjects, initialAlerts } from './data/mockProjects';
import { generateAlerts } from './data/alerts';
import { translations, setupAutoTranslation } from './data/translations';
import { isTabPermitted } from './data/auth';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'signin' | 'register'>('signin');

  const [currentRole, setCurrentRole] = useState<UserRole>('DISTRICT_OFFICER');
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [alerts, setAlerts] = useState<AlertNotification[]>(initialAlerts);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>('');
  const [selectedParcelForDossier, setSelectedParcelForDossier] = useState<LandParcel | null>(null);

  const t = translations[currentLang];

  // Set HTML lang/dir attribute dynamically and attach real-time universal translation engine
  useEffect(() => {
    document.documentElement.lang = currentLang;
    const cleanup = setupAutoTranslation(() => currentLang);
    return cleanup;
  }, [currentLang]);

  const selectedProject = React.useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  const [tabHistory, setTabHistory] = useState<NavigationTab[]>([]);
  const [projectSourceTab, setProjectSourceTab] = useState<NavigationTab>('projects');

  const handleSelectTab = (tab: NavigationTab) => {
    if (tab !== currentTab) {
      setTabHistory((prev) => [...prev, currentTab]);
      setSelectedProjectId(null);
      setCurrentTab(tab);
    }
  };

  const handleBackTab = () => {
    if (tabHistory.length > 0) {
      const prev = tabHistory[tabHistory.length - 1];
      setTabHistory((h) => h.slice(0, -1));
      setSelectedProjectId(null);
      setCurrentTab(prev);
    } else {
      setSelectedProjectId(null);
      setCurrentTab('dashboard');
    }
  };

  const getPreviousTabLabel = () => {
    const prev = tabHistory.length > 0 ? tabHistory[tabHistory.length - 1] : 'dashboard';
    switch (prev) {
      case 'dashboard':
        return 'Back to Dashboard';
      case 'projects':
        return 'Back to Projects Registry';
      case 'risk-map':
        return 'Back to Risk Map';
      case 'land-map':
        return 'Back to GIS Land Map';
      case 'alerts':
        return 'Back to Early Warning Alerts';
      case 'complaints':
        return 'Back to Public Complaints';
      case 'citizens':
        return 'Back to Citizens Registry';
      case 'reports':
        return 'Back to Strategic Reports';
      case 'ml-dashboard':
        return 'Back to Model & Data Health';
      case 'admin-audit':
        return 'Back to Audit Trail & Admin';
      default:
        return 'Back';
    }
  };

  const getProjectSourceTabLabel = (srcTab: NavigationTab) => {
    switch (srcTab) {
      case 'dashboard':
        return 'Back to Dashboard';
      case 'alerts':
        return 'Back to Early Warning Alerts';
      case 'risk-map':
        return 'Back to Risk Map';
      case 'reports':
        return 'Back to Strategic Reports';
      case 'projects':
      default:
        return 'Back to Projects Registry';
    }
  };

  const handleSelectProject = (projectId: string) => {
    setProjectSourceTab(currentTab);
    setSelectedProjectId(projectId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setCurrentTab(projectSourceTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => {
      const nextProjects = prev.map((p) => (p.id === updated.id ? updated : p));
      setAlerts((currentAlerts) => {
        const readIds = new Set(currentAlerts.filter((a) => a.isRead).map((a) => a.id));
        const newAlerts = generateAlerts(nextProjects, currentUser);
        return newAlerts.map((a) => (readIds.has(a.id) ? { ...a, isRead: true } : a));
      });
      return nextProjects;
    });
  };

  const handleMarkAlertAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsAuthenticated(true);
    setLogoutNotice(null);
    setSelectedProjectId(null);
    setCurrentTab('dashboard');
    setLoginMode('signin');
    setAlerts(generateAlerts(projects, user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedProjectId(null);
    setCurrentTab('dashboard');
    setLoginMode('signin');
    setLogoutNotice('You have been signed out.');
    setAlerts(generateAlerts(projects, null));
  };

  const handleSwitchDemoAccount = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedProjectId(null);
    setCurrentTab('dashboard');
    setLoginMode('signin');
    setLogoutNotice('Select an account below and click Sign In to authenticate.');
  };

  const handleRegisterNewAccount = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedProjectId(null);
    setCurrentTab('dashboard');
    setLoginMode('register');
    setLogoutNotice('Complete the registration form to create and sign in with a new officer account.');
  };

  // If not authenticated, render the dedicated Sign-In screen
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginScreen
        projects={projects}
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast(!highContrast)}
        onLoginSuccess={handleLoginSuccess}
        loggedOutNotice={logoutNotice}
        onClearLogoutNotice={() => setLogoutNotice(null)}
        initialMode={loginMode}
        onModeChange={setLoginMode}
      />
    );
  }

  // Check if currentTab is permitted under RBAC
  const isCurrentTabPermitted = isTabPermitted(currentUser.role, currentTab);

  return (
    <div
      className={`min-h-screen flex flex-col font-sans ${
        highContrast ? 'contrast-125 bg-black text-white' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Header */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        currentUser={currentUser}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast(!highContrast)}
        unreadAlertsCount={unreadAlertsCount}
        onNavigateAlerts={() => {
          setSelectedProjectId(null);
          setCurrentTab('alerts');
        }}
        onLogout={handleLogout}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          currentLang={currentLang}
          currentRole={currentUser.role}
          unreadAlertsCount={unreadAlertsCount}
        />

        {/* Dynamic Main Workspace Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 sm:p-6 focus:outline-none"
        >
          {currentUser.role === 'CITIZEN' ? (
            <CitizenDashboardView
              currentUser={currentUser}
              onLogout={handleLogout}
              currentLang={currentLang}
            />
          ) : selectedProject ? (
            <ProjectDetailView
              project={selectedProject}
              currentLang={currentLang}
              currentRole={currentUser.role}
              currentUser={currentUser}
              onBack={handleBackToProjects}
              backLabel={getProjectSourceTabLabel(projectSourceTab)}
              onUpdateProject={handleUpdateProject}
            />
          ) : !isCurrentTabPermitted ? (
            <AccessRestrictedView
              attemptedTab={currentTab}
              currentUser={currentUser}
              onReturnToDashboard={() => setCurrentTab('dashboard')}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  projects={projects}
                  alerts={alerts}
                  currentLang={currentLang}
                  currentUser={currentUser}
                  onSelectProject={handleSelectProject}
                  onViewAllProjects={() => handleSelectTab('projects')}
                  onViewAllAlerts={() => handleSelectTab('alerts')}
                />
              )}

              {currentTab === 'projects' && (
                <ProjectListView
                  projects={projects}
                  currentLang={currentLang}
                  currentUser={currentUser}
                  onSelectProject={handleSelectProject}
                  initialSearchQuery={projectSearchQuery}
                />
              )}

              {currentTab === 'risk-map' && (
                <RiskMapView
                  projects={projects}
                  currentLang={currentLang}
                  currentUser={currentUser}
                  onSelectProject={handleSelectProject}
                />
              )}

              {currentTab === 'land-map' && (
                <LandMapView
                  onOpenParcelDossier={(parcel) => setSelectedParcelForDossier(parcel)}
                  currentRole={currentUser.role}
                  onBack={tabHistory.length > 0 ? handleBackTab : undefined}
                  backLabel={tabHistory.length > 0 ? getPreviousTabLabel() : undefined}
                />
              )}

              {currentTab === 'alerts' && (
                <AlertsView
                  alerts={alerts}
                  currentLang={currentLang}
                  currentUser={currentUser}
                  onSelectProject={handleSelectProject}
                  onMarkAsRead={handleMarkAlertAsRead}
                />
              )}

              {currentTab === 'complaints' && (
                <OfficerComplaintsView
                  currentRole={currentUser.role}
                  onOpenMapParcel={() => handleSelectTab('land-map')}
                />
              )}

              {currentTab === 'citizens' && (
                <OfficerCitizensView currentUser={currentUser} />
              )}

              {currentTab === 'reports' && (
                <ReportsView
                  projects={projects}
                  currentLang={currentLang}
                  currentUser={currentUser}
                  onSelectProject={handleSelectProject}
                />
              )}

              {currentTab === 'ml-dashboard' && (
                <MLDashboardView
                  projects={projects}
                  currentLang={currentLang}
                  currentUser={currentUser}
                />
              )}

              {currentTab === 'admin-audit' && (
                <AdminAuditView
                  projects={projects}
                  currentLang={currentLang}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Parcel Info Dossier Modal for Officers */}
      {selectedParcelForDossier && (
        <ParcelInfoModal
          parcel={selectedParcelForDossier}
          onClose={() => setSelectedParcelForDossier(null)}
          currentRole={currentUser.role}
          onLocateOnMap={() => {
            setSelectedParcelForDossier(null);
            handleSelectTab('land-map');
          }}
        />
      )}

      {/* Official GIGW / Statutory Disclaimer Footer */}
      <footer className="bg-[#0b243d] text-slate-400 text-xs py-3 px-4 sm:px-6 border-t border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="space-y-1 max-w-4xl">
          <p className="text-slate-300 font-medium">
            <strong>BhooNiti:</strong> AI-powered early-warning and decision-support layer for land-acquisition projects. It analyzes authorized project data, predicts potential delay risk, explains contributing factors, provides possible interventions for officer review, and supports continuous monitoring. It does not replace statutory land-acquisition systems or authorized government decision-makers.
          </p>
          <p className="text-[11px] text-slate-400">
            Designed in alignment with GIGW 3.0 principles & WCAG 2.1 Level AA accessibility standards.
          </p>
        </div>

        <div className="text-right text-[11px] text-slate-400 shrink-0">
          <div>Bhumi-Raksha Portal</div>
          <div>Indian Standard Time (IST)</div>
        </div>
      </footer>
    </div>
  );
}
