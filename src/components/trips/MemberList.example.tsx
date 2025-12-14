/**
 * Example usage of the MemberList component
 *
 * This file demonstrates how to integrate the MemberList component
 * with your trip management UI.
 */

import { useState } from 'react';
import { MemberList } from './MemberList';

// Example mock data
const mockMembers = [
  {
    id: '1',
    userId: 'user-1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    role: 'owner' as const,
    status: 'accepted' as const,
    joinedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
  },
  {
    id: '2',
    userId: 'user-2',
    name: 'Michael Chen',
    email: 'michael@example.com',
    role: 'editor' as const,
    status: 'accepted' as const,
    joinedAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
  },
  {
    id: '3',
    userId: 'user-3',
    name: 'Emma Williams',
    email: 'emma@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    role: 'commenter' as const,
    status: 'accepted' as const,
    joinedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
  },
  {
    id: '4',
    userId: 'user-4',
    name: 'David Park',
    email: 'david@example.com',
    role: 'viewer' as const,
    status: 'accepted' as const,
    joinedAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
  },
  {
    id: '5',
    userId: 'user-5',
    name: 'Olivia Martinez',
    email: 'olivia@example.com',
    role: 'editor' as const,
    status: 'pending' as const,
  },
];

export function MemberListExample() {
  const [members, setMembers] = useState(mockMembers);

  const handleChangeRole = (userId: string, newRole: 'editor' | 'commenter' | 'viewer') => {
    setMembers((prev) =>
      prev.map((member) =>
        member.userId === userId ? { ...member, role: newRole } : member
      )
    );
    console.log(`Changed role for user ${userId} to ${newRole}`);
  };

  const handleRemoveMember = (userId: string) => {
    setMembers((prev) => prev.filter((member) => member.userId !== userId));
    console.log(`Removed member ${userId}`);
  };

  const handleInvite = () => {
    console.log('Open invite dialog');
    // In a real app, this would open a modal to invite new members
  };

  const handleResendInvite = (userId: string) => {
    console.log(`Resending invite to user ${userId}`);
    // In a real app, this would trigger an API call to resend the invitation email
  };

  const handleCancelInvite = (userId: string) => {
    setMembers((prev) => prev.filter((member) => member.userId !== userId));
    console.log(`Cancelled invite for user ${userId}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <MemberList
        members={members}
        currentUserRole="owner"
        onChangeRole={handleChangeRole}
        onRemoveMember={handleRemoveMember}
        onInvite={handleInvite}
        onResendInvite={handleResendInvite}
        onCancelInvite={handleCancelInvite}
      />
    </div>
  );
}

/**
 * Integration with Convex
 *
 * In a real application, you would use Convex queries and mutations:
 *
 * ```typescript
 * import { useQuery, useMutation } from 'convex/react';
 * import { api } from '@/convex/_generated/api';
 *
 * function TripMembersPanel({ tripId }: { tripId: string }) {
 *   // Query members
 *   const members = useQuery(api.trips.getMembers, { tripId });
 *   const currentUser = useQuery(api.users.getCurrentUser);
 *
 *   // Mutations
 *   const changeRole = useMutation(api.trips.changeMemberRole);
 *   const removeMember = useMutation(api.trips.removeMember);
 *   const resendInvite = useMutation(api.trips.resendInvite);
 *   const cancelInvite = useMutation(api.trips.cancelInvite);
 *
 *   const [showInviteModal, setShowInviteModal] = useState(false);
 *
 *   if (!members || !currentUser) return <div>Loading...</div>;
 *
 *   const currentUserMember = members.find(m => m.userId === currentUser._id);
 *   const currentUserRole = currentUserMember?.role || 'viewer';
 *
 *   return (
 *     <>
 *       <MemberList
 *         members={members}
 *         currentUserRole={currentUserRole}
 *         onChangeRole={(userId, newRole) => {
 *           changeRole({ tripId, userId, newRole });
 *         }}
 *         onRemoveMember={(userId) => {
 *           removeMember({ tripId, userId });
 *         }}
 *         onInvite={() => setShowInviteModal(true)}
 *         onResendInvite={(userId) => {
 *           resendInvite({ tripId, userId });
 *         }}
 *         onCancelInvite={(userId) => {
 *           cancelInvite({ tripId, userId });
 *         }}
 *       />
 *
 *       {showInviteModal && (
 *         <InviteMemberModal
 *           tripId={tripId}
 *           onClose={() => setShowInviteModal(false)}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
