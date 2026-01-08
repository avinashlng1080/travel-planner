import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery, useMutation } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, User, ChevronDown, LogOut, Settings, Plus } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { api } from '../../convex/_generated/api';
import { CreateTripCard } from '../components/trips/CreateTripCard';
import { CreateTripModal } from '../components/trips/CreateTripModal';
import { InviteModal } from '../components/trips/InviteModal';
import { TripCard } from '../components/trips/TripCard';

import type { Id } from '../../convex/_generated/dataModel';

type FilterTab = 'all' | 'my-trips' | 'shared';

interface DashboardPageProps {
  onOpenTrip: (tripId: Id<'trips'>) => void;
}

export function DashboardPage({ onOpenTrip }: DashboardPageProps) {
  const { signOut } = useAuthActions();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [inviteModalTripId, setInviteModalTripId] = useState<Id<'trips'> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Convex queries and mutations
  const trips = useQuery(api.trips.getMyTrips);
  const deleteTrip = useMutation(api.trips.deleteTrip);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  // Filter trips based on active tab
  const filteredTrips = (trips || []).filter((trip) => {
    if (activeFilter === 'my-trips') {return trip.userRole === 'owner';}
    if (activeFilter === 'shared') {return trip.userRole !== 'owner';}
    return true;
  });

  // Handlers
  const handleCreateTrip = () => {
    setShowCreateModal(true);
  };

  const handleTripCreated = async (tripId: string) => {
    console.log('Trip created:', tripId);
    setShowCreateModal(false);
    // TODO: Navigate to the new trip or show success message
  };

  const handleOpenTrip = (tripId: Id<'trips'>) => {
    onOpenTrip(tripId);
  };

  const handleShareTrip = (tripId: Id<'trips'>) => {
    setInviteModalTripId(tripId);
  };

  const handleDeleteTrip = async (tripId: Id<'trips'>) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this trip? This action cannot be undone.'
    );
    if (!confirmed) {return;}

    try {
      await deleteTrip({ tripId });
    } catch (error) {
      console.error('Failed to delete trip:', error);
      // TODO: Show error toast
    }
  };

  // Loading state
  const isLoading = trips === undefined;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sunset-50/30 font-['DM_Sans']">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center shadow-glow-sunset">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900 hidden sm:block">
                TripPlanner
              </span>
            </div>

            {/* Right: Settings and User Menu */}
            <div className="flex items-center gap-2">
              <button
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => { setShowUserMenu(!showUserMenu); }}
                  className="flex items-center gap-2 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-lg transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-full flex items-center justify-center shadow-lg">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className="w-4 h-4 hidden sm:block" />
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="p-3 border-b border-slate-100">
                        <p className="text-xs text-slate-500">Signed in</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Title and CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">My Trips</h1>
            <p className="mt-2 text-slate-600">Plan, organize, and share your travel adventures</p>
          </div>

          {/* Create Trip Button - Desktop */}
          <button
            onClick={handleCreateTrip}
            className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sunset-500 to-ocean-600 hover:from-sunset-600 hover:to-ocean-700 text-white font-medium rounded-xl shadow-lg shadow-sunset-500/30 hover:shadow-xl transition-all duration-200"
            aria-label="Create new trip"
          >
            <Plus className="w-5 h-5" />
            Create Trip
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          <FilterTabButton
            label="All Trips"
            count={trips?.length || 0}
            isActive={activeFilter === 'all'}
            onClick={() => { setActiveFilter('all'); }}
          />
          <FilterTabButton
            label="My Trips"
            count={trips?.filter((t) => t.userRole === 'owner').length || 0}
            isActive={activeFilter === 'my-trips'}
            onClick={() => { setActiveFilter('my-trips'); }}
          />
          <FilterTabButton
            label="Shared With Me"
            count={trips?.filter((t) => t.userRole !== 'owner').length || 0}
            isActive={activeFilter === 'shared'}
            onClick={() => { setActiveFilter('shared'); }}
          />
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-sunset-500/30 border-t-sunset-500 rounded-full animate-spin" />
              <p className="text-slate-600">Loading your trips...</p>
            </div>
          </div>
        ) : /* Trips Grid */
        filteredTrips.length === 0 ? (
          <EmptyState activeFilter={activeFilter} onCreateTrip={handleCreateTrip} />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Create Trip Card - First position on mobile */}
            <motion.div variants={itemVariants} className="sm:hidden">
              <CreateTripCard onClick={handleCreateTrip} />
            </motion.div>

            {/* Create Trip Card - First position on desktop */}
            <motion.div variants={itemVariants} className="hidden sm:block">
              <CreateTripCard onClick={handleCreateTrip} />
            </motion.div>

            {/* Trip Cards */}
            {filteredTrips.map((trip) => (
              <motion.div key={trip._id} variants={itemVariants}>
                <TripCard
                  trip={{
                    ...trip,
                    role: trip.userRole,
                    memberCount: 1, // TODO: Query actual member count
                  }}
                  onOpen={handleOpenTrip}
                  onShare={handleShareTrip}
                  onDelete={handleDeleteTrip}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); }}
        onSuccess={handleTripCreated}
      />

      {/* Invite Modal */}
      {inviteModalTripId && (
        <InviteModal
          isOpen
          onClose={() => { setInviteModalTripId(null); }}
          tripId={inviteModalTripId}
          tripName={trips?.find(t => t._id === inviteModalTripId)?.name || 'Trip'}
        />
      )}
    </div>
  );
}

// Filter Tab Component
function FilterTabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
        isActive
          ? 'bg-white text-slate-900 shadow-md'
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
      }`}
    >
      {label}
      <span
        className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
          isActive ? 'bg-sunset-100 text-sunset-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

// Empty State Component
function EmptyState({
  activeFilter,
  onCreateTrip,
}: {
  activeFilter: FilterTab;
  onCreateTrip: () => void;
}) {
  const getMessage = () => {
    switch (activeFilter) {
      case 'my-trips':
        return {
          title: 'No trips yet',
          description: "You haven't created any trips yet. Start planning your next adventure!",
          showCTA: true,
        };
      case 'shared':
        return {
          title: 'No shared trips',
          description: "You don't have any trips shared with you yet.",
          showCTA: false,
        };
      default:
        return {
          title: 'No trips found',
          description: 'Create your first trip to get started!',
          showCTA: true,
        };
    }
  };

  const message = getMessage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-sunset-500/10 to-ocean-600/10 rounded-2xl flex items-center justify-center mb-6">
        <MapPin className="w-10 h-10 text-sunset-600" />
      </div>

      <h3 className="text-xl font-semibold text-slate-900 mb-2">{message.title}</h3>
      <p className="text-slate-600 text-center max-w-md mb-6">{message.description}</p>

      {message.showCTA && (
        <button
          onClick={onCreateTrip}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sunset-500 to-ocean-600 hover:from-sunset-600 hover:to-ocean-700 text-white font-medium rounded-xl shadow-lg shadow-sunset-500/30 hover:shadow-xl transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Create Your First Trip
        </button>
      )}
    </motion.div>
  );
}
