import React, { useState } from 'react';
import type { JournalInteraction, ReflectionCategory } from '../types';
import { CATEGORIES } from '../types';
import { SummaryCard } from './SummaryCard';
import { ChatDialogue } from './ChatDialogue';
import {
  Save,
  Sparkles,
  MessageSquare,
  FileText,
  AlertCircle,
  Check,
  RefreshCw,
  Clock,
  Send,
} from 'lucide-react';

interface ReflectionEditorProps {
  currentEntry: JournalInteraction;
  onChange: (updated: Partial<JournalInteraction>) => void;
  onSave: () => Promise<void>;
  onSendMessage: (text: string) => Promise<void>;
  onGenerateSummary: () => Promise<void>;
  isSaving: boolean;
  isGeneratingAI: boolean;
  isSummarizing: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveError: string | null;
  onRetrySave: () => void;
  isDirty?: boolean;
  isDraftRecovered?: boolean;
}

export const ReflectionEditor: React.FC<ReflectionEditorProps> = ({
  currentEntry,
  onChange,
  onSave,
  onSendMessage,
  onGenerateSummary,
  isSaving,
  isGeneratingAI,
  isSummarizing,
  saveStatus,
  saveError,
  onRetrySave,
  isDirty = false,
  isDraftRecovered = false,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'dialogue' | 'split'>('split');

  return (
    <div id="reflection-editor-wrapper" className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
      {/* Top Action Bar */}
      <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Title & Category Row */}
        <div className="flex-1 min-w-[260px] flex items-center gap-3">
          <input
            id="reflection-title-input"
            type="text"
            placeholder="Reflection Title (e.g. Navigating Team Feedback...)"
            value={currentEntry.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="w-full text-lg sm:text-xl font-serif font-bold text-stone-900 placeholder:text-stone-300 focus:outline-hidden bg-transparent"
          />

          <select
            id="reflection-category-select"
            value={currentEntry.category}
            onChange={(e) => onChange({ category: e.target.value as ReflectionCategory })}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-100 text-stone-700 border border-stone-200 focus:outline-hidden cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode & Save Actions */}
        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle for Desktop/Tablet */}
          <div className="hidden md:inline-flex p-0.5 rounded-lg bg-stone-100 border border-stone-200 text-xs text-stone-600">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'editor' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Journal Only
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'split' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setActiveTab('dialogue')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'dialogue' ? 'bg-white text-stone-900 shadow-2xs' : 'hover:text-stone-900'
              }`}
            >
              Dialogue & Summary
            </button>
          </div>

          {/* Mobile view toggle */}
          <div className="md:hidden inline-flex p-0.5 rounded-lg bg-stone-100 border border-stone-200 text-xs text-stone-600">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'editor' ? 'bg-white text-stone-900 shadow-2xs' : ''
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('dialogue')}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'dialogue' ? 'bg-white text-stone-900 shadow-2xs' : ''
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status Indicators: Draft Recovered & Unsaved Changes */}
          {isDraftRecovered && (
            <span
              id="draft-recovered-indicator"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium"
              title="Restored unpersisted draft from previous browser session"
            >
              <Clock className="w-3 h-3 text-amber-600" />
              <span className="hidden sm:inline">Draft Restored</span>
            </span>
          )}

          {isDirty && saveStatus !== 'saving' && saveStatus !== 'saved' && (
            <span
              id="unsaved-changes-indicator"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-stone-600 border border-stone-200 text-[11px] font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          )}

          {/* Explicit Save Button */}
          <button
            id="reflection-save-btn"
            onClick={onSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer ${
              saveStatus === 'saved'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : saveStatus === 'error'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : isDirty
                ? 'bg-stone-900 hover:bg-stone-800 text-stone-50 ring-2 ring-stone-900/10'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-50'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Entry</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Save Error Alert Banner with Retry Option */}
      {saveStatus === 'error' && saveError && (
        <div
          id="reflection-save-error-banner"
          className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Failed to persist to Firestore:</strong> {saveError}
            </span>
          </div>
          <button
            id="retry-save-btn"
            onClick={onRetrySave}
            className="px-2.5 py-1 rounded bg-rose-900 text-white font-medium hover:bg-rose-800 transition-colors cursor-pointer shrink-0 ml-3"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Journal Text Editor */}
        <div
          className={`h-full flex flex-col space-y-4 ${
            activeTab === 'editor'
              ? 'md:col-span-12'
              : activeTab === 'split'
              ? 'md:col-span-6'
              : 'hidden md:hidden'
          }`}
        >
          <div className="flex-1 flex flex-col bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-3 border-b border-stone-100 flex items-center justify-between text-xs text-stone-500 bg-stone-50/60">
              <span className="font-serif font-medium text-stone-700">Journal Reflection</span>
              <div className="flex items-center gap-3">
                <span>
                  {currentEntry.content.trim() ? currentEntry.content.trim().split(/\s+/).length : 0} words
                </span>
                <button
                  id="editor-first-gemini-turn-btn"
                  onClick={() =>
                    onSendMessage(
                      'Please read my journal reflection and provide thoughtful perspectives and 2 provocative questions.'
                    )
                  }
                  disabled={!currentEntry.content.trim() || isGeneratingAI}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded cursor-pointer disabled:opacity-40"
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Ask Gemini for Insight</span>
                </button>
              </div>
            </div>

            <textarea
              id="reflection-content-textarea"
              value={currentEntry.content}
              onChange={(e) => onChange({ content: e.target.value })}
              placeholder="What is occupying your mind today? Write freely about challenges, decisions, achievements, or emotions..."
              className="flex-1 p-4 sm:p-6 text-sm text-stone-800 leading-relaxed placeholder:text-stone-300 resize-none focus:outline-hidden font-normal"
            />
          </div>
        </div>

        {/* Right Column: Multi-turn Dialogue & Summary Synthesis */}
        <div
          className={`h-full flex flex-col space-y-6 overflow-y-auto ${
            activeTab === 'dialogue'
              ? 'md:col-span-12'
              : activeTab === 'split'
              ? 'md:col-span-6'
              : 'hidden md:hidden'
          }`}
        >
          {/* Multi-turn Chat Component */}
          <div className="h-[420px] shrink-0">
            <ChatDialogue
              messages={currentEntry.messages}
              onSendMessage={onSendMessage}
              isLoading={isGeneratingAI}
              journalTitle={currentEntry.title}
            />
          </div>

          {/* AI Executive Summary & Structured Insights */}
          <div>
            <SummaryCard
              summary={currentEntry.summary}
              keyThemes={currentEntry.keyThemes}
              insights={currentEntry.insights}
              actionItems={currentEntry.actionItems}
              onGenerateSummary={onGenerateSummary}
              isGenerating={isSummarizing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
