import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageCircle,
  Send,
  MoreVertical,
  Edit2,
  Trash2,
  XCircle,
  CheckCircle,
} from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { GlassButton, GlassBadge } from '@/components/ui/GlassPanel';
import { Avatar } from '@/components/ui/Avatar';

interface CommentPanelProps {
  tripId: Id<'trips'>;
  scheduleItemId?: Id<'tripScheduleItems'>;
  planId?: Id<'tripPlans'>;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'owner' | 'editor' | 'commenter' | 'viewer';
}

interface Comment {
  _id: Id<'tripComments'>;
  tripId: Id<'trips'>;
  planId?: Id<'tripPlans'>;
  scheduleItemId?: Id<'tripScheduleItems'>;
  dayDate?: string;
  userId: Id<'users'>;
  content: string;
  createdAt: number;
  updatedAt?: number;
  isResolved: boolean;
  author: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
}

function CommentItem({
  comment,
  currentUserId,
  userRole,
  onEdit,
  onDelete,
  onResolve,
}: {
  comment: Comment;
  currentUserId?: string;
  userRole: 'owner' | 'editor' | 'commenter' | 'viewer';
  onEdit: (commentId: Id<'tripComments'>, content: string) => void;
  onDelete: (commentId: Id<'tripComments'>) => void;
  onResolve: (commentId: Id<'tripComments'>) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwnComment = currentUserId === comment.userId;
  const canEdit = isOwnComment;
  const canDelete = isOwnComment || userRole === 'owner';
  const canResolve = userRole === 'owner' || userRole === 'editor';

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment._id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`
        p-4 rounded-xl transition-colors
        ${comment.isResolved ? 'bg-slate-50/50 border border-slate-200/50' : 'bg-white border border-slate-200'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar
          name={comment.author?.name || 'Unknown'}
          imageUrl={comment.author?.avatarUrl}
          size="sm"
        />

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-slate-900 text-sm">
              {comment.author?.name || 'Unknown User'}
            </span>
            <span className="text-xs text-slate-500">{formatTime(comment.createdAt)}</span>
            {comment.updatedAt && comment.updatedAt > comment.createdAt && (
              <span className="text-xs text-slate-500">(edited)</span>
            )}
            {comment.isResolved && (
              <GlassBadge color="green" className="text-xs">
                Resolved
              </GlassBadge>
            )}
          </div>

          {/* Comment Body */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 resize-none min-h-[80px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') handleCancelEdit();
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSaveEdit();
                }}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim()}
                  className="px-3 py-1.5 bg-sunset-500 hover:bg-sunset-600 disabled:bg-slate-300 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          )}
        </div>

        {/* Actions Menu */}
        {!isEditing && (canEdit || canDelete || canResolve) && (
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              aria-label="Comment actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showActions && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />

                  {/* Dropdown Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-48 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl overflow-hidden"
                  >
                    {canEdit && !comment.isResolved && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit comment
                      </button>
                    )}

                    {canResolve && (
                      <button
                        onClick={() => {
                          onResolve(comment._id);
                          setShowActions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                      >
                        {comment.isResolved ? (
                          <>
                            <XCircle className="w-4 h-4" />
                            Unresolve
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Resolve
                          </>
                        )}
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this comment?')) {
                            onDelete(comment._id);
                          }
                          setShowActions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete comment
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function CommentPanel({
  tripId,
  scheduleItemId,
  planId,
  isOpen,
  onClose,
  userRole,
}: CommentPanelProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Determine which query to use based on props
  const queryFunction = scheduleItemId
    ? api.tripComments.getCommentsByScheduleItem
    : planId
      ? api.tripComments.getCommentsByPlan
      : null;

  const queryArgs = scheduleItemId
    ? { scheduleItemId }
    : planId
      ? { planId, includeResolved: true }
      : 'skip';

  const comments = useQuery(queryFunction as any, queryArgs as any) as Comment[] | undefined;

  const addComment = useMutation(api.tripComments.addComment);
  const updateComment = useMutation(api.tripComments.updateComment);
  const deleteComment = useMutation(api.tripComments.deleteComment);
  const resolveComment = useMutation(api.tripComments.resolveComment);
  const unresolveComment = useMutation(api.tripComments.unresolveComment);

  // Get current user ID from the first comment (if available)
  // In a real app, this would come from auth context
  const currentUserId = comments?.[0]?.userId;

  const canComment = ['owner', 'editor', 'commenter'].includes(userRole);

  // Auto-scroll to bottom when new comments are added
  useEffect(() => {
    if (isOpen && comments && comments.length > 0) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [comments?.length, isOpen]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen && canComment) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen, canComment]);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment({
        tripId,
        content: newComment.trim(),
        planId,
        scheduleItemId,
      });
      setNewComment('');
      // Scroll to bottom after adding comment
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: Id<'tripComments'>, content: string) => {
    try {
      await updateComment({ commentId, content });
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  const handleDelete = async (commentId: Id<'tripComments'>) => {
    try {
      await deleteComment({ commentId });
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const handleResolve = async (commentId: Id<'tripComments'>) => {
    try {
      const comment = comments?.find((c) => c._id === commentId);
      if (comment?.isResolved) {
        await unresolveComment({ commentId });
      } else {
        await resolveComment({ commentId });
      }
    } catch (error) {
      console.error('Failed to resolve/unresolve comment:', error);
      alert('Failed to update comment status. Please try again.');
    }
  };

  const unresolvedCount = comments?.filter((c) => !c.isResolved).length || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[45]"
            onClick={onClose}
          />

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-[46]"
          >
            <div className="h-full bg-white/95 backdrop-blur-xl border-l border-slate-200/50 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between bg-white/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Comments</h2>
                    {unresolvedCount > 0 && (
                      <p className="text-xs text-slate-600">{unresolvedCount} unresolved</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close comments"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {!comments ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-slate-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Loading comments...</p>
                    </div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-slate-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="mb-1 font-medium">No comments yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {comments.map((comment) => (
                      <CommentItem
                        key={comment._id}
                        comment={comment}
                        currentUserId={currentUserId}
                        userRole={userRole}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onResolve={handleResolve}
                      />
                    ))}
                  </AnimatePresence>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* New Comment Form */}
              {canComment && (
                <div className="px-6 py-4 border-t border-slate-200/50 bg-white/80">
                  <div className="space-y-3">
                    <textarea
                      ref={textareaRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 resize-none min-h-[100px] transition-all"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Press {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter to submit
                      </p>
                      <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || isSubmitting}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isSubmitting ? 'Sending...' : 'Send'}
                      </GlassButton>
                    </div>
                  </div>
                </div>
              )}

              {/* Viewer message */}
              {!canComment && (
                <div className="px-6 py-4 border-t border-slate-200/50 bg-slate-50/50">
                  <p className="text-sm text-slate-600 text-center">
                    You have view-only access. Contact the trip owner to request comment
                    permissions.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
