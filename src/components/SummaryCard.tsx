import React, { useState } from 'react';
import { Sparkles, CheckSquare, Square, Lightbulb, Compass, RefreshCw, Layers } from 'lucide-react';

interface SummaryCardProps {
  summary?: string;
  keyThemes?: string[];
  insights?: string[];
  actionItems?: string[];
  onGenerateSummary: () => void;
  isGenerating: boolean;
  modelUsed?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  keyThemes = [],
  insights = [],
  actionItems = [],
  onGenerateSummary,
  isGenerating,
  modelUsed,
}) => {
  const [completedItems, setCompletedItems] = useState<Record<number, boolean>>({});

  const toggleItem = (index: number) => {
    setCompletedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const hasAnyData = Boolean(summary || keyThemes.length > 0 || insights.length > 0 || actionItems.length > 0);

  return (
    <div id="summary-card-container" className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-base">Cognitive Synthesis</h3>
            <p className="text-xs text-stone-500">Executive summary & structured takeaways</p>
          </div>
        </div>

        <button
          id="generate-summary-action-btn"
          onClick={onGenerateSummary}
          disabled={isGenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-stone-900' : ''}`} />
          <span>{isGenerating ? 'Synthesizing...' : hasAnyData ? 'Re-Synthesize' : 'Generate Summary'}</span>
        </button>
      </div>

      {!hasAnyData && !isGenerating && (
        <div className="py-8 text-center space-y-2 text-stone-500">
          <Compass className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="text-sm font-medium text-stone-700">No synthesis generated yet</p>
          <p className="text-xs max-w-sm mx-auto text-stone-500 leading-relaxed">
            Click "Generate Summary" to have Gemini 3.6 Flash extract key themes, psychological reflections, and actionable next steps from your writing.
          </p>
        </div>
      )}

      {isGenerating && (
        <div className="py-8 text-center space-y-3 text-stone-500">
          <div className="w-6 h-6 border-2 border-amber-300 border-t-stone-800 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-stone-700">Synthesizing insights and key themes...</p>
          <p className="text-[11px] text-stone-400">Consulting Gemini 3.6 Flash</p>
        </div>
      )}

      {hasAnyData && !isGenerating && (
        <div className="space-y-5 text-stone-800">
          {/* Executive Summary */}
          {summary && (
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                Core Summary
              </span>
              <p className="text-sm text-stone-700 leading-relaxed font-serif italic bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                "{summary}"
              </p>
            </div>
          )}

          {/* Key Themes Chips */}
          {keyThemes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                <Layers className="w-3.5 h-3.5" />
                <span>Extracted Themes</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keyThemes.map((theme, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200"
                  >
                    #{theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Psychological / Brainstorming Insights */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Reflective Insights</span>
              </div>
              <ul className="space-y-2">
                {insights.map((insight, i) => (
                  <li
                    key={i}
                    className="text-xs text-stone-700 leading-relaxed flex items-start gap-2 bg-stone-50/70 p-2.5 rounded-lg border border-stone-100"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items / Next Steps */}
          {actionItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-stone-400">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Actionable Steps & Brainstorms</span>
              </div>
              <div className="space-y-1.5">
                {actionItems.map((item, i) => {
                  const isDone = Boolean(completedItems[i]);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleItem(i)}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left text-xs hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      {isDone ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" />
                      )}
                      <span className={`leading-relaxed ${isDone ? 'line-through text-stone-400' : 'text-stone-700'}`}>
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {modelUsed && (
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
              <span>Synthesized with {modelUsed}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
