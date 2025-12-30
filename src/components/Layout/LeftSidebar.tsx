import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Calendar,
  CheckSquare,
  Lightbulb,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { GlassBadge } from '../ui/GlassPanel';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, active, badge, onClick }: SidebarItemProps) {
  return (
    <button
      className={`
        w-full flex items-center gap-3 px-3 py-2 rounded-lg
        transition-colors duration-200
        ${active ? 'bg-sunset-500/20 text-sunset-400' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
      `}
      onClick={onClick}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <GlassBadge color="red" className="ml-auto">
          {badge}
        </GlassBadge>
      )}
    </button>
  );
}

interface DayPlanItemProps {
  date: string;
  dayOfWeek: string;
  title: string;
  isToday?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

function DayPlanItem({ dayOfWeek, title, isToday, isSelected, onClick }: DayPlanItemProps) {
  return (
    <button
      className={`
        w-full text-left px-3 py-2 rounded-lg
        transition-all duration-200
        ${isSelected ? 'bg-gradient-to-r from-sunset-500 to-ocean-600 text-white' : 'hover:bg-slate-100'}
        ${isToday && !isSelected ? 'border border-sunset-500/50' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className={`text-xs font-medium ${isSelected ? 'text-white/90' : 'text-slate-600'}`}>
          {dayOfWeek}
        </span>
        {isToday && (
          <GlassBadge color="sunset" className="text-[10px]">
            TODAY
          </GlassBadge>
        )}
      </div>
      <div
        className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}
      >
        {title}
      </div>
    </button>
  );
}

interface CategoryFilterProps {
  categories: Array<{ id: string; name: string; color: string; visible: boolean }>;
  onToggle: (id: string) => void;
}

function CategoryFilter({ categories, onToggle }: CategoryFilterProps) {
  return (
    <div className="space-y-1">
      {categories.map((cat) => (
        <label
          key={cat.id}
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={cat.visible}
            onChange={() => onToggle(cat.id)}
            className="w-4 h-4 rounded border-slate-200 bg-white text-sunset-500 focus:ring-sunset-500/50"
          />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
          <span className="text-sm text-slate-600">{cat.name}</span>
        </label>
      ))}
    </div>
  );
}

interface LeftSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  dayPlans: Array<{
    id: string;
    date: string;
    dayOfWeek: string;
    title: string;
  }>;
  selectedDayId?: string;
  onDaySelect: (dayId: string) => void;
  todayId?: string;
  categories: Array<{ id: string; name: string; color: string; visible: boolean }>;
  onCategoryToggle: (id: string) => void;
  alertCount?: number;
}

export function LeftSidebar({
  activeSection,
  onSectionChange,
  dayPlans,
  selectedDayId,
  onDaySelect,
  todayId,
  categories,
  onCategoryToggle,
  alertCount = 0,
}: LeftSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    days: true,
    categories: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside
      className={`
        hidden lg:fixed lg:flex lg:flex-col top-14 left-0 bottom-0 z-40
        bg-white backdrop-blur-xl
        border-r border-slate-200
        transition-all duration-300
        ${collapsed ? 'w-16' : 'w-72'}
      `}
    >
      {/* Collapse Toggle */}
      <button
        className="absolute -right-3 top-4 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 z-10"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Navigation */}
          <nav className="space-y-1">
            <SidebarItem
              icon={MapPin}
              label="Locations"
              active={activeSection === 'locations'}
              onClick={() => onSectionChange('locations')}
            />
            <SidebarItem
              icon={Calendar}
              label="Itinerary"
              active={activeSection === 'itinerary'}
              onClick={() => onSectionChange('itinerary')}
            />
            <SidebarItem
              icon={CheckSquare}
              label="Checklists"
              active={activeSection === 'checklists'}
              onClick={() => onSectionChange('checklists')}
            />
            <SidebarItem
              icon={Lightbulb}
              label="Suggestions"
              active={activeSection === 'suggestions'}
              onClick={() => onSectionChange('suggestions')}
            />
            <SidebarItem
              icon={AlertTriangle}
              label="Alerts"
              badge={alertCount}
              active={activeSection === 'alerts'}
              onClick={() => onSectionChange('alerts')}
            />
          </nav>

          <div className="border-t border-slate-200" />

          {/* Daily Plans */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2"
              onClick={() => toggleSection('days')}
            >
              Daily Plans
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedSections.days ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
            <AnimatePresence>
              {expandedSections.days && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 max-h-64 overflow-y-auto"
                >
                  {dayPlans.map((day) => (
                    <DayPlanItem
                      key={day.id}
                      date={day.date}
                      dayOfWeek={day.dayOfWeek}
                      title={day.title}
                      isToday={day.id === todayId}
                      isSelected={day.id === selectedDayId}
                      onClick={() => onDaySelect(day.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-slate-200" />

          {/* Categories */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2"
              onClick={() => toggleSection('categories')}
            >
              Categories
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expandedSections.categories ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
            <AnimatePresence>
              {expandedSections.categories && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <CategoryFilter categories={categories} onToggle={onCategoryToggle} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Collapsed state icons */}
      {collapsed && (
        <nav className="p-2 space-y-2">
          <button
            className={`w-full p-2 rounded-lg ${activeSection === 'locations' ? 'bg-sunset-500/20 text-sunset-400' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => onSectionChange('locations')}
          >
            <MapPin className="w-5 h-5 mx-auto" />
          </button>
          <button
            className={`w-full p-2 rounded-lg ${activeSection === 'itinerary' ? 'bg-sunset-500/20 text-sunset-400' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => onSectionChange('itinerary')}
          >
            <Calendar className="w-5 h-5 mx-auto" />
          </button>
          <button
            className={`w-full p-2 rounded-lg ${activeSection === 'checklists' ? 'bg-sunset-500/20 text-sunset-400' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => onSectionChange('checklists')}
          >
            <CheckSquare className="w-5 h-5 mx-auto" />
          </button>
        </nav>
      )}
    </aside>
  );
}
