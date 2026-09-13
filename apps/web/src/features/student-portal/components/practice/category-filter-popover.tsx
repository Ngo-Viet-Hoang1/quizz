'use client';

import { Input } from '@/shared/ui/input';
import { Check, ChevronDown, Tag, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CategoryFilterPopoverProps {
  category: string;
  allCategories: string[];
  onSelectCategory: (cat: string) => void;
}

export function CategoryFilterPopover({
  category,
  allCategories,
  onSelectCategory,
}: CategoryFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = category.trim()
    ? allCategories.filter((cat) => cat.toLowerCase().includes(category.trim().toLowerCase()))
    : allCategories;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative sm:w-72" ref={dropdownRef}>
      <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
      <Input
        type="text"
        placeholder="Filter by category..."
        value={category}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          onSelectCategory(e.target.value);
          setIsOpen(true);
        }}
        className="h-10 pl-10 pr-8 rounded-xl bg-background border text-xs sm:text-sm font-medium placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500"
      />
      {category ? (
        <button
          type="button"
          onClick={() => {
            onSelectCategory('');
            setIsOpen(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer z-10 p-0.5"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground transition-transform pointer-events-none ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      )}

      {/* Suggestion Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border shadow-xl rounded-2xl p-1.5 z-50 max-h-60 overflow-y-auto space-y-1 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between border-b border-border/50 pb-1 mb-1">
            <span>Suggested Categories</span>
            <span className="text-[10px] text-sky-600 font-bold">
              {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {/* Option to clear / all categories */}
          {category && (
            <button
              type="button"
              onClick={() => {
                onSelectCategory('');
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-left transition-colors cursor-pointer"
            >
              <span>✦ All Categories</span>
            </button>
          )}

          {filteredSuggestions.length === 0 ? (
            <div className="px-3 py-3 text-xs text-muted-foreground text-center">
              No matching categories found.
            </div>
          ) : (
            filteredSuggestions.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onSelectCategory(cat);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                  category.toLowerCase() === cat.toLowerCase()
                    ? 'bg-sky-600 text-white font-bold'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Tag className="size-3.5 opacity-70" />
                  {cat}
                </span>
                {category.toLowerCase() === cat.toLowerCase() && (
                  <Check className="size-3.5 stroke-[2.5]" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
