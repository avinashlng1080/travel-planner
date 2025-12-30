/* eslint-disable react-hooks/purity */
// TODO: Refactor to avoid calling setState from useMemo
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  MoreVertical,
  Check,
  ChevronRight,
  UserMinus,
  Mail,
  X,
  Clock,
} from 'lucide-react';
import { GlassPanel, GlassBadge, GlassButton } from '@/components/ui/GlassPanel';
import { Avatar } from '@/components/ui/Avatar';

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
  status: 'accepted' | 'pending';
  joinedAt?: number;
}

interface MemberListProps {
  members: Member[];
  currentUserRole: 'owner' | 'editor' | 'commenter' | 'viewer';
  onChangeRole?: (userId: string, newRole: 'editor' | 'commenter' | 'viewer') => void;
  onRemoveMember?: (userId: string) => void;
  onInvite?: () => void;
  onResendInvite?: (userId: string) => void;
  onCancelInvite?: (userId: string) => void;
}

type Role = 'owner' | 'editor' | 'commenter' | 'viewer';

const roleColors: Record<Role, 'pink' | 'blue' | 'green' | 'slate'> = {
  owner: 'pink',
  editor: 'blue',
  commenter: 'green',
  viewer: 'slate',
};

const roleLabels: Record<Role, string> = {
  owner: 'Owner',
  editor: 'Editor',
  commenter: 'Commenter',
  viewer: 'Viewer',
};

const roleDescriptions: Record<Role, string> = {
  owner: 'Full access and control',
  editor: 'Can edit trip details',
  commenter: 'Can add comments',
  viewer: 'Read-only access',
};

function MemberRow({
  member,
  isOwner,
  onChangeRole,
  onRemoveMember,
  onResendInvite,
  onCancelInvite,
}: {
  member: Member;
  isOwner: boolean;
  onChangeRole?: (newRole: 'editor' | 'commenter' | 'viewer') => void;
  onRemoveMember?: () => void;
  onResendInvite?: () => void;
  onCancelInvite?: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const availableRoles: ('editor' | 'commenter' | 'viewer')[] = ['editor', 'commenter', 'viewer'];
  const isPending = member.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/50 transition-colors">
        {/* Avatar */}
        <Avatar name={member.name} imageUrl={member.avatarUrl} size="md" />

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900 truncate">{member.name}</p>
            {isPending && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Clock className="w-3 h-3" />
                <span>Pending</span>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{member.email}</p>
        </div>

        {/* Role Badge */}
        <GlassBadge color={roleColors[member.role]}>{roleLabels[member.role]}</GlassBadge>

        {/* Actions Dropdown (only for owners, and not for themselves) */}
        {isOwner && member.role !== 'owner' && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              aria-label="Member actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showActions && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setShowActions(false);
                      setShowRoleMenu(false);
                    }}
                  />

                  {/* Dropdown Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-56 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl overflow-hidden"
                  >
                    {isPending ? (
                      // Pending member actions
                      <>
                        <button
                          onClick={() => {
                            onResendInvite?.();
                            setShowActions(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Resend invite
                        </button>
                        <button
                          onClick={() => {
                            onCancelInvite?.();
                            setShowActions(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                        >
                          <X className="w-4 h-4" />
                          Cancel invite
                        </button>
                      </>
                    ) : (
                      // Active member actions
                      <>
                        <div className="relative">
                          <button
                            onClick={() => setShowRoleMenu(!showRoleMenu)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <span>Change role</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {showRoleMenu && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-full top-0 ml-1 w-56 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl overflow-hidden"
                              >
                                {availableRoles.map((role) => (
                                  <button
                                    key={role}
                                    onClick={() => {
                                      if (role !== member.role) {
                                        onChangeRole?.(role);
                                      }
                                      setShowActions(false);
                                      setShowRoleMenu(false);
                                    }}
                                    disabled={role === member.role}
                                    className={`
                                      w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                                      ${
                                        role === member.role
                                          ? 'bg-slate-50 text-slate-900 cursor-default'
                                          : 'text-slate-700 hover:bg-slate-50'
                                      }
                                    `}
                                  >
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium">{roleLabels[role]}</span>
                                      <span className="text-xs text-slate-500">
                                        {roleDescriptions[role]}
                                      </span>
                                    </div>
                                    {role === member.role && (
                                      <Check className="w-4 h-4 text-sunset-600" />
                                    )}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <button
                          onClick={() => {
                            onRemoveMember?.();
                            setShowActions(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                        >
                          <UserMinus className="w-4 h-4" />
                          Remove from trip
                        </button>
                      </>
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

export function MemberList({
  members,
  currentUserRole,
  onChangeRole,
  onRemoveMember,
  onInvite,
  onResendInvite,
  onCancelInvite,
}: MemberListProps) {
  const isOwner = currentUserRole === 'owner';

  // Separate active and pending members
  const activeMembers = members.filter((m) => m.status === 'accepted');
  const pendingMembers = members.filter((m) => m.status === 'pending');

  return (
    <GlassPanel className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Members</h2>
          <GlassBadge color="slate">{members.length}</GlassBadge>
        </div>

        {isOwner && onInvite && (
          <GlassButton variant="primary" size="sm" onClick={onInvite}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite
          </GlassButton>
        )}
      </div>

      {/* Active Members List */}
      {activeMembers.length > 0 ? (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {activeMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isOwner={isOwner}
                onChangeRole={
                  onChangeRole ? (newRole) => onChangeRole(member.userId, newRole) : undefined
                }
                onRemoveMember={onRemoveMember ? () => onRemoveMember(member.userId) : undefined}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-slate-500"
        >
          <p>No members yet. Invite your family to collaborate!</p>
        </motion.div>
      )}

      {/* Pending Invites Section */}
      {pendingMembers.length > 0 && (
        <div className="pt-4 border-t border-slate-200/50 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            Pending Invites
            <GlassBadge color="amber">{pendingMembers.length}</GlassBadge>
          </h3>
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {pendingMembers.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isOwner={isOwner}
                  onResendInvite={onResendInvite ? () => onResendInvite(member.userId) : undefined}
                  onCancelInvite={onCancelInvite ? () => onCancelInvite(member.userId) : undefined}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}
