import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, BookOpen, Lock, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { signInWithGoogle, loading, error, clearError } = useAuth();

  return (
    <div id="landing-page-container" className="min-h-screen bg-stone-50 text-stone-800 flex flex-col justify-between">
      {/* Top Header */}
      <header id="landing-header" className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-serif text-lg font-semibold shadow-xs">
              R
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-stone-900 tracking-tight">Gemini Reflection Journal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-signin-nav-btn"
              onClick={signInWithGoogle}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-sm font-medium transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In with Google'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main id="landing-main-content" className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col justify-center">
        {error && (
          <div
            id="landing-error-banner"
            className="mb-8 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start justify-between"
          >
            <div>
              <p className="font-medium">Authentication Notice</p>
              <p className="text-rose-700 mt-0.5">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-rose-500 hover:text-rose-700 text-xs uppercase tracking-wider font-semibold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-200/70 border border-stone-300/60 text-stone-700 text-xs font-medium tracking-wide">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted & User-Isolated Cloud Firestore</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-stone-900 font-bold tracking-tight leading-tight max-w-3xl mx-auto">
            A quiet space to write, reflect, and converse with intelligence.
          </h1>

          <p className="text-stone-600 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto font-normal">
            Express your unfiltered thoughts, explore personal challenges, and collaborate with Gemini 3.6 Flash for cognitive summaries, brainstorming, and deep reflections.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="landing-signin-primary-btn"
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium text-base transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>{loading ? 'Preparing your session...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> No passwords to remember
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> Strict user isolation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> Instant sync
            </span>
          </div>
        </div>

        {/* Feature Grid with mathematical spacing */}
        <div id="landing-features" className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900">Private Reflections</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Write stream-of-consciousness entries, organize thoughts by category, and keep an immutable personal record.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900">Multi-Turn Dialogue</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Converse with Gemini 3.6 Flash to challenge cognitive biases, explore fresh angles, and clarify dilemmas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900">Cognitive Summaries</h3>
            <p className="text-stone-600 text-sm leading-relaxed">
              Generate structured executive summaries, extract recurring themes, and convert reflections into concrete action steps.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="landing-footer" className="border-t border-stone-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>Secured via Firebase Authentication & Cloud Firestore Rules (ABAC)</span>
          </div>
          <div>
            <span>Powered by Gemini 3.6 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
