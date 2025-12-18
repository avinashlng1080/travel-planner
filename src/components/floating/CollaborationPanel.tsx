import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Share2, MessageSquare, Activity, Send, Trash2 } from 'lucide-react';
import { useAtom, useSetAtom } from 'jotai';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { FloatingPanel } from '../ui/FloatingPanel';
import { GlassButton, GlassInput } from '../ui/GlassPanel';
import { panelsAtom, closePanelAtom, toggleMinimizeAtom, updatePositionAtom, bringToFrontAtom } from '../../atoms/floatingPanelAtoms';
import { collaborationTabAtom } from '../../atoms/collaborationAtoms';
import { InviteModal } from '../trips/InviteModal';
import { MemberList } from '../trips/MemberList';
import { ActivityFeed } from '../trips/ActivityFeed';
import { useResponsivePanel } from '../../hooks/useResponsivePanel';

interface CollaborationPanelProps {
  tripId: Id<'trips'>;
  tripName: string;
  userRole: 'owner' | 'editor' | 'commenter' | 'viewer';
}

const tabs = [
  { id: 'share' as const, label: 'Share', icon: Share2 },
  { id: 'members' as const, label: 'Members', icon: Users },
  { id: 'comments' as const, label: 'Comments', icon: MessageSquare },
  { id: 'activity' as const, label: 'Activity', icon: Activity },
];

