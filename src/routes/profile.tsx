import { Outlet, createFileRoute, useParams } from '@tanstack/react-router';

import { BribeButton } from '@/components/bribe-button';
import { ProfileCard } from '@/components/profile-card';
import { useChain } from '@/contexts/chain-context';
import { useCurrentUser, useUserByKey } from '@/hooks';
import { requireAuth } from '@/lib/auth-guards';

export const Route = createFileRoute('/profile')({
  component: ProfileLayout,
  beforeLoad: ({ context }) => {
    requireAuth(context);
  },
});

function ProfileLayout() {
  const { username } = useParams({ strict: false }) as { username?: string };
  const { data: currentUser } = useCurrentUser();
  const { selectedNetwork } = useChain();
  
  // Fetch the profile user if viewing someone else's profile
  const { data: profileUser } = useUserByKey(username || '', selectedNetwork);
  
  const isOwnProfile = !username || currentUser?.username === username || currentUser?.slug === username;
  const displayUser = isOwnProfile ? currentUser : profileUser;

  return (
    <div className="flex w-full flex-col gap-6 lg:flex-row">
      <div className="w-full lg:w-80 lg:flex-shrink-0 flex flex-col gap-4">
        <ProfileCard />
        
        {/* Bribe Button - Show for other users' profiles */}
        {!isOwnProfile && displayUser && (
          <BribeButton
            user={{
              id: displayUser.id,
              name: displayUser.name || displayUser.username || 'User',
              slug: displayUser.slug || displayUser.username || displayUser.id,
              photo: typeof displayUser.photo === 'string' 
                ? displayUser.photo 
                : displayUser.photo?.url || null,
              guudScore: displayUser.guudScore?.totalScore || 0,
              evmBribeWallet: displayUser.evmBribeWallet,
              solBribeWallet: displayUser.solBribeWallet,
            }}
            variant="default"
            size="lg"
            showLabel={true}
            className="w-full"
            alwaysShow={true}
          />
        )}
      </div>
      <div className="w-full flex-1">
        <Outlet />
      </div>
    </div>
  );
}
