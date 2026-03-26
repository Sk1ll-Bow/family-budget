import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Store as StoreIcon, Plus } from 'lucide-react';
import { cn } from '../../core/cn';
import type { IStore } from '../../core/types';

interface IStoreSelectorProps {
  stores: IStore[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddCustom?: (name: string) => void;
}

export function StoreSelector({ stores, selectedId, onSelect, onAddCustom }: IStoreSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selectedStore = stores.find((s) => s.id === selectedId);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    if (search.trim() && onAddCustom) {
      onAddCustom(search.trim());
      setSearch('');
      setIsOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full glass flex items-center justify-between px-4 py-4 rounded-2xl transition-all focus:ring-1 focus:ring-brand-primary/50 text-left cursor-pointer",
          isOpen ? "ring-1 ring-white/20" : ""
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-surface-800 flex items-center justify-center shrink-0">
            <StoreIcon className="w-4 h-4 text-brand-primary" />
          </div>
          <span className="text-xs font-black truncate text-surface-50 uppercase tracking-widest">
            {selectedStore ? selectedStore.name : 'Select Store'}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-surface-500 transition-transform duration-300",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 glass-card rounded-2xl z-50 overflow-hidden shadow-2xl animate-fade-in origin-top">
          <div className="p-2 border-b border-white/5">
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent text-sm font-black text-surface-50 placeholder:text-surface-600 focus:outline-none px-3 py-2"
              placeholder="Search store..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredStores.map((store) => (
              <button
                key={store.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all outline-none text-left",
                  selectedId === store.id ? "bg-brand-primary/20 text-brand-primary font-black" : "hover:bg-white/5 text-surface-300 font-bold"
                )}
                onClick={() => {
                  onSelect(store.id);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <StoreIcon className={cn("w-4 h-4", selectedId === store.id ? "text-brand-primary" : "text-surface-500")} />
                <span className="text-[11px] uppercase tracking-wider">{store.name}</span>
              </button>
            ))}

            {filteredStores.length === 0 && search.trim() !== '' && onAddCustom && (
              <button
                type="button"
                onClick={handleCreate}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all text-left text-surface-300"
              >
                <Plus className="w-4 h-4 text-brand-primary" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Add "{search}"
                </span>
              </button>
            )}
            
            {filteredStores.length === 0 && search.trim() === '' && (
              <div className="text-center py-4 text-[10px] font-black uppercase tracking-widest text-surface-600">
                No stores found
              </div>
            )}
            
            {/* Optional: Add clear store option if a store is selected */}
            {selectedId && stores.length > 0 && (
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all outline-none text-left text-danger mt-1 border-t border-white/5"
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
              >
                <span className="text-[11px] font-black uppercase tracking-wider pl-7">Clear Store</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
