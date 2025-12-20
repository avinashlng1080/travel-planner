import { motion } from 'framer-motion';
import { MapPin, Map, Calendar, Bot, Baby, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { GlassPanel } from '../components/ui/GlassPanel';

export function LandingPage() {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sunset-50/30 font-['DM_Sans']">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-slate-900">TripPlanner</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="order-2 lg:order-1"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Plan Your Perfect{' '}
                <span className="bg-gradient-to-r from-sunset-500 to-ocean-600 bg-clip-text text-transparent">
                  Family Trip
                </span>
              </h1>

              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                AI-powered travel planning designed for families with toddlers.
                Interactive maps, flexible itineraries, and smart recommendations
                make trip planning a breeze.
              </p>

              {/* Feature List */}
              <div className="mt-8 space-y-4">
                <FeatureItem
                  icon={<Map className="w-5 h-5" />}
                  title="Interactive Maps"
                  description="Visualize your entire trip with beautiful, interactive maps"
                />
                <FeatureItem
                  icon={<Calendar className="w-5 h-5" />}
                  title="Plan A/B System"
                  description="Create backup plans for weather changes or toddler meltdowns"
                />
                <FeatureItem
                  icon={<Bot className="w-5 h-5" />}
                  title="AI Travel Assistant"
                  description="Get personalized recommendations and answers to your questions"
                />
                <FeatureItem
                  icon={<Baby className="w-5 h-5" />}
                  title="Toddler-Friendly Ratings"
                  description="Every location rated for family and toddler friendliness"
                />
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Auth Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="order-1 lg:order-2"
            >
              <GlassPanel className="p-8" initial={false} animate={false}>
                {/* Tab Switcher */}
                <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => { setAuthMode('signup'); }}
                    className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${
                      authMode === 'signup'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => { setAuthMode('login'); }}
                    className={`flex-1 py-3 text-sm font-medium rounded-md transition-all ${
                      authMode === 'login'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                </div>

                {/* Auth Forms */}
                {authMode === 'signup' ? (
                  <SignupForm
                    onSuccess={() => {}}
                    onSwitchToLogin={() => { setAuthMode('login'); }}
                  />
                ) : (
                  <LoginForm
                    onSuccess={() => {}}
                    onSwitchToSignup={() => { setAuthMode('signup'); }}
                  />
                )}
              </GlassPanel>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <section className="bg-white border-t border-slate-100 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">
                Everything you need to plan the perfect trip
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Designed specifically for families traveling with young children
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Map className="w-6 h-6" />}
                title="Smart Itinerary Builder"
                description="Drag and drop locations to build your perfect day. See estimated travel times and plan around nap schedules."
              />
              <FeatureCard
                icon={<Bot className="w-6 h-6" />}
                title="AI-Powered Recommendations"
                description="Ask our AI assistant for restaurant suggestions, activity ideas, or answers to any travel question."
              />
              <FeatureCard
                icon={<Baby className="w-6 h-6" />}
                title="Family-First Planning"
                description="Every location includes toddler ratings, tips for traveling with kids, and what to bring."
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">TripPlanner - Plan your perfect family adventure</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-sunset-500/10 to-ocean-600/10 rounded-lg flex items-center justify-center text-sunset-600">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-slate-50 rounded-2xl p-6 border border-slate-100"
    >
      <div className="w-12 h-12 bg-gradient-to-br from-sunset-500 to-ocean-600 rounded-xl flex items-center justify-center text-white mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </motion.div>
  );
}
