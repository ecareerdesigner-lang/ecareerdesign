'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('=== Checking Auth ===');
        
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log('Session:', session ? 'Found' : 'Not found');
        console.log('User ID:', session?.user.id);

        if (!session) {
          console.log('❌ No session');
          setError('Not logged in');
          setTimeout(() => router.push('/'), 1000);
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        console.log('Profile:', profile);
        console.log('Profile Error:', profileError);
        console.log('Role:', profile?.role);

        if (profileError) {
          console.log('❌ Profile error:', profileError);
          setError(`Profile error: ${profileError.message}`);
          setTimeout(() => router.push('/'), 1000);
          return;
        }

        if (!profile) {
          console.log('❌ No profile found');
          setError('Profile not found');
          setTimeout(() => router.push('/'), 1000);
          return;
        }

        if (profile.role !== 'admin' && profile.role !== 'superadmin') {
          console.log(`❌ User role is '${profile.role}', not admin`);
          setError(`Your role is '${profile.role}', admin access required`);
          setTimeout(() => router.push('/'), 1000);
          return;
        }

        console.log('✅ Auth check passed!');
        setIsAuthorized(true);
      } catch (error) {
        console.error('❌ Auth error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setTimeout(() => router.push('/'), 1000);
      }
    };

    checkAuth();
  }, [router, supabase]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="mb-4">Loading...</p>
          <p className="text-gray-500 text-sm">Checking authorization</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-600">Access Denied</p>
      </div>
    );
  }

  return <>{children}</>;
}