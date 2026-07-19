/**
 * Business Center Authentication & Authorization
 * Utilities for checking admin access and managing sessions
 */

import { AuthorizationError } from '../types/business';
import type { User, UserRole } from '../types/business';

/**
 * Check if user has required role
 */
export function hasRole(user: User | null, requiredRole: UserRole): boolean {
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    admin: 1,
    superadmin: 2,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Check if user is admin (admin or superadmin)
 */
export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(user: User | null): boolean {
  return hasRole(user, 'superadmin');
}

/**
 * Verify admin access and throw if unauthorized
 */
export function requireAdmin(user: User | null): asserts user is User {
  if (!isAdmin(user)) {
    throw new AuthorizationError(
      'Admin access required to view this resource',
    );
  }
}

/**
 * Verify superadmin access and throw if unauthorized
 */
export function requireSuperAdmin(user: User | null): asserts user is User {
  if (!isSuperAdmin(user)) {
    throw new AuthorizationError(
      'Superadmin access required to view this resource',
    );
  }
}

/**
 * Verify user is authenticated
 */
export function requireAuth(user: User | null): asserts user is User {
  if (!user) {
    throw new AuthorizationError('Authentication required');
  }
}

/**
 * Get user from session (placeholder for your auth system)
 * Replace with your actual Supabase/auth implementation
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // TODO: Replace with actual Supabase auth call
    // const { data } = await supabase.auth.getUser();
    // if (!data.user) return null;
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('*')
    //   .eq('id', data.user.id)
    //   .single();
    // return profile;

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Middleware to protect business center routes
 */
export async function protectBusinessRoute(
  user: User | null,
): Promise<{ authorized: boolean; error?: string }> {
  if (!user) {
    return {
      authorized: false,
      error: 'Authentication required',
    };
  }

  if (!isAdmin(user)) {
    return {
      authorized: false,
      error: 'Admin access required',
    };
  }

  return { authorized: true };
}

/**
 * Format user name for display
 */
export function formatUserName(user: User): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.email;
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    user: 'User',
    admin: 'Administrator',
    superadmin: 'Super Administrator',
  };
  return roleNames[role];
}
