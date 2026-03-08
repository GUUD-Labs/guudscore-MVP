import { Bell, Menu, X } from 'lucide-react';

import { useEffect, useRef, useState } from 'react';

import { Link } from '@tanstack/react-router';

import Icons from '@/components/icons';
import { ProfileAvatar } from '@/components/profile-avatar';
import { ChainSelector } from '@/components/shared/chain-selector';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/contexts/auth-context';
import {
    useAcceptConnectionRequest,
    useAgentIds,
    useConnections,
    useCurrentUser,
    useDebounce,
    useDeclineConnectionRequest,
    useIncomingRequests,
    useLeaderboard,
    useLogout,
    useSearchUsers,
    useSendConnectionRequest,
    useSentRequests,
} from '@/hooks';
import { getUserPhotoUrl } from '@/lib/utils/image';

export const Header = () => {
  const { user, isAuthenticated } = useAuthContext();
  const { data: currentUser } = useCurrentUser();
  const logoutMutation = useLogout();
  const agentIds = useAgentIds();

  // Get sent requests to check if we already sent request to users
  const { data: sentRequestsData } = useSentRequests();
  const { mutate: sendConnectionRequest, isPending: isSendingRequest } =
    useSendConnectionRequest();

  // Get connections (friends) to check if user is already a friend
  const { data: connectionsData } = useConnections({ page: 1, limit: 50 });

  // Get incoming requests for notifications
  const { data: incomingRequestsData } = useIncomingRequests({ page: 1, limit: 50 });
  const acceptRequestMutation = useAcceptConnectionRequest();
  const declineRequestMutation = useDeclineConnectionRequest();

  const incomingRequests = incomingRequestsData?.incomingRequests || [];
  // Use the total count from API or fallback to actual array length
  const notificationCount = incomingRequestsData?.count || incomingRequestsData?.pagination?.total || incomingRequests.length;

  // Helper function to check if request was sent to a user
  const hasRequestSent = (userId: string): boolean => {
    if (!sentRequestsData?.sentRequests) return false;
    return sentRequestsData.sentRequests.some(request => request.id === userId);
  };

  // Helper function to check if user is already a friend
  const isFriend = (userId: string): boolean => {
    if (!connectionsData?.connections) return false;
    return connectionsData.connections.some(connection => connection.id === userId);
  };


  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: searchResults, isLoading: isSearchLoading } = useSearchUsers(
    { query: debouncedSearchQuery, page: 1, limit: 10 },
    debouncedSearchQuery.length >= 2
  );

  // Fallback: Get leaderboard data for client-side search
  const { data: leaderboardData } = useLeaderboard({ page: 1, limit: 100 });

  // Client-side search in leaderboard data when backend returns empty
  const clientSideSearchResults = debouncedSearchQuery.length >= 2 && leaderboardData?.leaderboard
    ? leaderboardData.leaderboard
        .filter(entry => {
          const query = debouncedSearchQuery.toLowerCase();
          return (
            entry.user.username?.toLowerCase().includes(query) ||
            entry.user.slug?.toLowerCase().includes(query)
          );
        })
        .slice(0, 10)
        .map(entry => ({
          id: entry.user.id,
          name: entry.user.username || entry.user.slug || 'Unknown',
          slug: entry.user.slug || null,
          photo: entry.user.profilePicture,
        }))
    : [];

  // Use backend results if available, otherwise use client-side results
  const displayResults = searchResults?.users.length
    ? searchResults
    : { users: clientSideSearchResults, pagination: { page: 1, limit: 10, total: clientSideSearchResults.length, totalPages: 1 } };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setShowResults(
      debouncedSearchQuery.length >= 2 && (!!searchResults?.users.length || clientSideSearchResults.length > 0)
    );
  }, [debouncedSearchQuery, searchResults, clientSideSearchResults.length]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-secondary px-4 py-4 md:px-10 md:py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center">
            <img 
              src="/guudlogo.png" 
              alt="GuudScore" 
              className="h-8 w-auto md:h-10 -translate-y-1"
            />
          </Link>

          <nav className="font-pixel hidden items-center space-x-8 md:flex">
            <Link
              to="/"
              className="!text-foreground [&.active]:!text-primary py-2 text-base"
            >
              Alpha
            </Link>
            <Link
              to="/leaderboard"
              className="!text-foreground [&.active]:!text-primary py-2 text-base"
            >
              Leaderboard
            </Link>
            <Link
              to="/dashboard"
              className="!text-foreground [&.active]:!text-primary py-2 text-base"
            >
              Dashboard
            </Link>
            {/* <Link
              to="/shop"
              className="!text-foreground [&.active]:!text-primary py-2 text-base"
            >
              Shop
            </Link> */}
          </nav>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          {isAuthenticated && (
            <div className="relative hidden lg:block" ref={searchRef}>
              <div className="glass relative flex items-center gap-3 rounded-md px-4 py-3">
                <Icons.search className="text-primary size-4" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() =>
                    debouncedSearchQuery.length >= 2 && setShowResults(true)
                  }
                  className="font-pixel w-48 bg-transparent text-sm focus:outline-none lg:w-64"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {isSearchLoading && (
                  <div className="border-primary h-4 w-4 animate-spin rounded-full border-b-2"></div>
                )}
              </div>

              {showResults && displayResults?.users && (
                <div className="glass border-glass-border absolute top-full right-0 z-50 mt-1 max-h-80 w-96 overflow-y-auto rounded-md border shadow-lg">
                  {displayResults.users.length > 0 ? (
                    <>
                      {displayResults.users.map(searchUser => {
                        const isCurrentUser = currentUser?.id === searchUser.id;
                        const requestSent = hasRequestSent(searchUser.id);
                        const alreadyFriend = isFriend(searchUser.id);

                        return (
                          <div
                            key={searchUser.id}
                            className="hover:bg-glass-background border-glass-border/30 flex items-center gap-3 border-b p-3 transition-colors last:border-b-0"
                          >
                            <Link
                              to="/profile/$username"
                              params={{
                                username: searchUser.slug,
                              }}
                              className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                              onClick={() => {
                                setShowResults(false);
                                setSearchQuery('');
                              }}
                            >
                              <ProfileAvatar
                                src={getUserPhotoUrl(searchUser.photo)}
                                name={searchUser.name}
                                size="xs"
                                className="size-8 flex-shrink-0"
                                isAgent={agentIds.has(searchUser.id)}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-pixel !m-0 truncate text-sm">
                                  {searchUser.name}
                                </p>
                              </div>
                            </Link>

                            {!isCurrentUser && (
                              <div className="flex-shrink-0">
                                {alreadyFriend ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="font-pixel text-primary border-primary/30 cursor-default gap-1.5 text-[10px]"
                                    disabled
                                  >
                                    <span className="text-xs">✓</span>
                                    Friends
                                  </Button>
                                ) : requestSent ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="font-pixel text-muted-foreground border-muted-foreground/30 cursor-not-allowed gap-1.5 text-[10px]"
                                    disabled
                                  >
                                    <span className="text-xs">✓</span>
                                    Request Sent
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="font-pixel hover:bg-primary/10 hover:border-primary gap-1.5 text-[10px] transition-colors"
                                    onClick={e => {
                                      e.preventDefault();
                                      sendConnectionRequest(searchUser.id);
                                    }}
                                    disabled={isSendingRequest}
                                  >
                                    {isSendingRequest ? (
                                      <>
                                        <div className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <Icons.plus className="size-3" />
                                        Add Friend
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {displayResults.pagination.total >
                        displayResults.users.length && (
                        <div className="text-muted-foreground border-glass-border/30 border-t p-3 text-center text-xs">
                          Showing {displayResults.users.length} of{' '}
                          {displayResults.pagination.total} results
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-muted p-3 text-center text-sm">
                      No users found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* <ModeToggle /> */}
          {!isAuthenticated ? (
            <div className="flex gap-2">
              <Link
                to="/login"
                className="font-pixel glass !text-foreground hover:bg-primary/20 rounded-md px-4 py-2 transition"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative cursor-pointer focus:outline-none">
                    <Bell className="size-5 text-foreground hover:text-primary transition-colors" />
                    {notificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                        {notificationCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="glass border-glass-border w-80"
                >
                  <div className="px-3 py-2">
                    <p className="font-pixel text-sm">Pending Requests</p>
                  </div>
                  <DropdownMenuSeparator />
                  {incomingRequests.length > 0 ? (
                    <div className="max-h-[400px] overflow-y-auto">
                      {incomingRequests.map(request => (
                        <div
                          key={request.connectionId}
                          className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-primary/5"
                        >
                          <Link
                            to="/profile/$username"
                            params={{ username: request.slug || request.id }}
                            className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                          >
                            <ProfileAvatar
                              src={getUserPhotoUrl(request.photoUrl)}
                              name={request.name}
                              size="sm"
                              className="shrink-0"
                              isAgent={!!request.id && agentIds.has(request.id)}
                            />
                            <div className="flex flex-col min-w-0">
                              <p className="font-pixel text-sm truncate">
                                {request.name}
                              </p>
                              {request.social?.find(s => s.platform === 'x') && (
                                <p className="text-muted text-xs truncate">
                                  @
                                  {request.social
                                    .find(s => s.platform === 'x')
                                    ?.url.split('/')
                                    .pop()}
                                </p>
                              )}
                            </div>
                          </Link>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 px-2 text-xs"
                              disabled={acceptRequestMutation.isPending}
                              onClick={() =>
                                acceptRequestMutation.mutate(
                                  request.connectionId
                                )
                              }
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              disabled={declineRequestMutation.isPending}
                              onClick={() =>
                                declineRequestMutation.mutate(
                                  request.connectionId
                                )
                              }
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-8 text-center">
                      <p className="text-muted text-sm">No pending requests</p>
                    </div>
                  )}
                  {incomingRequests.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer">
                        <Link
                          to="/dashboard/guud-friends"
                          className="flex w-full items-center justify-center gap-2 text-primary"
                        >
                          View All Requests
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Chain Selector */}
              <ChainSelector />

              {/* Profile Dropdown */}
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer focus:outline-0">
                  <ProfileAvatar
                    src={getUserPhotoUrl(currentUser?.photo)}
                    name={user?.name}
                    alt="Profile"
                    size="xs"
                    className="cursor-pointer"
                    isAgent={!!currentUser?.id && agentIds.has(currentUser.id)}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass border-glass-border w-56"
              >
                <div className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      src={getUserPhotoUrl(currentUser?.photo)}
                      name={user?.name}
                      alt="Profile"
                      size="sm"
                      isAgent={!!currentUser?.id && agentIds.has(currentUser.id)}
                    />
                    <div className="flex flex-col">
                      <p className="font-pixel !m-0 text-sm">{user?.name}</p>
                      <p className="text-muted !m-0 text-xs">@{user?.slug}</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <Link
                    to="/profile/$username"
                    params={{
                      username: user?.slug,
                    }}
                    className="flex w-full items-center gap-2"
                  >
                    <Icons.user className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link
                    to="/dashboard"
                    className="flex w-full items-center gap-2"
                  >
                    <Icons.dashboard className="size-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Link
                    to="/profile/settings"
                    className="flex w-full items-center gap-2"
                  >
                    <Icons.settings className="size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  disabled={logoutMutation.isPending}
                >
                  <div className="flex w-full items-center gap-2">
                    {logoutMutation.isPending ? (
                      <div className="border-destructive h-4 w-4 animate-spin rounded-full border-b-2"></div>
                    ) : (
                      <Icons.logOut className="size-4" />
                    )}
                    {logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {/* <ModeToggle /> */}
          {isAuthenticated && (
            <>
              <ChainSelector />
              <ProfileAvatar
                src={getUserPhotoUrl(currentUser?.photo)}
                name={user?.name}
                alt="Profile"
                size="xs"
                className="cursor-pointer"
                isAgent={!!currentUser?.id && agentIds.has(currentUser.id)}
              />
            </>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-foreground p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="size-6" />
            ) : (
              <Menu className="size-6" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-glass-border mt-4 border-t pt-4 md:hidden">
          <nav className="font-pixel flex flex-col space-y-3">
            <Link
              to="/"
              className="!text-foreground [&.active]:!text-primary py-2 text-base"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Alpha
            </Link>
            <Link
              to="/leaderboard"
              className="!text-foreground [&.active]:!text-primary py-2 text-base"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Leaderboard
            </Link>
            <Link
              to="/dashboard"
              className="!text-foreground [&.active]:!text-primary py-2 text-base"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            {/* <Link
              to="/shop"
              className="!text-foreground [&.active]:!text-primary py-2 text-base"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Shop
            </Link> */}
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="!text-foreground [&.active]:!text-primary py-2 text-base"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            ) : (
              <>
                <Link
                  to="/profile/$username"
                  params={{ username: user?.slug || user?.username || 'user' }}
                  className="!text-foreground [&.active]:!text-primary flex items-center gap-2 py-2 text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icons.user className="size-4" />
                  Profile
                </Link>
                <Link
                  to="/profile/settings"
                  className="!text-foreground [&.active]:!text-primary flex items-center gap-2 py-2 text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icons.settings className="size-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-destructive flex items-center gap-2 py-2 text-left text-base"
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <div className="border-destructive h-4 w-4 animate-spin rounded-full border-b-2"></div>
                  ) : (
                    <Icons.logOut className="size-4" />
                  )}
                  {logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
