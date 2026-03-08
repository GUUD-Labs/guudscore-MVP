import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import Icons from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/auth-context';
import { useSignUp, useTwitterLogin } from '@/hooks';
import { requireGuest } from '@/lib/auth-guards';

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  beforeLoad: ({ context }) => {
    requireGuest(context);
  },
});

function RegisterPage() {
  const { isAuthenticated } = useAuthContext();
  const twitterLogin = useTwitterLogin();
  const signUp = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  const handleEmailSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    signUp.mutate(
      { email, password },
      {
        onSuccess: () => {
          toast.success('Account created successfully!');
          window.location.href = '/';
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Registration failed. Please try again.');
        },
      }
    );
  };

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center md:flex-row">
      {/* Left Side - Welcome Message */}
      <div className="from-background to-muted flex w-full flex-col items-center justify-center space-y-2 rounded-lg bg-gradient-to-br py-6 sm:py-8 md:h-full md:flex-1 md:py-0">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight md:text-2xl">
          Join GUUDScore
        </h1>
        <p className="text-muted !mt-0 text-xs sm:text-sm">
          Create an account with email or X (Twitter)
        </p>
      </div>

      {/* Right Side - Register Options */}
      <div className="flex w-full flex-1 items-center justify-center p-4 sm:p-6 md:h-full md:min-w-lg md:p-24">
        <div className="w-full max-w-md space-y-4 sm:space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-xl sm:text-2xl font-bold">Create Account</h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Get started with your account
            </p>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={signUp.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={signUp.isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <Icons.eyeOff className="h-4 w-4" />
                  ) : (
                    <Icons.eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={signUp.isPending}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <Icons.eyeOff className="h-4 w-4" />
                  ) : (
                    <Icons.eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={signUp.isPending}
            >
              {signUp.isPending ? 'Creating account...' : 'Sign Up with Email'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Twitter Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            disabled={twitterLogin.isPending}
            onClick={() => twitterLogin.mutate()}
          >
            <Icons.twitter className="mr-2 h-5 w-5" />
            {twitterLogin.isPending ? 'Connecting...' : 'Continue with X'}
          </Button>

          {twitterLogin.error && (
            <div className="text-destructive text-center text-sm font-medium">
              {twitterLogin.error.message || 'Failed to connect with X. Please try again.'}
            </div>
          )}

          {/* Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-muted-foreground text-center text-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
