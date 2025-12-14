import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Link2, Pencil, MessageCircle, Eye, Check, Copy, Send, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { GlassPanel, GlassInput, GlassButton, GlassBadge } from '../ui/GlassPanel';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  tripName: string;
}

type Role = 'editor' | 'commenter' | 'viewer';

type TabType = 'email' | 'link';

interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  sentAt: Date;
}

interface ShareLink {
  id: string;
  role: Role;
  url: string;
  createdAt: Date;
  expiresAt?: Date;
}

const roleConfig = {
  editor: {
    icon: Pencil,
    label: 'Editor',
    description: 'Can edit plans and activities',
    color: 'blue' as const,
  },
  commenter: {
    icon: MessageCircle,
    label: 'Commenter',
    description: 'Can view and comment',
    color: 'green' as const,
  },
  viewer: {
    icon: Eye,
    label: 'Viewer',
    description: 'View only',
    color: 'slate' as const,
  },
};

export function InviteModal({ isOpen, onClose, tripId, tripName }: InviteModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('email');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('editor');
  const [linkRole, setLinkRole] = useState<Role>('viewer');
  const [expiration, setExpiration] = useState<'never' | '7days' | '24hours'>('never');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Mock data - will be replaced with Convex queries
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([
    {
      id: '1',
      email: 'sarah@example.com',
      role: 'editor',
      sentAt: new Date(Date.now() - 86400000), // 1 day ago
    },
    {
      id: '2',
      email: 'john@example.com',
      role: 'viewer',
      sentAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
  ]);

  const [shareLinks, setShareLinks] = useState<ShareLink[]>([
    {
      id: '1',
      role: 'viewer',
      url: `https://travelplanner.app/join/${tripId}/abc123`,
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      expiresAt: new Date(Date.now() + 432000000), // expires in 5 days
    },
  ]);

  const handleSendInvite = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter an email address');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // TODO: Replace with actual Convex mutation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add to pending invites (mock)
      const newInvite: PendingInvite = {
        id: Date.now().toString(),
        email,
        role: selectedRole,
        sentAt: new Date(),
      };
      setPendingInvites([...pendingInvites, newInvite]);

      setSuccessMessage(`Invitation sent to ${email}`);
      setEmail('');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendInvite = async (inviteId: string, email: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual Convex mutation
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccessMessage(`Invitation resent to ${email}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to resend invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvite = (inviteId: string) => {
    // TODO: Replace with actual Convex mutation
    setPendingInvites(pendingInvites.filter(invite => invite.id !== inviteId));
    setSuccessMessage('Invitation cancelled');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleGenerateLink = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // TODO: Replace with actual Convex mutation
      await new Promise(resolve => setTimeout(resolve, 500));

      const expiresAt = expiration === 'never'
        ? undefined
        : expiration === '7days'
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);

      const newLink: ShareLink = {
        id: Date.now().toString(),
        role: linkRole,
        url: `https://travelplanner.app/join/${tripId}/${Math.random().toString(36).substring(7)}`,
        createdAt: new Date(),
        expiresAt,
      };

      setShareLinks([...shareLinks, newLink]);
      setGeneratedLink(newLink.url);
      setSuccessMessage('Share link generated');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Failed to generate link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(linkId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      setErrorMessage('Failed to copy link');
    }
  };

  const handleRevokeLink = (linkId: string) => {
    // TODO: Replace with actual Convex mutation
    setShareLinks(shareLinks.filter(link => link.id !== linkId));
    if (generatedLink && shareLinks.find(l => l.id === linkId)?.url === generatedLink) {
      setGeneratedLink(null);
    }
    setSuccessMessage('Share link revoked');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const formatRelativeTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatExpirationTime = (date: Date) => {
    const now = Date.now();
    const diff = date.getTime() - now;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (diff < 0) return 'Expired';
    if (hours < 24) return `Expires in ${hours}h`;
    return `Expires in ${days}d`;
  };

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
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
          >
            <GlassPanel
              className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative"
              initial={false}
              animate={false}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors z-10"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-200/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Invite to Trip
                    </h2>
                    <p className="text-sm text-slate-600">
                      {tripName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Switcher */}
              <div
                className="px-6 pt-4 flex gap-1 border-b border-slate-200/50"
                role="tablist"
                aria-label="Invitation methods"
              >
                <button
                  role="tab"
                  aria-selected={activeTab === 'email'}
                  aria-controls="email-panel"
                  onClick={() => setActiveTab('email')}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative
                    ${activeTab === 'email'
                      ? 'text-sunset-600'
                      : 'text-slate-600 hover:text-slate-900'
                    }
                  `}
                >
                  <Mail className="w-4 h-4" />
                  Invite by Email
                  {activeTab === 'email' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sunset-500 to-ocean-600"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                    />
                  )}
                </button>

                <button
                  role="tab"
                  aria-selected={activeTab === 'link'}
                  aria-controls="link-panel"
                  onClick={() => setActiveTab('link')}
                  className={`
                    flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors relative
                    ${activeTab === 'link'
                      ? 'text-sunset-600'
                      : 'text-slate-600 hover:text-slate-900'
                    }
                  `}
                >
                  <Link2 className="w-4 h-4" />
                  Share Link
                  {activeTab === 'link' && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sunset-500 to-ocean-600"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                    />
                  )}
                </button>
              </div>

              {/* Success/Error Messages */}
              <AnimatePresence>
                {(successMessage || errorMessage) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                      successMessage
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {successMessage ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {successMessage || errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {activeTab === 'email' && (
                  <div role="tabpanel" id="email-panel" aria-labelledby="email-tab">
                    {/* Email Input Section */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <label htmlFor="email-input" className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address
                        </label>
                        <GlassInput
                          id="email-input"
                          type="email"
                          placeholder="colleague@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Role
                        </label>
                        <div className="space-y-2">
                          {(Object.keys(roleConfig) as Role[]).map((role) => {
                            const config = roleConfig[role];
                            const Icon = config.icon;
                            return (
                              <label
                                key={role}
                                className={`
                                  flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                  ${selectedRole === role
                                    ? 'border-sunset-500 bg-sunset-50/50'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                  }
                                `}
                              >
                                <input
                                  type="radio"
                                  name="role"
                                  value={role}
                                  checked={selectedRole === role}
                                  onChange={() => setSelectedRole(role)}
                                  className="sr-only"
                                />
                                <div className={`
                                  w-8 h-8 rounded-lg flex items-center justify-center
                                  ${selectedRole === role
                                    ? 'bg-gradient-to-br from-sunset-500 to-ocean-600'
                                    : 'bg-slate-100'
                                  }
                                `}>
                                  <Icon className={`w-4 h-4 ${selectedRole === role ? 'text-white' : 'text-slate-600'}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-slate-900">{config.label}</div>
                                  <div className="text-xs text-slate-600">{config.description}</div>
                                </div>
                                {selectedRole === role && (
                                  <Check className="w-5 h-5 text-sunset-600" />
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <GlassButton
                        variant="primary"
                        size="lg"
                        onClick={handleSendInvite}
                        disabled={isLoading || !email.trim()}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {isLoading ? 'Sending...' : 'Send Invite'}
                      </GlassButton>
                    </div>

                    {/* Pending Invites */}
                    {pendingInvites.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">
                          Pending Invitations ({pendingInvites.length})
                        </h3>
                        <div className="space-y-2">
                          {pendingInvites.map((invite) => {
                            const config = roleConfig[invite.role];
                            const Icon = config.icon;
                            return (
                              <motion.div
                                key={invite.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-4 h-4 text-slate-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-slate-900 truncate">
                                      {invite.email}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Sent {formatRelativeTime(invite.sentAt)}
                                    </div>
                                  </div>
                                  <GlassBadge color={config.color} className="flex-shrink-0">
                                    {config.label}
                                  </GlassBadge>
                                </div>
                                <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                                  <button
                                    onClick={() => handleResendInvite(invite.id, invite.email)}
                                    className="p-1.5 text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 rounded transition-colors"
                                    aria-label="Resend invitation"
                                    title="Resend"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelInvite(invite.id)}
                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    aria-label="Cancel invitation"
                                    title="Cancel"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'link' && (
                  <div role="tabpanel" id="link-panel" aria-labelledby="link-tab">
                    {/* Link Generation Section */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                          Role for link recipients
                        </label>
                        <div className="space-y-2">
                          {(Object.keys(roleConfig) as Role[]).map((role) => {
                            const config = roleConfig[role];
                            const Icon = config.icon;
                            return (
                              <label
                                key={role}
                                className={`
                                  flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                  ${linkRole === role
                                    ? 'border-sunset-500 bg-sunset-50/50'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                  }
                                `}
                              >
                                <input
                                  type="radio"
                                  name="linkRole"
                                  value={role}
                                  checked={linkRole === role}
                                  onChange={() => setLinkRole(role)}
                                  className="sr-only"
                                />
                                <div className={`
                                  w-8 h-8 rounded-lg flex items-center justify-center
                                  ${linkRole === role
                                    ? 'bg-gradient-to-br from-sunset-500 to-ocean-600'
                                    : 'bg-slate-100'
                                  }
                                `}>
                                  <Icon className={`w-4 h-4 ${linkRole === role ? 'text-white' : 'text-slate-600'}`} />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-slate-900">{config.label}</div>
                                  <div className="text-xs text-slate-600">{config.description}</div>
                                </div>
                                {linkRole === role && (
                                  <Check className="w-5 h-5 text-sunset-600" />
                                )}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Link Expiration
                        </label>
                        <select
                          value={expiration}
                          onChange={(e) => setExpiration(e.target.value as typeof expiration)}
                          className="w-full bg-white backdrop-blur-lg border border-slate-200 rounded-xl px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sunset-500/50 focus:border-sunset-500/50 transition-all duration-200"
                        >
                          <option value="never">Never expires</option>
                          <option value="7days">Expires in 7 days</option>
                          <option value="24hours">Expires in 24 hours</option>
                        </select>
                      </div>

                      <GlassButton
                        variant="primary"
                        size="lg"
                        onClick={handleGenerateLink}
                        disabled={isLoading}
                        className="w-full"
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        {isLoading ? 'Generating...' : 'Generate Link'}
                      </GlassButton>

                      {/* Generated Link Display */}
                      {generatedLink && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-sunset-50 rounded-lg border border-sunset-200"
                        >
                          <label className="block text-xs font-medium text-slate-700 mb-2">
                            Share this link
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={generatedLink}
                              readOnly
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-mono"
                            />
                            <GlassButton
                              variant="default"
                              onClick={() => {
                                const link = shareLinks.find(l => l.url === generatedLink);
                                if (link) handleCopyLink(generatedLink, link.id);
                              }}
                              className="flex-shrink-0"
                            >
                              {copiedLinkId === shareLinks.find(l => l.url === generatedLink)?.id ? (
                                <>
                                  <Check className="w-4 h-4 mr-2 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </>
                              )}
                            </GlassButton>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Active Links */}
                    {shareLinks.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">
                          Active Links ({shareLinks.length})
                        </h3>
                        <div className="space-y-2">
                          {shareLinks.map((link) => {
                            const config = roleConfig[link.role];
                            const Icon = config.icon;
                            const isExpired = link.expiresAt && link.expiresAt.getTime() < Date.now();
                            return (
                              <motion.div
                                key={link.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className={`
                                  p-3 rounded-lg border
                                  ${isExpired
                                    ? 'bg-slate-50 border-slate-200 opacity-60'
                                    : 'bg-white border-slate-200'
                                  }
                                `}
                              >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                      <Icon className="w-4 h-4 text-slate-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <GlassBadge color={config.color}>
                                          {config.label}
                                        </GlassBadge>
                                        {link.expiresAt && (
                                          <span className={`text-xs ${isExpired ? 'text-red-600' : 'text-slate-500'}`}>
                                            {formatExpirationTime(link.expiresAt)}
                                          </span>
                                        )}
                                        {!link.expiresAt && (
                                          <span className="text-xs text-slate-500">
                                            Never expires
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        Created {formatRelativeTime(link.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => handleCopyLink(link.url, link.id)}
                                      disabled={isExpired}
                                      className={`
                                        p-1.5 rounded transition-colors
                                        ${isExpired
                                          ? 'text-slate-400 cursor-not-allowed'
                                          : 'text-slate-500 hover:text-ocean-600 hover:bg-ocean-50'
                                        }
                                      `}
                                      aria-label="Copy link"
                                      title="Copy"
                                    >
                                      {copiedLinkId === link.id ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleRevokeLink(link.id)}
                                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      aria-label="Revoke link"
                                      title="Revoke"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="bg-slate-50 rounded px-2 py-1.5 font-mono text-xs text-slate-600 truncate">
                                  {link.url}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
