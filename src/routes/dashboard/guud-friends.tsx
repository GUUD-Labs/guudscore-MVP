import { useState } from 'react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { ErrorMessage } from '@/components/error-message';
import Icons from '@/components/icons';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Button } from '@/components/ui/button';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    useAcceptConnectionRequest,
    useAgentIds,
    useConnections,
    useDeclineConnectionRequest,
    useDeleteConnection,
    useIncomingRequests,
} from '@/hooks';
import { cn } from '@/lib/utils';
import { getUserPhotoUrl } from '@/lib/utils/image';

export const Route = createFileRoute('/dashboard/guud-friends')({
  component: RouteComponent,
});

function RouteComponent() {
  const agentIds = useAgentIds();
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );
  const [requestsPage, setRequestsPage] = useState(1);
  const requestsPerPage = 12;

  const {
    data: connectionsData,
    isLoading,
    error,
  } = useConnections({
    page: 1,
    limit: 20,
  });

  const {
    data: incomingRequestsData,
    isLoading: isLoadingRequests,
  } = useIncomingRequests({
    page: requestsPage,
    limit: requestsPerPage,
  });

  const deleteConnectionMutation = useDeleteConnection();
  const acceptRequestMutation = useAcceptConnectionRequest();
  const declineRequestMutation = useDeclineConnectionRequest();

  const handleRemoveFriend = async (
    connectionId: string,
    friendName: string
  ) => {
    try {
      await deleteConnectionMutation.mutateAsync(connectionId);
      console.log(`Successfully removed friend: ${friendName}`);
      setConfirmingDelete(null);
    } catch (error) {
      console.error(`Failed to remove friend: ${friendName}`, error);
    }
  };

  const handleAcceptRequest = async (requestId: string, name: string) => {
    try {
      setProcessingRequest(requestId);
      await acceptRequestMutation.mutateAsync(requestId);
      console.log(`Successfully accepted request from: ${name}`);
    } catch (error) {
      console.error(`Failed to accept request from: ${name}`, error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDeclineRequest = async (requestId: string, name: string) => {
    try {
      setProcessingRequest(requestId);
      await declineRequestMutation.mutateAsync(requestId);
      console.log(`Successfully declined request from: ${name}`);
    } catch (error) {
      console.error(`Failed to decline request from: ${name}`, error);
    } finally {
      setProcessingRequest(null);
    }
  };

  if (isLoading || isLoadingRequests) {
    return (
      <div className="flex flex-col gap-6">
        <h4 className="text-muted text-sm">Loading guudFriends...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        header="Error loading friends"
        error={error.message || 'Unknown error'}
      />
    );
  }

  const connections = connectionsData?.connections || [];
  const incomingRequests = incomingRequestsData?.incomingRequests || [];
  const requestsPagination = incomingRequestsData?.pagination;
  const totalRequests = incomingRequestsData?.count || 0;

  const handleRequestsPageChange = (page: number) => {
    setRequestsPage(page);
  };

  return (
    <div className="flex w-full flex-col gap-10">
      {/* Incoming Friend Requests Section */}
      {(incomingRequests.length > 0 || totalRequests > 0) && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h4 className="text-base sm:text-lg">
              Pending <span>Requests</span>
            </h4>
            <span className="text-muted text-xs sm:text-sm">
              {totalRequests} request{totalRequests !== 1 ? 's' : ''}
            </span>
          </div>

          {incomingRequests.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {incomingRequests.map(request => (
                  <div
                    key={request.connectionId}
                    className="glass flex items-center justify-between rounded-md p-3 sm:p-4"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Link
                        to="/profile/$username"
                        params={{ username: request.slug || request.id }}
                        className="flex items-center gap-2 sm:gap-3 flex-1 hover:opacity-80 transition-opacity"
                      >
                        <ProfileAvatar
                          src={getUserPhotoUrl(request.photoUrl)}
                          alt={request.name}
                          name={request.name}
                          size="sm"
                          className="h-10 w-10 sm:h-12 sm:w-12"
                          isAgent={!!request.id && agentIds.has(request.id)}
                        />
                        <div className="flex flex-col">
                          <span className="font-pixel text-sm sm:text-base md:text-lg font-semibold">
                            {request.name}
                          </span>
                          {request.social?.length > 0 && (
                            <span className="font-pixel text-muted inline-flex items-center text-sm">
                              <Icons.xLogo className="text-muted mr-1 size-3" />
                              <span className="text-muted">
                                {request.social
                                  .find(s => s.platform === 'x')
                                  ?.url.split('/')
                                  .pop() || 'x'}
                              </span>
                            </span>
                          )}
                        </div>
                      </Link>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={
                          processingRequest === request.connectionId ||
                          acceptRequestMutation.isPending
                        }
                        onClick={() =>
                          handleAcceptRequest(request.connectionId, request.name)
                        }
                      >
                        {processingRequest === request.connectionId &&
                        acceptRequestMutation.isPending
                          ? 'Accepting...'
                          : 'Accept'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          processingRequest === request.connectionId ||
                          declineRequestMutation.isPending
                        }
                        onClick={() =>
                          handleDeclineRequest(request.connectionId, request.name)
                        }
                      >
                        {processingRequest === request.connectionId &&
                        declineRequestMutation.isPending
                          ? 'Declining...'
                          : 'Decline'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination for Requests */}
              {requestsPagination && requestsPagination.totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handleRequestsPageChange(requestsPage - 1)}
                          className={cn(
                            'cursor-pointer',
                            !requestsPagination.hasPrev && 'cursor-not-allowed opacity-50'
                          )}
                        />
                      </PaginationItem>

                      {Array.from({ length: requestsPagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handleRequestsPageChange(pageNum)}
                            isActive={pageNum === requestsPage}
                            className={cn(
                              'cursor-pointer',
                              pageNum === requestsPage && 'bg-primary/10 text-primary border-primary/30'
                            )}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handleRequestsPageChange(requestsPage + 1)}
                          className={cn(
                            'cursor-pointer',
                            !requestsPagination.hasNext && 'cursor-not-allowed opacity-50'
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted">No pending requests</p>
            </div>
          )}
        </div>
      )}

      {/* Current Friends Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base sm:text-lg">
            Your Guud<span>friends</span>
          </h4>
          <span className="text-muted text-xs sm:text-sm">
            {connectionsData?.pagination.total || 0} friends
          </span>
        </div>

        {connections.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connections.map(connection => (
              <div
                key={connection.id}
                className="glass flex items-center justify-between rounded-md p-3 sm:p-4"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1">
                  <Link
                    to="/profile/$username"
                    params={{ username: connection.slug || connection.id }}
                    className="flex items-center gap-2 sm:gap-3 flex-1 hover:opacity-80 transition-opacity"
                  >
                    <ProfileAvatar
                      src={getUserPhotoUrl(connection.photoUrl)}
                      alt={connection.name}
                      name={connection.name}
                      size="sm"
                      className="h-10 w-10 sm:h-12 sm:w-12"
                      isAgent={!!connection.id && agentIds.has(connection.id)}
                    />
                    <div className="flex flex-col">
                      <span className="font-pixel text-sm sm:text-base md:text-lg font-semibold">
                        {connection.name}
                      </span>
                      {connection.social.length > 0 && (
                        <span className="font-pixel text-muted inline-flex items-center text-sm">
                          <Icons.xLogo className="text-muted mr-1 size-3" />
                          <span className="text-muted">
                            {connection.social
                              .find(s => s.platform === 'x')
                              ?.url.split('/')
                              .pop() || 'x'}
                          </span>
                        </span>
                      )}
                    </div>
                  </Link>
                </div>

                {confirmingDelete === connection.connectionId ? (
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deleteConnectionMutation.isPending}
                      onClick={() =>
                        handleRemoveFriend(
                          connection.connectionId,
                          connection.name
                        )
                      }
                    >
                      {deleteConnectionMutation.isPending
                        ? 'Removing...'
                        : 'Confirm'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmingDelete(null)}
                      disabled={deleteConnectionMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      setConfirmingDelete(connection.connectionId)
                    }
                  >
                    Remove Friend
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted">No friends found</p>
          </div>
        )}
      </div>
    </div>
  );
}
