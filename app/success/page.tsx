'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import PublicShell, { PhotoBand } from '../../components/public/PublicShell';

const NEW_PAGES = process.env.NEXT_PUBLIC_NEW_PUBLIC_PAGES === '1';

export default function SuccessPage() {
  useEffect(() => {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof w.gtag === 'function') {
      w.gtag('event', 'purchase', { value: 9.99, currency: 'USD' });
    }
  }, []);

  if (NEW_PAGES) {
    return (
      <PublicShell>
        <PhotoBand
          src="/landing/skyline.jpg"
          priority
          shade="linear-gradient(90deg, rgba(13,26,43,0.92) 0%, rgba(13,26,43,0.74) 60%, rgba(13,26,43,0.5) 100%)"
        >
          <div className="np-wrap np-ph" style={{ paddingBottom: 90 }}>
            <p className="np-eyebrow">Payment received</p>
            <h1>Welcome to Premium!</h1>
            <p className="np-lead">
              Your subscription is now active. You have full access to Interview Coach, Career Dashboard, and Resume Match Scoring.
            </p>
            <div className="np-ph-actions">
              <Link href="/?view=dashboard" className="np-btn np-btn-or">Go to Dashboard</Link>
            </div>
          </div>
        </PhotoBand>
      </PublicShell>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50">
      <div className="text-center p-8 max-w-md">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Welcome to Premium!</h1>
        <p className="text-neutral-600 mb-6">
          Your subscription is now active. You have full access to Interview Coach, Career Dashboard, and Resume Match Scoring.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
