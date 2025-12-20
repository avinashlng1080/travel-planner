import { atom } from 'jotai';

import type { Id } from '../../convex/_generated/dataModel';

// Active tab in collaboration panel
export type CollaborationTab = 'share' | 'members' | 'comments' | 'activity';

export const collaborationTabAtom = atom<CollaborationTab>('members');

// Comment panel target for specific discussions
export const commentTargetAtom = atom<{
  type: 'trip' | 'plan' | 'activity';
  planId?: Id<'tripPlans'>;
  scheduleItemId?: Id<'tripScheduleItems'>;
} | null>(null);

// Quick access to invite modal from anywhere
export const quickInviteOpenAtom = atom<boolean>(false);