export function CollaborationPanel({ tripId, tripName, userRole }: CollaborationPanelProps) {
  const [panels] = useAtom(panelsAtom);
  const closePanel = useSetAtom(closePanelAtom);
  const toggleMinimize = useSetAtom(toggleMinimizeAtom);
  const updatePosition = useSetAtom(updatePositionAtom);
  const bringToFront = useSetAtom(bringToFrontAtom);
  const [activeTab, setActiveTab] = useAtom(collaborationTabAtom);

  const panel = panels.collaboration;
  const { width, height } = useResponsivePanel(500, 600);

  // State for inline invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Queries
  const members = useQuery(api.tripMembers.getMembers, { tripId });
  const comments = useQuery(api.tripComments.getCommentsByTrip, { tripId });
  const currentUserProfile = useQuery(api.userProfiles.getMyProfile);

  // Mutations
  const updateMemberRole = useMutation(api.tripMembers.updateMemberRole);
  const removeMember = useMutation(api.tripMembers.removeMember);
  const addComment = useMutation(api.tripComments.addComment);
  const deleteComment = useMutation(api.tripComments.deleteComment);

  const handleChangeRole = async (userId: string, newRole: 'editor' | 'commenter' | 'viewer') => {
    try {
      await updateMemberRole({ tripId, userId, newRole });
    } catch (error) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember({ tripId, userId });
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  return (
    <>
      <FloatingPanel
        id="collaboration"
        title="Collaboration"
        icon={Users}
        isOpen={panel.isOpen}
        isMinimized={panel.isMinimized}
        position={panel.position}
        size={{ width, height }}
        zIndex={panel.zIndex}
        onClose={() => closePanel('collaboration')}
        onMinimize={() => toggleMinimize('collaboration')}
        onPositionChange={(pos) => updatePosition({ panelId: 'collaboration', position: pos })}
        onFocus={() => bringToFront('collaboration')}
      >
        {/* Tab Navigation */}
        <div role="tablist" aria-label="Collaboration options" className="flex border-b border-slate-200/50 bg-white">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            // Hide share tab for non-owners
            if (tab.id === 'share' && userRole !== 'owner') return null;

            return (
              <button
                key={tab.id}
                role="tab"
                id={`collab-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`collab-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors relative
                  ${isActive
                    ? 'text-sunset-600'
                    : 'text-slate-600 hover:text-slate-900'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeCollabTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sunset-500 to-ocean-600"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div
          role="tabpanel"
          id={`collab-panel-${activeTab}`}
          aria-labelledby={`collab-tab-${activeTab}`}
          className="flex-1 overflow-y-auto"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'share' && userRole === 'owner' && (
              <ShareTabContent
                key="share"
                tripId={tripId}
                tripName={tripName}
                onOpenModal={() => setShowInviteModal(true)}
              />
            )}

            {activeTab === 'members' && (
              <MembersTabContent
                key="members"
                tripId={tripId}
                members={members}
                userRole={userRole}
                onChangeRole={handleChangeRole}
                onRemoveMember={handleRemoveMember}
                onInvite={() => {
                  setActiveTab('share');
                  setShowInviteModal(true);
                }}
              />
            )}

            {activeTab === 'comments' && (
              <CommentsTabContent
                key="comments"
                tripId={tripId}
                userRole={userRole}
                comments={comments}
                currentUserId={currentUserProfile?.userId}
                onAddComment={addComment}
                onDeleteComment={deleteComment}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityTabContent key="activity" tripId={tripId} />
            )}
          </AnimatePresence>
        </div>
      </FloatingPanel>

      {/* Inline Invite Modal */}
      {showInviteModal && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          tripId={tripId}
          tripName={tripName}
        />
      )}
    </>
  );
}

// Share Tab Content
function ShareTabContent({
  tripName,
  onOpenModal,
}: {
  tripId: Id<'trips'>;
  tripName: string;
  onOpenModal: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="p-6 space-y-4"
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-2xl flex items-center justify-center">
          <Share2 className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Share Your Trip
        </h3>
        <p className="text-sm text-slate-600 mb-6">
          Invite friends and family to collaborate on {tripName}
        </p>
      </div>

      <GlassButton
        variant="primary"
        size="lg"
        onClick={onOpenModal}
        className="w-full"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Open Invite Modal
      </GlassButton>

      <div className="pt-4 border-t border-slate-200/50">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h4>
        <div className="space-y-2 text-sm text-slate-600">
          <p>• Invite by email for secure access</p>
          <p>• Generate shareable links with role controls</p>
          <p>• Set expiration dates for temporary access</p>
          <p>• Manage pending invitations</p>
        </div>
      </div>
    </motion.div>
  );
}

// Members Tab Content
function MembersTabContent({
  members,
  userRole,
  onChangeRole,
  onRemoveMember,
  onInvite,
}: {
  tripId: Id<'trips'>;
  members: any[] | undefined;
  userRole: 'owner' | 'editor' | 'commenter' | 'viewer';
  onChangeRole: (userId: string, newRole: 'editor' | 'commenter' | 'viewer') => void;
  onRemoveMember: (userId: string) => void;
  onInvite: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="p-4"
    >
      {members === undefined ? (
        <div className="text-center py-8">
          <p className="text-slate-500">Loading members...</p>
        </div>
      ) : (
        <MemberList
          members={members}
          currentUserRole={userRole}
          onChangeRole={onChangeRole}
          onRemoveMember={onRemoveMember}
          onInvite={userRole === 'owner' ? onInvite : undefined}
        />
      )}
    </motion.div>
  );
}

// Comments Tab Content
function CommentsTabContent({
  tripId,
  userRole,
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
}: {
  tripId: Id<'trips'>;
  userRole: 'owner' | 'editor' | 'commenter' | 'viewer';
  comments: any[] | undefined;
  currentUserId?: Id<'users'>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAddComment: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDeleteComment: any;
}) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || userRole === 'viewer') return;

    setIsSubmitting(true);
    try {
      await onAddComment({
        tripId,
        content: newComment.trim(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: Id<'tripComments'>) => {
    try {
      await onDeleteComment({ commentId });
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="p-4 space-y-4"
    >
      {/* Add Comment Form */}
      {userRole !== 'viewer' && (
        <div className="space-y-2">
          <GlassInput
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isSubmitting}
          />
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </GlassButton>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments === undefined ? (
          <div className="text-center py-8">
            <p className="text-slate-500">Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No comments yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Start a discussion about this trip
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment: any) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-slate-200/50 rounded-lg p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm">
                      {comment.user?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {(userRole === 'owner' || comment.userId === currentUserId) && (
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700">{comment.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

// Activity Tab Content
function ActivityTabContent({ tripId }: { tripId: Id<'trips'> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="p-4"
    >
      <ActivityFeed tripId={tripId} compact={true} />
    </motion.div>
  );
}
