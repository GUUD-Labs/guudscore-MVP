import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Link } from '@tanstack/react-router';

import Icons from '@/components/icons';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Button } from '@/components/ui/button';
import { VouchButtons } from '@/components/vouch-buttons';
import { useAgentIds, useReceivedVouches } from '@/hooks';
import { cn } from '@/lib/utils';
import type { ReceivedVouch } from '@/types/vouch';

interface VouchHistoryListProps {
  userId: string;
  className?: string;
  isOwnProfile?: boolean;
}

export const VouchHistoryList = ({ userId, className, isOwnProfile = false }: VouchHistoryListProps) => {
  const { data, isLoading, error } = useReceivedVouches(userId);
  const [activeTab, setActiveTab] = useState<'likes' | 'dislikes'>('likes');

  if (isLoading) {
    return (
      <div className={cn('glass rounded-lg p-4', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail if API not ready
  }

  const likes = data?.likes || [];
  const dislikes = data?.dislikes || [];

  const activeList = activeTab === 'likes' ? likes : dislikes;

  return (
    <div className={cn('glass rounded-lg p-4', className)}>
      <h4 className="mb-3 text-sm font-semibold">Vouches</h4>
      
      {/* Vouch Buttons - only show for other users */}
      {!isOwnProfile && (
        <div className="mb-4">
          <VouchButtons targetUserId={userId} size="sm" />
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeTab === 'likes' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('likes')}
          className={cn(
            'flex-1 h-8 text-xs',
            activeTab === 'likes' && 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
          )}
        >
          <Icons.thumbsUp className="size-3 mr-1" />
          Likes ({likes.length})
        </Button>
        <Button
          variant={activeTab === 'dislikes' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('dislikes')}
          className={cn(
            'flex-1 h-8 text-xs',
            activeTab === 'dislikes' && 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
          )}
        >
          <Icons.thumbsDown className="size-3 mr-1" />
          Dislikes ({dislikes.length})
        </Button>
      </div>

      {/* List */}
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {activeList.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-xs">
              No {activeTab} yet
            </p>
          </div>
        ) : (
          activeList.map((vouch: ReceivedVouch) => (
            <VouchUserItem key={vouch.user.id} vouch={vouch} type={activeTab} />
          ))
        )}
      </div>
    </div>
  );
};

interface VouchUserItemProps {
  vouch: ReceivedVouch;
  type: 'likes' | 'dislikes';
}

const VouchUserItem = ({ vouch, type }: VouchUserItemProps) => {
  const agentIds = useAgentIds();
  const { user, createdAt } = vouch;
  const slug = user.slug || user.name;

  // Format date
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Link
      to="/profile/$username"
      params={{ username: slug }}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md transition-colors bg-primary/5 border border-primary/10',
        'hover:bg-primary/10'
      )}
    >
      <ProfileAvatar
        src={user.profileImage}
        name={user.name}
        alt={user.name}
        size="sm"
        className="size-6 shrink-0"
        isAgent={agentIds.has(user.id)}
      />
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-xs font-medium truncate">{user.name}</span>
        {user.twitterUsername && (
          <span className="text-[10px] text-muted-foreground truncate">
            @{user.twitterUsername}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {type === 'likes' ? (
          <Icons.thumbsUp className="size-2.5 text-primary" />
        ) : (
          <Icons.thumbsDown className="size-2.5 text-primary" />
        )}
        <span className="text-[10px] text-muted-foreground">
          {formatTimeAgo(createdAt)}
        </span>
      </div>
    </Link>
  );
};
