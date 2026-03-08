import { CircleX } from 'lucide-react';

import { useEffect, useState } from 'react';

import { createFileRoute, useSearch } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/auth/error')({
  component: AuthError,
});

function AuthError() {
  const search = useSearch({ from: '/auth/error' });
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');

  useEffect(() => {
    const message = search.message as string | undefined;
    const code = search.error as string | undefined;

    // If no error parameters at all, redirect to login
    if (!message && !code) {
      console.log('[🔄 Auth Error] No error parameters, redirecting to login...');
      window.location.href = '/login';
      return;
    }

    if (message) {
      setErrorMessage(decodeURIComponent(message));
    } else if (code === 'backend_mismatch') {
      setErrorMessage('Backend configuration issue: Token was not passed to frontend. Contact support.');
      setErrorCode('backend_mismatch');
    } else if (code === 'missing_tokens') {
      setErrorMessage('No authentication tokens received. Please try logging in again.');
      setErrorCode('missing_tokens');
    } else if (code === 'storage_failed') {
      setErrorMessage('Failed to save authentication tokens. Please clear browser data and try again.');
      setErrorCode('storage_failed');
    } else {
      setErrorMessage('Authentication failed. Please try again.');
    }
  }, [search]);

  const handleRetry = () => {
    window.location.href = '/login';
  };

  const isRateLimitError =
    errorMessage.includes('rate limit') || errorMessage.includes('429');
  const isBackendIssue = errorCode === 'backend_mismatch';

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <CircleX className="text-destructive h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Authentication Failed</h1>
        </div>

        <div className="border-destructive/50 bg-card space-y-4 rounded-lg border p-6">
          <div className="flex items-start gap-3">
            <CircleX className="text-destructive mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <h3 className="text-destructive font-semibold">
                {isRateLimitError ? 'Rate Limit Exceeded' : 'Error'}
              </h3>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
            </div>
          </div>

          {isRateLimitError && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <div>
                <p className="font-medium">What does this mean?</p>
                <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm">
                  <li>Twitter's API has a limit on requests</li>
                  <li>Please wait 5-15 minutes before trying again</li>
                  <li>This is a temporary restriction</li>
                </ul>
              </div>
            </div>
          )}

          {isBackendIssue && (
            <div className="mt-4 space-y-3 border-t pt-4">
              <div>
                <p className="font-medium">Backend Configuration Issue</p>
                <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm">
                  <li>Backend is not passing the access token to frontend</li>
                  <li>Backend OAuth callback endpoint needs to be fixed</li>
                  <li>Please contact the development team</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full" size="lg">
            {isRateLimitError ? 'Back to Login' : 'Try Again'}
          </Button>

          {isRateLimitError && (
            <div className="bg-muted/50 rounded-lg border p-4">
              <p className="text-sm font-medium">Tips to resolve this:</p>
              <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm">
                <li>Clear your browser cache</li>
                <li>Try from a different device or network</li>
                <li>Wait 15-30 minutes before retrying</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
