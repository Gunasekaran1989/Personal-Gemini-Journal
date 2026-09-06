import React, { useState } from 'react';
import type { JournalInteraction, ReflectionCategory } from '../types';
import { CATEGORIES } from '../types';
import { Search, BookOpen, Trash2, Calendar, MessageSquare, Tag, Filter } from 'lucide-react';

interface HistorySidebarProps {
  entries: JournalInteraction[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalInteraction) => void;
  onDeleteEntry: (id: string, e: React.MouseEvent) => void;
  onNewEntry: () => void;
  loading: boolean;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onDeleteEntry,
  onNewEntry,
  loading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredEntries = entries.filter((entry) => {
    const matchesCategory =
      selectedCategory === 'All' || entry.category === selectedCategory;
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return 'Recently';
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }).format(date);
    } catch {
      return 'Recently';
    }
  };

  return (
    <aside
      id="history-sidebar"
      className="w-full h-full flex flex-col bg-stone-50 border-r border-stone-200"
    >
      {/* Header & Search */}
      <div className="p-4 border-b border-stone-200 space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-stone-700" />
            <h2 className="font-serif font-bold text-stone-900 text-sm">Reflection Log</h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="sidebar-search-input"
            type="text"
            placeholder="Search entries & summaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-stone-400 focus:bg-white text-stone-900 placeholder:text-stone-400"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-stone-900 text-stone-50'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-stone-900 text-stone-50'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entry List */}
      <div id="sidebar-entries-list" className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && (
          <div className="py-8 text-center text-xs text-stone-500 space-y-2">
            <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto" />
            <p>Syncing your reflections...</p>
          </div>
        )}

        {!loading && filteredEntries.length === 0 && (
          <div className="py-12 px-4 text-center text-xs text-stone-500 space-y-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto text-stone-400">
              <BookOpen className="w-5 h-5" />
            </div>
            {searchTerm || selectedCategory !== 'All' ? (
              <p>No entries match your search criteria.</p>
            ) : (
              <div className="space-y-2">
                <p className="font-medium text-stone-700">No reflections yet.</p>
                <p>Start your first journal entry to begin conversing with Gemini.</p>
                <button
                  onClick={onNewEntry}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors"
                >
                  Create Entry
                </button>
              </div>
            )}
          </div>
        )}

        {filteredEntries.map((entry) => {
          const isSelected = entry.id === selectedEntryId;
          const msgCount = entry.messages?.length || 0;

          return (
            <div
              key={entry.id}
              id={`entry-item-${entry.id}`}
              onClick={() => onSelectEntry(entry)}
              className={`group relative p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-stone-800/80 shadow-xs'
                  : 'bg-white/60 hover:bg-white border-stone-200/80 hover:border-stone-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif font-semibold text-stone-900 text-sm line-clamp-1">
                  {entry.title || 'Untitled Reflection'}
                </h3>
                <button
                  id={`delete-entry-${entry.id}`}
                  onClick={(e) => onDeleteEntry(entry.id, e)}
                  title="Delete entry"
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded transition-opacity cursor-pointer"
                  aria-label="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-stone-500 line-clamp-2 mt-1 font-normal leading-relaxed">
                {entry.content || (entry.summary ? entry.summary : 'No written content')}
              </p>

              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-100 text-[11px] text-stone-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  {formatDate(entry.updatedAt || entry.createdAt)}
                </span>

                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium text-[10px]">
                    {entry.category}
                  </span>
                  {msgCount > 0 && (
                    <span className="flex items-center gap-0.5 text-stone-500">
                      <MessageSquare className="w-3 h-3 text-stone-400" />
                      {msgCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
