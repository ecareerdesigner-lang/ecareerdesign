'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
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