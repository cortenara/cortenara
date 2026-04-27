"use client";

import { useAuth } from '@/lib/auth-context';
import { LoginPage } from '@/components/login-page';
import { Dashboard } from '@/components/dashboard';
import { Spinner } from '@/components/ui/spinner';

export default function Home() {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Spinner className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-4 text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show dashboard if authenticated
  return <Dashboard />;
}
