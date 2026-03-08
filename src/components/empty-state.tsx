import { Image } from 'lucide-react';

import type { ReactNode } from 'react';

import { Heading } from '@/components/heading';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';

const Wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="glass flex flex-col items-center gap-8 rounded-md p-6">
      {children}
    </div>
  );
};

export const SocialLinksEmptyState = ({ action }: { action: ReactNode }) => {
  return (
    <Wrapper>
      <Heading
        title="No social links added"
        description="Click the select button to add your first social links"
      />

      <div>{action}</div>
    </Wrapper>
  );
};

export const CustomButtonsEmptyState = ({ action }: { action: ReactNode }) => {
  return (
    <Wrapper>
      <Heading
        title="No custom buttons added"
        description="Click the select button to add your first custom button"
      />

      <div>{action}</div>
    </Wrapper>
  );
};

export const GuudCardEmptyState = ({ action }: { action: ReactNode }) => {
  return (
    <Wrapper>
      <Heading
        title="Request GuudCard"
        description="Create your personalized digital card to showcase your profile and achievements"
      />

      <div>{action}</div>
    </Wrapper>
  );
};

export const NftCollectionEmptyState = () => {
  return (
    <Empty className="dark:border-muted/20 col-span-full border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Image />
        </EmptyMedia>
      </EmptyHeader>
      <EmptyTitle>No NFTs found</EmptyTitle>
      <EmptyDescription>
        No NFTs were found belonging to this user.
      </EmptyDescription>
    </Empty>
  );
};
