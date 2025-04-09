
// Common response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
}

// Auth Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  role: 'owner' | 'admin' | 'member';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationName: string;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  domain?: string;
  logo?: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationSettings {
  timezone: string;
  dateFormat: string;
  themeColor: string;
  allowSubscribers: boolean;
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description: string;
  group: string;
  status: ServiceStatus;
  isPublic: boolean;
  organization: string;
  createdAt: string;
  updatedAt: string;
}

export type ServiceStatus = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'maintenance' | 'unknown';

// Incident Types
export interface Incident {
  id: string;
  name: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  services: string[];
  message: string;
  updates: IncidentUpdate[];
  organization: string;
  createdAt: string;
  updatedAt: string;
}

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type IncidentImpact = 'minor' | 'major' | 'critical';

export interface IncidentUpdate {
  id: string;
  status: IncidentStatus;
  message: string;
  createdAt: string;
  createdBy: string;
}

// Maintenance Types
export interface Maintenance {
  id: string;
  name: string;
  status: MaintenanceStatus;
  services: string[];
  description: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  updates: MaintenanceUpdate[];
  organization: string;
  createdAt: string;
  updatedAt: string;
}

export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface MaintenanceUpdate {
  id: string;
  status: MaintenanceStatus;
  message: string;
  createdAt: string;
  createdBy: string;
}

// Team Types
export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  organization: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  user: string;
  role: 'admin' | 'member';
  addedAt: string;
}
