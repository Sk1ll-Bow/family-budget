import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { LucideIcon } from '../../components/LucideIcon';
import { cn } from '../../core/cn';

/** Curated list of icon names from lucide-react, grouped by theme. */
export const ICON_LIST: { group: string; icons: string[] }[] = [
  {
    group: 'Finance',
    icons: [
      'Wallet', 'CreditCard', 'Banknote', 'PiggyBank', 'Coins',
      'DollarSign', 'Euro', 'Receipt', 'TrendingUp', 'TrendingDown',
      'BarChart2', 'PieChart', 'LineChart', 'ArrowUpCircle', 'ArrowDownCircle',
    ],
  },
  {
    group: 'Shopping',
    icons: [
      'ShoppingCart', 'ShoppingBag', 'Package', 'Gift', 'Tag',
      'Store', 'Building2', 'Percent', 'Ticket', 'QrCode',
    ],
  },
  {
    group: 'Food & Drink',
    icons: [
      'UtensilsCrossed', 'Coffee', 'Pizza', 'Apple', 'Beef',
      'Beer', 'Wine', 'Salad', 'Sandwich', 'IceCream',
      'Milk', 'Candy', 'Cookie', 'Soup', 'Flame',
    ],
  },
  {
    group: 'Transport',
    icons: [
      'Car', 'Plane', 'Train', 'Bus', 'Bike',
      'Ship', 'Truck', 'Fuel', 'MapPin', 'Navigation',
      'Taxi', 'ParkingCircle', 'Anchor',
    ],
  },
  {
    group: 'Home',
    icons: [
      'Home', 'Sofa', 'Lamp', 'Key', 'Wrench',
      'Hammer', 'Plug', 'Droplets', 'Thermometer', 'Wifi',
      'Tv', 'WashingMachine', 'Refrigerator',
    ],
  },
  {
    group: 'Health',
    icons: [
      'Heart', 'Pill', 'Stethoscope', 'Activity', 'HeartPulse',
      'Syringe', 'Bandage', 'Eye', 'Dumbbell', 'PersonStanding',
    ],
  },
  {
    group: 'Entertainment',
    icons: [
      'Music', 'Film', 'Gamepad2', 'Book', 'Camera',
      'Headphones', 'Radio', 'Mic', 'Clapperboard', 'Theater',
      'Trophy', 'Dices', 'Joystick',
    ],
  },
  {
    group: 'Work & Education',
    icons: [
      'Briefcase', 'Building', 'Monitor', 'Laptop', 'Printer',
      'GraduationCap', 'BookOpen', 'PenLine', 'FileText', 'Calculator',
      'Microscope', 'TestTube',
    ],
  },
  {
    group: 'Travel & Lifestyle',
    icons: [
      'Globe', 'Sun', 'Moon', 'Star', 'Umbrella',
      'Backpack', 'Tent', 'Mountain', 'Trees', 'Flower2',
      'Leaf', 'Palmtree',
    ],
  },
  {
    group: 'Tech',
    icons: [
      'Smartphone', 'Tablet', 'Mouse', 'Keyboard', 'Cpu',
      'HardDrive', 'Cloud', 'Bluetooth', 'Zap', 'Battery',
    ],
  },
  {
    group: 'Other',
    icons: [
      'Sparkles', 'Wand2', 'Rocket', 'Shield', 'Lock',
      'Bell', 'CircleUser', 'Users', 'Baby', 'Dog',
      'Cat', 'Bird', 'Fish',
    ],
  },
];

/** Flat list of all icon names for search. */
const ALL_ICONS = ICON_LIST.flatMap((g) => g.icons);

interface IIconPickerProps {
  /** Currently selected icon name */
  value: string;
  /** Called when user selects an icon */
  onChange: (name: string) => void;
  /** Accent color for selected highlight */
  accentColor?: string;
}

/**
 * Icon picker panel with search and grouped grid.
 * Must be defined outside parent components to avoid re-mount on state changes.
 */
export function IconPicker({ value, onChange, accentColor = '#6366f1' }: IIconPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null; // null = show groups
    return ALL_ICONS.filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="bg-surface-900/60 rounded-[24px] border border-white/8 overflow-hidden">
      {/* Search bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <Search className="w-4 h-4 text-surface-600 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons..."
          className="flex-1 bg-transparent text-xs font-black uppercase tracking-widest text-surface-50 placeholder:text-surface-700 outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')}
            className="w-5 h-5 flex items-center justify-center text-surface-600 hover:text-surface-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Icon grid */}
      <div className="max-h-64 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {filtered ? (
          /* Search results — flat grid */
          <div className="grid grid-cols-8 gap-1.5">
            {filtered.length === 0 ? (
              <p className="col-span-8 text-center text-[10px] font-black text-surface-600 uppercase tracking-widest py-6">
                No icons found
              </p>
            ) : filtered.map((name) => (
              <IconBtn key={name} name={name} selected={value === name}
                accentColor={accentColor} onSelect={onChange} />
            ))}
          </div>
        ) : (
          /* Grouped view */
          ICON_LIST.map((group) => (
            <div key={group.group}>
              <p className="text-[9px] font-black text-surface-600 uppercase tracking-[0.25em] mb-2 px-1">
                {group.group}
              </p>
              <div className="grid grid-cols-8 gap-1.5">
                {group.icons.map((name) => (
                  <IconBtn key={name} name={name} selected={value === name}
                    accentColor={accentColor} onSelect={onChange} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/** Single icon button cell inside the picker grid. */
function IconBtn({ name, selected, accentColor, onSelect }: {
  name: string;
  selected: boolean;
  accentColor: string;
  onSelect: (name: string) => void;
}) {
  return (
    <button
      type="button"
      title={name}
      onClick={() => onSelect(name)}
      className={cn(
        'w-full aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90',
        selected
          ? 'scale-105 shadow-lg border-2'
          : 'hover:bg-white/10 border-2 border-transparent text-surface-500 hover:text-surface-200'
      )}
      style={selected ? {
        backgroundColor: `${accentColor}20`,
        borderColor: accentColor,
        color: accentColor,
      } : undefined}
    >
      <LucideIcon name={name} className="w-4 h-4" />
    </button>
  );
}
