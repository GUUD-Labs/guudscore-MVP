import { useState } from 'react';
import { toast } from 'sonner';

import Icons from '@/components/icons';
import { authService } from '@/services/auth';

export const TwitterLoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTwitterLogin = async () => {
    setIsLoading(true);
    try {
      console.log('[TwitterLogin] Starting OAuth 2.0 flow...');

      // Get referral code from localStorage if exists
      const referralCode = localStorage.getItem('referralCode');

      // Get OAuth 2.0 authorization URL
      const authUrl = await authService.getTwitterOAuthUrl(referralCode || undefined);

      console.log('[TwitterLogin] Redirecting to Twitter OAuth 2.0...');

      // Redirect to Twitter OAuth 2.0
      window.location.href = authUrl;
    } catch (error) {
      console.error('[TwitterLogin] Error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to start Twitter login. Please try again.'
      );
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTwitterLogin}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1DA1F2] px-4 py-3 font-medium text-white transition-colors hover:bg-[#1a8cd8] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? (
        <>
          <Icons.spinner className="h-5 w-5 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Icons.twitter className="h-5 w-5" />
          <span>Twitter ile Giriş Yap</span>
        </>
      )}
    </button>
  );
};
