/**
 * Business Center Root Layout
 * app/business/layout.tsx
 */

import React, { ReactNode } from 'react';
import { BusinessLayout } from '@/components/business/layout';
import { ErrorBoundary } from '@/components/business/components';
import { AuthGuard } from '@/components/business/auth-guard';

interface BusinessRootLayoutProps {
  children: ReactNode;
}

export default function BusinessRootLayout({
  children,
}: BusinessRootLayoutProps) {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <BusinessLayout>{children}</BusinessLayout>
      </AuthGuard>
    </ErrorBoundary>
  );
}