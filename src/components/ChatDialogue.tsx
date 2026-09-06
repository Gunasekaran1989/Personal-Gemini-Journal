import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import type { ChatMessage } from '../types';
import { Send, Bot, User, Sparkles, CornerDownLeft, Loader2 } from 'lucide-react';

interface ChatDialogueProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  journalTitle: string;
}

const PROMPT_SUGGESTIONS = [
  'What underlying assumptions might I be making here?',
  'What is a compassionate, constructive reframe of this?',
  'Help me brainstorm 3 practical paths forward.',
  'What would I advise a close friend facing this same situation?',
];

export const ChatDialogue: React.FC<ChatDialogueProps> = ({
  messages,
  onSendMessage,
  isLoading,
  journalTitle,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText.trim();
    setInputText('');
    await onSendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div id="chat-dialogue-container" className="flex flex-col h-full bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-sm">Dialogue with Gemini</h3>
            <p className="text-[11px] text-stone-500">Multi-turn reflection & cognitive dialogue</p>
          </div>
        </div>

        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
          Gemini 3.6 Flash
        </span>
      </div>

      {/* Message Stream */}
      <div id="dialogue-messages-stream" className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="py-12 px-4 text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 text-stone-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <p className="font-serif font-semibold text-stone-900 text-sm">
                Deepen your reflection with Gemini
              </p>
              <p className="text-xs text-stone-500 leading-relaxed">
                Ask questions, explore underlying motivations, or choose a reflection prompt below to begin converse.
              </p>
            </div>

            {/* Quick Starter Chips */}
            <div className="pt-2 flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSendMessage(suggestion)}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs text-left transition-colors cursor-pointer disabled:opacity-50"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-stone-900 text-white'
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[82%] p-3.5 rounded-2xl ${
                  isUser
                    ? 'bg-stone-900 text-stone-50 rounded-tr-xs'
                    : 'bg-stone-50 border border-stone-200/80 text-stone-800 rounded-tl-xs shadow-2xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                ) : (
                  <div className="prose prose-stone prose-xs max-w-none text-stone-800">
                    <Markdown>{message.text}</Markdown>
                  </div>
                )}

                <div
                  className={`mt-1.5 pt-1 text-[10px] flex items-center gap-2 ${
                    isUser ? 'text-stone-400 justify-end' : 'text-stone-400 border-t border-stone-200/50'
                  }`}
                >
                  <span>
                    {new Intl.DateTimeFormat('en-US', {
                      hour: 'numeric',
                      minute: 'numeric',
                    }).format(new Date(message.timestamp))}
                  </span>
                  {message.modelUsed && <span>• {message.modelUsed}</span>}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 text-xs leading-relaxed">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-stone-500 rounded-tl-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>Gemini is formulating reflection insights...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-stone-200 bg-white">
        <div className="relative flex items-end gap-2 bg-stone-50 border border-stone-200 rounded-xl p-1.5 focus-within:ring-1 focus-within:ring-stone-400 focus-within:bg-white transition-all">
          <textarea
            id="dialogue-prompt-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or reflection inquiry (Press Enter to send, Shift+Enter for newline)..."
            rows={2}
            className="w-full bg-transparent resize-none px-2.5 py-1 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          />

          <button
            id="dialogue-send-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 disabled:opacity-30 transition-all cursor-pointer shrink-0"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
