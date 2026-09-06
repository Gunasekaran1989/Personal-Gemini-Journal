import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, ShieldCheck, Shield, Sparkles, Menu, BookOpen } from 'lucide-react';

interface NavbarProps {
  onNewEntry: () => void;
  onToggleSidebar?: () => void;
  isAdmin?: boolean;
  currentView?: 'journal' | 'admin';
  onToggleView?: (view: 'journal' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewEntry,
  onToggleSidebar,
  isAdmin = false,
  currentView = 'journal',
  onToggleView,
}) => {
  const { user, logout } = useAuth();

  return (
    <header id="app-navbar" className="h-16 bg-white border-b border-stone-200 sticky top-0 z-20 px-4 sm:px-6">
      <div className="h-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Section: Logo & Toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && currentView === 'journal' && (
            <button
              id="sidebar-mobile-toggle-btn"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer"
              aria-label="Toggle reflection history"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onToggleView && onToggleView('journal')}
          >
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-serif text-sm font-semibold shadow-xs">
              R
            </div>
            <div>
              <span className="font-serif font-bold text-base text-stone-900 tracking-tight hidden sm:inline">
                Gemini Reflection Journal
              </span>
              <span className="font-serif font-bold text-base text-stone-900 tracking-tight sm:hidden">
                Reflect
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium ml-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Isolated Firestore Storage</span>
          </div>
        </div>

        {/* Right Section: View Switcher, New Entry, User Info, Sign Out */}
        <div className="flex items-center gap-3">
          {/* Admin Navigation Switcher - Only visible if verified as ADMIN */}
          {isAdmin && onToggleView && (
            <div className="flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200">
              <button
                id="nav-view-journal-btn"
                onClick={() => onToggleView('journal')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  currentView === 'journal'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Journal</span>
              </button>

              <button
                id="nav-view-admin-btn"
                onClick={() => onToggleView('admin')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-stone-900 text-stone-50 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin</span>
              </button>
            </div>
          )}

          {currentView === 'journal' && (
            <button
              id="nav-new-entry-btn"
              onClick={onNewEntry}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Reflection</span>
              <span className="sm:hidden">New</span>
            </button>
          )}

          {user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-stone-200">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User profile'}
                    className="w-8 h-8 rounded-full border border-stone-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 font-semibold text-xs flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block text-left text-xs leading-tight">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-stone-900 truncate max-w-[140px]">
                      {user.displayName || 'Authenticated User'}
                    </p>
                    {isAdmin && (
                      <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-purple-100 text-purple-800 tracking-wider">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-stone-500 truncate max-w-[140px]">{user.email}</p>
                </div>
              </div>

              <button
                id="nav-logout-btn"
                onClick={logout}
                title="Sign out of journal"
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
