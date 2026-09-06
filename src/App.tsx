import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { HistorySidebar } from './components/HistorySidebar';
import { ReflectionEditor } from './components/ReflectionEditor';
import { AdminDashboard } from './components/AdminDashboard';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import type { JournalInteraction, ChatMessage, ReflectionCategory } from './types';
import {
  db,
  handleFirestoreError,
  sanitizePayload,
  OperationType,
} from './lib/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

function createNewEntry(userId: string): JournalInteraction {
  const now = new Date().toISOString();
  return {
    id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    title: '',
    content: '',
    category: 'General Reflection',
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

function MainDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<JournalInteraction[]>([]);
  const [entriesLoading, setEntriesLoading] = useState<boolean>(true);
  const [currentEntry, setCurrentEntry] = useState<JournalInteraction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // RBAC in-memory state: Never stored in localStorage or sessionStorage
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'journal' | 'admin'>('journal');

  // Operation state indicators
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isDraftRecovered, setIsDraftRecovered] = useState<boolean>(false);

  // Delete confirmation modal state
  const [entryToDelete, setEntryToDelete] = useState<JournalInteraction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Server-Authoritative Admin Verification (Zero-Trust)
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setCurrentView('journal');
      return;
    }

    let isSubscribed = true;
    const verifyRole = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed) {
            setIsAdmin(Boolean(data.isAdmin));
          }
        }
      } catch (err) {
        console.warn('Role verification request failed:', err);
      }
    };

    verifyRole();
    return () => {
      isSubscribed = false;
    };
  }, [user]);

  // User-scoped draft storage key
  const draftStorageKey = user ? `journal_unsaved_draft_${user.uid}` : null;

  // Restore unsaved draft on initial load or user change
  useEffect(() => {
    if (!draftStorageKey) {
      setIsDraftRecovered(false);
      return;
    }

    try {
      const rawDraft = localStorage.getItem(draftStorageKey);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        // Validate draft schema and ownership
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.userId === user?.uid &&
          (parsed.title || parsed.content)
        ) {
          setCurrentEntry((prev) => {
            // Only restore if current entry is empty or new
            if (!prev || (!prev.title && !prev.content && prev.messages.length === 0)) {
              setIsDraftRecovered(true);
              setIsDirty(true);
              return {
                ...createNewEntry(user!.uid),
                id: parsed.id || `entry_${Date.now()}`,
                title: typeof parsed.title === 'string' ? parsed.title.slice(0, 200) : '',
                content: typeof parsed.content === 'string' ? parsed.content.slice(0, 50000) : '',
                category: parsed.category || 'General Reflection',
                messages: Array.isArray(parsed.messages) ? parsed.messages : [],
                createdAt: parsed.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            }
            return prev;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved draft:', e);
      try {
        localStorage.removeItem(draftStorageKey);
      } catch {}
    }
  }, [draftStorageKey, user]);

  // Firestore Real-Time Listener strictly isolated to current user UID
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setCurrentEntry(null);
      setEntriesLoading(false);
      setIsDirty(false);
      setIsDraftRecovered(false);
      return;
    }

    setEntriesLoading(true);
    const interactionsPath = `users/${user.uid}/interactions`;
    const interactionsRef = collection(db, 'users', user.uid, 'interactions');
    const q = query(interactionsRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedEntries: JournalInteraction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as JournalInteraction;
          loadedEntries.push({
            ...data,
            id: docSnap.id,
          });
        });

        setEntries(loadedEntries);
        setEntriesLoading(false);

        // If no active current entry selected, initialize or pick the first
        setCurrentEntry((prev) => {
          if (!prev) {
            return loadedEntries.length > 0 ? loadedEntries[0] : createNewEntry(user.uid);
          }
          // If the active entry exists in latest snapshot, update it seamlessly
          const matching = loadedEntries.find((e) => e.id === prev.id);
          if (matching) {
            // Keep local unsaved edits if user is actively writing
            return {
              ...matching,
              title: isDirty ? prev.title : matching.title,
              content: isDirty ? prev.content : matching.content,
              category: isDirty ? prev.category : matching.category,
            };
          }
          return prev;
        });
      },
      (error) => {
        setEntriesLoading(false);
        handleFirestoreError(error, OperationType.LIST, interactionsPath);
      }
    );

    return () => unsubscribe();
  }, [user, isDirty]);

  // Persist current entry to Firestore
  const persistEntry = useCallback(
    async (entryToSave: JournalInteraction) => {
      if (!user) return;
      setIsSaving(true);
      setSaveStatus('saving');
      setSaveError(null);

      // Validate required and bounded fields
      const trimmedTitle = (entryToSave.title || '').trim().slice(0, 200);
      const trimmedContent = (entryToSave.content || '').slice(0, 50000);

      const path = `users/${user.uid}/interactions/${entryToSave.id}`;
      try {
        const docRef = doc(db, 'users', user.uid, 'interactions', entryToSave.id);
        const payload = sanitizePayload({
          ...entryToSave,
          title: trimmedTitle,
          content: trimmedContent,
          userId: user.uid, // Always bound to authenticated user UID
          updatedAt: new Date().toISOString(),
        });

        await setDoc(docRef, payload, { merge: true });
        setSaveStatus('saved');
        setIsDirty(false);
        setIsDraftRecovered(false);

        // Clear user's local draft after successful Firestore persistence
        if (draftStorageKey) {
          try {
            localStorage.removeItem(draftStorageKey);
          } catch {}
        }

        setTimeout(() => {
          setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev));
        }, 2500);
      } catch (err: any) {
        console.error('Firestore save failed:', err);
        setSaveStatus('error');
        setSaveError(err?.message || 'Database write error occurred.');
        // User input is preserved in currentEntry state and in-memory
      } finally {
        setIsSaving(false);
      }
    },
    [user, draftStorageKey]
  );

  const handleEntryChange = (updates: Partial<JournalInteraction>) => {
    if (!currentEntry || !user) return;
    
    // Ignore attempts to mutate ownership or unauthorized fields
    const safeUpdates: Partial<JournalInteraction> = { ...updates };
    delete (safeUpdates as any).userId;
    delete (safeUpdates as any).role;
    delete (safeUpdates as any).isAdmin;

    const updated = {
      ...currentEntry,
      ...safeUpdates,
    };

    setCurrentEntry(updated);
    setIsDirty(true);
    setSaveStatus('idle');

    // Auto-backup unsaved draft to local storage scoped strictly to user.uid
    if (draftStorageKey) {
      try {
        localStorage.setItem(
          draftStorageKey,
          JSON.stringify({
            id: updated.id,
            userId: user.uid,
            title: updated.title,
            content: updated.content,
            category: updated.category,
            messages: updated.messages,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  };

  const handleSaveExplicit = async () => {
    if (!currentEntry) return;
    await persistEntry(currentEntry);
  };

  const handleNewEntry = () => {
    if (!user) return;
    const newEntry = createNewEntry(user.uid);
    setCurrentEntry(newEntry);
    setIsSidebarOpen(false);
    setIsDirty(false);
    setIsDraftRecovered(false);
    setSaveStatus('idle');
    setSaveError(null);
  };

  const handleSelectEntry = (entry: JournalInteraction) => {
    setCurrentEntry(entry);
    setIsSidebarOpen(false);
    setIsDirty(false);
    setIsDraftRecovered(false);
    setSaveStatus('idle');
    setSaveError(null);
  };

  // Trigger modal confirmation dialog
  const handleRequestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = entries.find((item) => item.id === id) || (currentEntry?.id === id ? currentEntry : null);
    if (target) {
      setEntryToDelete(target);
    }
  };

  // Perform permanent deletion after user confirms in modal
  const handleConfirmDelete = async () => {
    if (!user || !entryToDelete) return;
    setIsDeleting(true);

    const id = entryToDelete.id;
    const path = `users/${user.uid}/interactions/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'interactions', id));
      
      // If current entry was deleted, switch to next or new
      if (currentEntry?.id === id) {
        const remaining = entries.filter((item) => item.id !== id);
        if (remaining.length > 0) {
          setCurrentEntry(remaining[0]);
        } else {
          setCurrentEntry(createNewEntry(user.uid));
        }
        setIsDirty(false);
        setIsDraftRecovered(false);
        if (draftStorageKey) {
          try {
            localStorage.removeItem(draftStorageKey);
          } catch {}
        }
      }

      setEntryToDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    } finally {
      setIsDeleting(false);
    }
  };

  // Multi-turn Gemini Dialogue Conversation handler
  const handleSendMessage = async (userText: string) => {
    if (!currentEntry || !userText.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      text: userText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...currentEntry.messages, userMessage];

    // Optimistically update conversation state in UI
    const updatedEntryWithUserMsg: JournalInteraction = {
      ...currentEntry,
      title: currentEntry.title.trim() || userText.trim().substring(0, 45),
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    setCurrentEntry(updatedEntryWithUserMsg);
    setIsGeneratingAI(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/gemini/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedEntryWithUserMsg.title,
          content: updatedEntryWithUserMsg.content,
          category: updatedEntryWithUserMsg.category,
          messages: updatedMessages,
          userPrompt: userText.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error ${response.status}`);
      }

      const data = await response.json();
      const modelMessage: ChatMessage = {
        id: `msg_${Date.now()}_m`,
        role: 'model',
        text: data.reply,
        timestamp: data.timestamp || new Date().toISOString(),
        modelUsed: data.modelUsed,
      };

      const finalEntry: JournalInteraction = {
        ...updatedEntryWithUserMsg,
        messages: [...updatedMessages, modelMessage],
        updatedAt: new Date().toISOString(),
      };

      setCurrentEntry(finalEntry);

      // Guaranteed Transaction Verification: persist both input and output to Firestore
      await persistEntry(finalEntry);
    } catch (error: any) {
      console.error('Gemini conversation error:', error);
      setSaveError(error?.message || 'Failed to receive response from Gemini.');
      setSaveStatus('error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Executive Summary & Structured Insights Generation handler
  const handleGenerateSummary = async () => {
    if (!currentEntry) return;
    if (!currentEntry.content.trim() && currentEntry.messages.length === 0) {
      alert('Please write some reflection content or converse with Gemini before synthesizing.');
      return;
    }

    setIsSummarizing(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentEntry.title,
          content: currentEntry.content,
          messages: currentEntry.messages,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error ${response.status}`);
      }

      const data = await response.json();

      const updatedWithSummary: JournalInteraction = {
        ...currentEntry,
        summary: data.summary,
        keyThemes: data.keyThemes || [],
        insights: data.insights || [],
        actionItems: data.actionItems || [],
        updatedAt: new Date().toISOString(),
      };

      setCurrentEntry(updatedWithSummary);

      // Guaranteed Transaction Verification: Save synthesized summary immediately to Firestore
      await persistEntry(updatedWithSummary);
    } catch (error: any) {
      console.error('Summary synthesis error:', error);
      setSaveError(error?.message || 'Failed to synthesize summary.');
      setSaveStatus('error');
    } finally {
      setIsSummarizing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-600">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-800 rounded-full animate-spin mx-auto" />
          <p className="font-serif text-sm font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div id="app-root-layout" className="min-h-screen bg-stone-100 flex flex-col">
      <Navbar
        onNewEntry={handleNewEntry}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isAdmin={isAdmin}
        currentView={currentView}
        onToggleView={setCurrentView}
      />

      {/* Conditional Rendering: Admin Dashboard vs Journal Workspace */}
      {currentView === 'admin' && isAdmin ? (
        <AdminDashboard onBackToJournal={() => setCurrentView('journal')} />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-80 shrink-0 h-[calc(100vh-4rem)]">
            <HistorySidebar
              entries={entries}
              selectedEntryId={currentEntry?.id || null}
              onSelectEntry={handleSelectEntry}
              onDeleteEntry={handleRequestDelete}
              onNewEntry={handleNewEntry}
              loading={entriesLoading}
            />
          </div>

          {/* Mobile Drawer Overlay */}
          {isSidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <div
                className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
              />
              <div className="relative w-80 max-w-[85vw] bg-white h-full z-50 shadow-2xl flex flex-col">
                <HistorySidebar
                  entries={entries}
                  selectedEntryId={currentEntry?.id || null}
                  onSelectEntry={handleSelectEntry}
                  onDeleteEntry={handleRequestDelete}
                  onNewEntry={handleNewEntry}
                  loading={entriesLoading}
                />
              </div>
            </div>
          )}

          {/* Editor & Content Area */}
          <main className="flex-1 h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
            {currentEntry ? (
              <ReflectionEditor
                currentEntry={currentEntry}
                onChange={handleEntryChange}
                onSave={handleSaveExplicit}
                onSendMessage={handleSendMessage}
                onGenerateSummary={handleGenerateSummary}
                isSaving={isSaving}
                isGeneratingAI={isGeneratingAI}
                isSummarizing={isSummarizing}
                saveStatus={saveStatus}
                saveError={saveError}
                onRetrySave={() => persistEntry(currentEntry)}
                isDirty={isDirty}
                isDraftRecovered={isDraftRecovered}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-stone-500 text-sm">
                Select or create a reflection entry to begin.
              </div>
            )}
          </main>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(entryToDelete)}
        entryTitle={entryToDelete?.title || ''}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}
