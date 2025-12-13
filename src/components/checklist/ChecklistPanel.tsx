import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Square,
  ChevronDown,
  Plus,
  FileText,
  Heart,
  Briefcase,
  Package,
} from 'lucide-react';
import { GlassPanel, GlassCard, GlassInput, GlassButton, GlassBadge } from '../ui/GlassPanel';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistCategory {
  id: 'visa' | 'health' | 'documents' | 'packing';
  name: string;
  icon: React.ElementType;
  color: string;
  items: ChecklistItem[];
}

interface ChecklistPanelProps {
  checklists: ChecklistCategory[];
  onToggleItem: (categoryId: string, itemId: string) => void;
  onAddItem: (categoryId: string, text: string) => void;
}

function ChecklistProgress({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-slate-400">Progress</span>
        <span className="text-white font-medium">
          {completed}/{total} completed
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

function ChecklistSection({
  category,
  onToggleItem,
  onAddItem,
}: {
  category: ChecklistCategory;
  onToggleItem: (itemId: string) => void;
  onAddItem: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const Icon = category.icon;
  const completedCount = category.items.filter((item) => item.checked).length;

  const handleAddItem = () => {
    if (newItemText.trim()) {
      onAddItem(newItemText.trim());
      setNewItemText('');
      setShowAddInput(false);
    }
  };

  return (
    <div className="border-b border-slate-700/50 last:border-b-0">
      <button
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/40 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color: category.color }} />
          </div>
          <span className="font-medium text-white">{category.name}</span>
          <GlassBadge color={completedCount === category.items.length ? 'green' : 'slate'}>
            {completedCount}/{category.items.length}
          </GlassBadge>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3 space-y-2"
          >
            {category.items.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/40 transition-colors text-left"
                onClick={() => onToggleItem(item.id)}
              >
                {item.checked ? (
                  <CheckSquare className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${item.checked ? 'text-slate-500 line-through' : 'text-slate-300'}`}
                >
                  {item.text}
                </span>
              </button>
            ))}

            {showAddInput ? (
              <div className="flex items-center gap-2 pt-2">
                <GlassInput
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Add new item..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem();
                    if (e.key === 'Escape') setShowAddInput(false);
                  }}
                  autoFocus
                />
                <GlassButton size="sm" onClick={handleAddItem}>
                  Add
                </GlassButton>
              </div>
            ) : (
              <button
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white p-2"
                onClick={() => setShowAddInput(true)}
              >
                <Plus className="w-4 h-4" />
                Add item
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const DEFAULT_CHECKLISTS: ChecklistCategory[] = [
  {
    id: 'visa',
    name: 'Visa & Entry',
    icon: FileText,
    color: '#8B5CF6',
    items: [
      { id: 'v1', text: 'Valid passport (6+ months validity)', checked: false },
      { id: 'v2', text: 'Malaysia visa requirements checked', checked: false },
      { id: 'v3', text: 'Return flight tickets booked', checked: false },
      { id: 'v4', text: 'Hotel booking confirmations saved', checked: false },
    ],
  },
  {
    id: 'health',
    name: 'Health & Vaccinations',
    icon: Heart,
    color: '#EF4444',
    items: [
      { id: 'h1', text: 'Travel insurance purchased', checked: false },
      { id: 'h2', text: 'Toddler medications packed', checked: false },
      { id: 'h3', text: 'Mosquito repellent (20%+ DEET)', checked: false },
      { id: 'h4', text: 'Sunscreen SPF 50+', checked: false },
      { id: 'h5', text: 'First aid kit prepared', checked: false },
    ],
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: Briefcase,
    color: '#3B82F6',
    items: [
      { id: 'd1', text: 'Passport copies (physical + digital)', checked: false },
      { id: 'd2', text: 'Emergency contact numbers saved', checked: false },
      { id: 'd3', text: 'Hotel addresses in local language', checked: false },
      { id: 'd4', text: 'Credit cards ready + bank notified', checked: false },
    ],
  },
  {
    id: 'packing',
    name: 'Packing',
    icon: Package,
    color: '#10B981',
    items: [
      { id: 'p1', text: 'Baby carrier (for Batu Caves)', checked: false },
      { id: 'p2', text: 'Stroller for malls', checked: false },
      { id: 'p3', text: 'Warm clothes for Cameron Highlands', checked: false },
      { id: 'p4', text: 'Modest clothing for temples', checked: false },
      { id: 'p5', text: 'Swim gear for KLCC wading pool', checked: false },
    ],
  },
];

export function ChecklistPanel({
  checklists = DEFAULT_CHECKLISTS,
  onToggleItem,
  onAddItem,
}: ChecklistPanelProps) {
  const totalItems = checklists.reduce((sum, cat) => sum + cat.items.length, 0);
  const completedItems = checklists.reduce(
    (sum, cat) => sum + cat.items.filter((item) => item.checked).length,
    0
  );

  return (
    <GlassPanel className="w-full max-w-md">
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-1">Travel Checklist</h2>
        <p className="text-sm text-slate-400">Track your pre-trip preparations</p>
      </div>

      <div className="p-4">
        <ChecklistProgress completed={completedItems} total={totalItems} />
      </div>

      <div>
        {checklists.map((category) => (
          <ChecklistSection
            key={category.id}
            category={category}
            onToggleItem={(itemId) => onToggleItem(category.id, itemId)}
            onAddItem={(text) => onAddItem(category.id, text)}
          />
        ))}
      </div>
    </GlassPanel>
  );
}
