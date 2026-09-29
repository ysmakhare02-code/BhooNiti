import { UserRole, AuthUser, Project } from '../types';
import { NavigationTab } from '../components/Sidebar';

export interface RolePermissions {
  tabs: NavigationTab[];
  canUpdateData: boolean;
  canVerify: boolean;
  canRecordDecision: boolean;
  canCreateAction: boolean;
  canViewAudit: boolean;
  canViewModel: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  DISTRICT_OFFICER: {
    tabs: ['dashboard', 'projects', 'risk-map', 'land-map', 'alerts', 'complaints', 'citizens', 'reports'],
    canUpdateData: false,
    canVerify: false,
    canRecordDecision: false,
    canCreateAction: true,
    canViewAudit: false,
    canViewModel: false,
  },
  STATE_OFFICER: {
    tabs: ['dashboard', 'projects', 'risk-map', 'land-map', 'alerts', 'complaints', 'citizens', 'reports'],
    canUpdateData: false,
    canVerify: false,
    canRecordDecision: false,
    canCreateAction: true,
    canViewAudit: false,
    canViewModel: false,
  },
  PROJECT_OFFICER: {
    tabs: ['dashboard', 'projects', 'risk-map', 'land-map', 'alerts', 'complaints', 'citizens', 'reports'],
    canUpdateData: true,
    canVerify: false,
    canRecordDecision: false,
    canCreateAction: true,
    canViewAudit: false,
    canViewModel: false,
  },
  VERIFICATION_OFFICER: {
    tabs: ['dashboard', 'projects', 'risk-map', 'land-map', 'alerts', 'complaints', 'citizens', 'reports'],
    canUpdateData: false,
    canVerify: true,
    canRecordDecision: false,
    canCreateAction: false,
    canViewAudit: false,
    canViewModel: false,
  },
  COMPETENT_AUTHORITY: {
    tabs: ['dashboard', 'projects', 'risk-map', 'land-map', 'alerts', 'complaints', 'citizens', 'reports'],
    canUpdateData: false,
    canVerify: false,
    canRecordDecision: true,
    canCreateAction: false,
    canViewAudit: false,
    canViewModel: false,
  },
  MINISTRY_OFFICER: {
    tabs: ['dashboard', 'projects', 'risk-map', 'land-map', 'alerts', 'complaints', 'citizens', 'reports', 'ml-dashboard'],
    canUpdateData: false,
    canVerify: false,
    canRecordDecision: false,
    canCreateAction: false,
    canViewAudit: false,
    canViewModel: true, // Read-only for Ministry
  },
  ML_DATA_TEAM: {
    tabs: ['dashboard', 'projects', 'risk-map', 'land-map', 'alerts', 'complaints', 'reports', 'ml-dashboard'],
    canUpdateData: false,
    canVerify: false,
    canRecordDecision: false,
    canCreateAction: false,
    canViewAudit: false,
    canViewModel: true,
  },
  SYSTEM_ADMIN: {
    tabs: ['dashboard', 'projects', 'risk-map', 'land-map', 'alerts', 'complaints', 'citizens', 'reports', 'ml-dashboard', 'admin-audit'],
    canUpdateData: true,
    canVerify: true,
    canRecordDecision: true,
    canCreateAction: true,
    canViewAudit: true,
    canViewModel: true,
  },
  CITIZEN: {
    tabs: ['dashboard', 'land-map'],
    canUpdateData: false,
    canVerify: false,
    canRecordDecision: false,
    canCreateAction: false,
    canViewAudit: false,
    canViewModel: false,
  },
};

export function getRolePermissions(role: UserRole): RolePermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.DISTRICT_OFFICER;
}

export function isTabPermitted(role: UserRole, tab: NavigationTab): boolean {
  const perms = getRolePermissions(role);
  return perms.tabs.includes(tab);
}

/**
 * Filter projects according to the authenticated user's statutory scope:
 * - District Officer: Assigned district (e.g. Pune)
 * - State Officer: Assigned state (e.g. Maharashtra)
 * - Project Officer: Assigned agency projects (e.g. National Highways Authority of India)
 * - Ministry Officer, ML Team, Admin: All projects (unrestricted scope; read-only for Ministry)
 */
export function getScopedProjects(projects: Project[], user: AuthUser | null): Project[] {
  if (!user) return [];
  const scope = user.scope;
  if (!scope) return projects;

  return projects.filter((p) => {
    // District-level scope
    if (scope.district && p.district.toLowerCase() !== scope.district.toLowerCase()) {
      return false;
    }
    // State-level scope
    if (scope.state && p.state.toLowerCase() !== scope.state.toLowerCase()) {
      return false;
    }
    // Agency-level scope
    if (scope.agency && !p.agency.toLowerCase().includes(scope.agency.toLowerCase())) {
      return false;
    }
    return true;
  });
}
