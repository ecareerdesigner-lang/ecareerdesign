/**
 * Business Center Types
 * Comprehensive TypeScript definitions for admin/business features
 */

// User & Authorization
export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}

// Dashboard
export interface DashboardMetrics {
  monthlyRevenue: MetricCard;
  monthlyExpenses: MetricCard;
  netProfit: MetricCard;
  activeEmployees: MetricCard;
  activeProjects: MetricCard;
  websiteVisitors: MetricCard;
  premiumUsers: MetricCard;
  aiUsage: MetricCard;
}

export interface MetricCard {
  label: string;
  value: string | number;
  previousValue?: string | number;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
  unit?: string;
  loading?: boolean;
  error?: string;
}

// Employee Management
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'onleave';
  joinDate: Date;
  avatar?: string;
  phone?: string;
}

export interface EmployeeFilters {
  search?: string;
  department?: string;
  status?: string;
  sortBy?: 'name' | 'joinDate' | 'department';
}

// Expense Tracking
export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: Date;
  approvedBy?: string;
  status: ExpenseStatus;
  receipt?: string;
  createdBy: string;
}

export type ExpenseCategory =
  | 'travel'
  | 'software'
  | 'equipment'
  | 'marketing'
  | 'operations'
  | 'other';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'paid';

// Projects
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  budget: number;
  spent: number;
  owner: string;
  teamMembers: string[];
  progress: number;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

// Tasks
export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// Time Tracking
export interface TimeEntry {
  id: string;
  employeeId: string;
  projectId: string;
  taskId?: string;
  date: Date;
  hoursWorked: number;
  description: string;
  status: 'draft' | 'submitted' | 'approved';
}

export interface TimeReport {
  employeeId: string;
  period: string;
  totalHours: number;
  billableHours: number;
  projectHours: Record<string, number>;
}

// Revenue
export interface RevenueData {
  month: string;
  revenue: number;
  target: number;
  source: RevenueSource;
}

export type RevenueSource = 'subscriptions' | 'consulting' | 'services' | 'other';

export interface SubscriptionMetrics {
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  customerLifetimeValue: number;
}

// AI Usage
export interface AIUsageMetrics {
  totalRequests: number;
  averageLatency: number;
  successRate: number;
  costPerRequest: number;
  topFeatures: Array<{
    feature: string;
    requests: number;
    cost: number;
  }>;
  dailyUsage: Array<{
    date: string;
    requests: number;
    cost: number;
  }>;
}

// Reports
export interface Report {
  id: string;
  title: string;
  type: ReportType;
  generatedAt: Date;
  generatedBy: string;
  data: Record<string, any>;
  format: 'pdf' | 'csv' | 'json';
}

export type ReportType =
  | 'financial'
  | 'employee'
  | 'project'
  | 'usage'
  | 'ai_usage'
  | 'custom';

// Documents
export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  size: number;
  version: number;
}

export type DocumentCategory =
  | 'policies'
  | 'templates'
  | 'contracts'
  | 'guidelines'
  | 'other';

// Settings
export interface BusinessSettings {
  companyName: string;
  companyEmail: string;
  currencyCode: string;
  timezone: string;
  fiscalYearStart: number;
  aiApiUsageLimit?: number;
  notificationPreferences: NotificationPreferences;
  integrations: IntegrationSettings;
}

export interface NotificationPreferences {
  emailOnHighExpense: boolean;
  emailOnProjectDelay: boolean;
  emailOnAIUsageThreshold: boolean;
  dailySummary: boolean;
  weeklyReports: boolean;
}

export interface IntegrationSettings {
  slack?: {
    enabled: boolean;
    webhookUrl?: string;
  };
  email?: {
    enabled: boolean;
    host?: string;
  };
  stripe?: {
    enabled: boolean;
    apiKey?: string;
  };
}

// Pagination & Sorting
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    version: string;
  };
}

// Navigation
export interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  children?: SidebarItem[];
  badge?: number;
  disabled?: boolean;
}

// Error Handling
export class BusinessCenterError extends Error {
  constructor(
    message: string,
    public code: string = 'BUSINESS_CENTER_ERROR',
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'BusinessCenterError';
  }
}

export class AuthorizationError extends BusinessCenterError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class ResourceNotFoundError extends BusinessCenterError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'ResourceNotFoundError';
  }
}
