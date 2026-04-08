'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface VerificationGuardProps {
  children: React.ReactNode;
}

export default function VerificationGuard({ children }: VerificationGuardProps) {
  const { user, loading, mounted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!mounted || loading) {
      return;
    }

    // If user is not authenticated, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If user is authenticated but not verified, redirect to verify-email
    if (!user.isVerified) {
      router.push('/verify-email');
      return;
    }
  }, [user, loading, mounted, router]);

  // Show loading state while checking auth
  if (!mounted || loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  // Don't render content if not authenticated or not verified
  if (!user || !user.isVerified) {
    return null;
  }

  // User is authenticated and verified, render children
  return <>{children}</>;
}
