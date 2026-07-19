'use client';

import React, { useState } from 'react';
import { BusinessSidebar, SidebarToggle } from '@/components/business/sidebar';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BusinessLayoutProps {
  children: React.ReactNode;
}

/**
 * Business Center Main Layout
 * Wraps all business center pages with sidebar and consistent styling
 */
export function BusinessLayout({ children }: BusinessLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Sidebar */}
      <BusinessSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header
          className={cn(
            'fixed top-0 right-0 h-16 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950',
            'flex items-center justify-between px-4 md:px-8',
            'z-20',
          )}
          style={{ left: 0, right: 0 }}
        >
          <SidebarToggle
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className="flex items-center gap-4">
            {/* Placeholder for user menu, notifications, etc */}
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              Business Center
            </div>
          </div>
        </header>

       {/* Content Area */}
      <main
        className={cn(
          'flex-1 overflow-auto',
          'pt-20 px-4 md:px-8 pb-8',
          'ml-40',
          'transition-all duration-300 ease-in-out',
        )}
      >
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Protected Business Layout with Auth Check
 * Use this for routes that require admin access
 */
interface ProtectedBusinessLayoutProps extends BusinessLayoutProps {
  userRole?: string | null;
  isLoading?: boolean;
}

export function ProtectedBusinessLayout({
  children,
  userRole,
  isLoading,
}: ProtectedBusinessLayoutProps) {
  const router = useRouter();

  // Check if user is admin
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-800 dark:border-t-blue-400" />
          <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-900">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Access Denied
          </h1>
          <p className="mb-6 text-neutral-600 dark:text-neutral-400">
            You do not have permission to access the Business Center.
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return <BusinessLayout>{children}</BusinessLayout>;
}
