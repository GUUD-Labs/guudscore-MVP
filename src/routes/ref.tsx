import { useEffect } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

// Define search params schema
type RefPageSearch = {
  ref?: string;
};

export const Route = createFileRoute('/ref')({
  component: RefPage,
  validateSearch: (search: Record<string, unknown>): RefPageSearch => {
    return {
      ref: search.ref as string,
    };
  },
});

function RefPage() {
  const navigate = useNavigate();
  const { ref } = Route.useSearch();

  useEffect(() => {
    // Store referral code in localStorage only if valid
    if (ref && ref.trim().length > 0) {
      localStorage.setItem('referralCode', ref.trim());
      console.log('[Referral] Stored referral code:', ref);
    } else {
      console.log('[Referral] No referral code provided, proceeding to login');
    }

    // Redirect to login immediately
    window.location.href = '/login';
  }, [ref, navigate]);

  // Show loading while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
