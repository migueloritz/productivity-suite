import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Email, 
  EmailFolder, 
  EmailThread, 
  SearchQuery, 
  SearchResult, 
  ComposeEmail,
  SyncStatus,
  EmailStats
} from '../types';
import { EmailService } from '../services/email';
import { useAuth } from './useAuth';

interface EmailState {
  emails: Email[];
  threads: EmailThread[];
  folders: EmailFolder[];
  currentFolder: EmailFolder | null;
  selectedEmails: string[];
  searchQuery: SearchQuery | null;
  searchResults: SearchResult | null;
  syncStatus: Record<string, SyncStatus>;
  isLoading: boolean;
  isSearching: boolean;
  isSyncing: boolean;
  error: string | null;
}

interface EmailOperations {
  // Folder operations
  selectFolder: (folderId: string) => void;
  refreshFolder: (folderId: string) => Promise<void>;
  syncAllFolders: () => Promise<void>;
  
  // Email operations
  fetchEmails: (folderId: string, limit?: number, offset?: number) => Promise<void>;
  refreshEmails: () => Promise<void>;
  markAsRead: (emailIds: string[], read: boolean) => Promise<void>;
  markAsFlagged: (emailIds: string[], flagged: boolean) => Promise<void>;
  moveToFolder: (emailIds: string[], targetFolderId: string) => Promise<void>;
  deleteEmails: (emailIds: string[], permanent?: boolean) => Promise<void>;
  
  // Selection
  selectEmail: (emailId: string) => void;
  selectEmails: (emailIds: string[]) => void;
  toggleEmailSelection: (emailId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Search
  searchEmails: (query: SearchQuery) => Promise<void>;
  clearSearch: () => void;
  
  // Threading
  getEmailThread: (threadId: string) => Promise<EmailThread | null>;
  groupEmailsByThread: (emails: Email[]) => EmailThread[];
  
  // Stats
  getEmailStats: () => EmailStats;
}

export function useEmail(): EmailState & EmailOperations {
  const { currentAccount } = useAuth();
  const emailService = EmailService.getInstance();

  const [state, setState] = useState<EmailState>({
    emails: [],
    threads: [],
    folders: [],
    currentFolder: null,
    selectedEmails: [],
    searchQuery: null,
    searchResults: null,
    syncStatus: {},
    isLoading: false,
    isSearching: false,
    isSyncing: false,
    error: null,
  });

  // Load folders when account changes
  useEffect(() => {
    if (currentAccount) {
      loadFolders();
    } else {
      setState(prev => ({
        ...prev,
        folders: [],
        currentFolder: null,
        emails: [],
        threads: [],
      }));
    }
  }, [currentAccount]);

  // Load emails when folder changes
  useEffect(() => {
    if (currentAccount && state.currentFolder) {
      fetchEmails(state.currentFolder.id);
    }
  }, [currentAccount, state.currentFolder]);

  const loadFolders = useCallback(async () => {
    if (!currentAccount) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const folders = await emailService.syncFolders(currentAccount.id);
      const inboxFolder = folders.find(f => f.type === 'inbox') || folders[0];

      setState(prev => ({
        ...prev,
        folders,
        currentFolder: inboxFolder || null,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load folders',
      }));
    }
  }, [currentAccount, emailService]);

  const selectFolder = useCallback((folderId: string) => {
    const folder = state.folders.find(f => f.id === folderId);
    if (folder) {
      setState(prev => ({
        ...prev,
        currentFolder: folder,
        selectedEmails: [],
        searchQuery: null,
        searchResults: null,
      }));
    }
  }, [state.folders]);

  const fetchEmails = useCallback(async (
    folderId: string, 
    limit: number = 50, 
    offset: number = 0
  ) => {
    if (!currentAccount) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const emails = await emailService.fetchEmails(currentAccount.id, folderId, limit, offset);
      const threads = groupEmailsByThread(emails);

      setState(prev => ({
        ...prev,
        emails,
        threads,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch emails',
      }));
    }
  }, [currentAccount, emailService]);

  const refreshFolder = useCallback(async (folderId: string) => {
    if (!currentAccount) return;

    try {
      setState(prev => ({ 
        ...prev, 
        isSyncing: true,
        syncStatus: {
          ...prev.syncStatus,
          [folderId]: {
            accountId: currentAccount.id,
            isActive: true,
            lastSync: new Date(),
            progress: 0,
            status: 'syncing',
            newEmails: 0,
            updatedEmails: 0,
          }
        }
      }));

      await fetchEmails(folderId);

      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncStatus: {
          ...prev.syncStatus,
          [folderId]: {
            ...prev.syncStatus[folderId],
            isActive: false,
            progress: 100,
            status: 'idle',
          }
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncStatus: {
          ...prev.syncStatus,
          [folderId]: {
            ...prev.syncStatus[folderId],
            isActive: false,
            status: 'error',
            error: error instanceof Error ? error.message : 'Sync failed',
          }
        }
      }));
    }
  }, [currentAccount, fetchEmails]);

  const refreshEmails = useCallback(async () => {
    if (state.currentFolder) {
      await refreshFolder(state.currentFolder.id);
    }
  }, [state.currentFolder, refreshFolder]);

  const syncAllFolders = useCallback(async () => {
    if (!currentAccount) return;

    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      for (const folder of state.folders) {
        await refreshFolder(folder.id);
      }

      setState(prev => ({ ...prev, isSyncing: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Failed to sync folders',
      }));
    }
  }, [currentAccount, state.folders, refreshFolder]);

  const markAsRead = useCallback(async (emailIds: string[], read: boolean) => {
    if (!currentAccount || !state.currentFolder) return;

    try {
      for (const emailId of emailIds) {
        await emailService.markAsRead(
          currentAccount.id,
          state.currentFolder.id,
          emailId,
          read
        );
      }

      // Update local state
      setState(prev => ({
        ...prev,
        emails: prev.emails.map(email =>
          emailIds.includes(email.id)
            ? { ...email, flags: { ...email.flags, seen: read } }
            : email
        ),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to mark emails as read',
      }));
    }
  }, [currentAccount, state.currentFolder, emailService]);

  const markAsFlagged = useCallback(async (emailIds: string[], flagged: boolean) => {
    if (!currentAccount || !state.currentFolder) return;

    try {
      for (const emailId of emailIds) {
        await emailService.markAsFlagged(
          currentAccount.id,
          state.currentFolder.id,
          emailId,
          flagged
        );
      }

      // Update local state
      setState(prev => ({
        ...prev,
        emails: prev.emails.map(email =>
          emailIds.includes(email.id)
            ? { ...email, flags: { ...email.flags, flagged } }
            : email
        ),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to flag emails',
      }));
    }
  }, [currentAccount, state.currentFolder, emailService]);

  const moveToFolder = useCallback(async (emailIds: string[], targetFolderId: string) => {
    if (!currentAccount || !state.currentFolder) return;

    try {
      for (const emailId of emailIds) {
        await emailService.moveEmail(
          currentAccount.id,
          state.currentFolder.id,
          targetFolderId,
          emailId
        );
      }

      // Remove from current view
      setState(prev => ({
        ...prev,
        emails: prev.emails.filter(email => !emailIds.includes(email.id)),
        selectedEmails: prev.selectedEmails.filter(id => !emailIds.includes(id)),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to move emails',
      }));
    }
  }, [currentAccount, state.currentFolder, emailService]);

  const deleteEmails = useCallback(async (emailIds: string[], permanent: boolean = false) => {
    if (!currentAccount || !state.currentFolder) return;

    try {
      for (const emailId of emailIds) {
        await emailService.deleteEmail(
          currentAccount.id,
          state.currentFolder.id,
          emailId,
          permanent
        );
      }

      // Remove from current view
      setState(prev => ({
        ...prev,
        emails: prev.emails.filter(email => !emailIds.includes(email.id)),
        selectedEmails: prev.selectedEmails.filter(id => !emailIds.includes(id)),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete emails',
      }));
    }
  }, [currentAccount, state.currentFolder, emailService]);

  // Selection operations
  const selectEmail = useCallback((emailId: string) => {
    setState(prev => ({ ...prev, selectedEmails: [emailId] }));
  }, []);

  const selectEmails = useCallback((emailIds: string[]) => {
    setState(prev => ({ ...prev, selectedEmails: emailIds }));
  }, []);

  const toggleEmailSelection = useCallback((emailId: string) => {
    setState(prev => ({
      ...prev,
      selectedEmails: prev.selectedEmails.includes(emailId)
        ? prev.selectedEmails.filter(id => id !== emailId)
        : [...prev.selectedEmails, emailId],
    }));
  }, []);

  const selectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedEmails: prev.emails.map(email => email.id),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedEmails: [] }));
  }, []);

  // Search operations
  const searchEmails = useCallback(async (query: SearchQuery) => {
    if (!currentAccount) return;

    try {
      setState(prev => ({ ...prev, isSearching: true, error: null }));

      const emails = await emailService.searchEmails(currentAccount.id, query);
      const searchResults: SearchResult = {
        emails,
        total: emails.length,
        query,
        suggestions: [], // Could add search suggestions
      };

      setState(prev => ({
        ...prev,
        searchQuery: query,
        searchResults,
        isSearching: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }));
    }
  }, [currentAccount, emailService]);

  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      searchQuery: null,
      searchResults: null,
    }));
  }, []);

  // Threading operations
  const getEmailThread = useCallback(async (threadId: string): Promise<EmailThread | null> => {
    if (!currentAccount) return null;

    try {
      const emails = await emailService.getThreadEmails(currentAccount.id, threadId);
      
      if (emails.length === 0) return null;

      const participants = Array.from(
        new Set([
          ...emails.flatMap(email => [email.from, ...email.to]),
          ...emails.flatMap(email => email.cc || []),
        ])
      );

      const thread: EmailThread = {
        id: threadId,
        subject: emails[0].subject,
        participants,
        emails: emails.sort((a, b) => a.date.getTime() - b.date.getTime()),
        lastActivity: new Date(Math.max(...emails.map(e => e.date.getTime()))),
        unreadCount: emails.filter(e => !e.flags.seen).length,
        hasAttachments: emails.some(e => e.attachments.length > 0),
        labels: Array.from(new Set(emails.flatMap(e => e.labels))),
      };

      return thread;
    } catch (error) {
      console.error('Failed to get email thread:', error);
      return null;
    }
  }, [currentAccount, emailService]);

  const groupEmailsByThread = useCallback((emails: Email[]): EmailThread[] => {
    const threadMap = new Map<string, Email[]>();

    // Group emails by thread ID
    emails.forEach(email => {
      const threadId = email.threadId || email.id;
      const existing = threadMap.get(threadId) || [];
      threadMap.set(threadId, [...existing, email]);
    });

    // Convert to thread objects
    const threads: EmailThread[] = [];
    threadMap.forEach((threadEmails, threadId) => {
      const sortedEmails = threadEmails.sort((a, b) => a.date.getTime() - b.date.getTime());
      const lastEmail = sortedEmails[sortedEmails.length - 1];

      const participants = Array.from(
        new Set([
          ...threadEmails.flatMap(email => [email.from, ...email.to]),
          ...threadEmails.flatMap(email => email.cc || []),
        ])
      );

      threads.push({
        id: threadId,
        subject: lastEmail.subject,
        participants,
        emails: sortedEmails,
        lastActivity: lastEmail.date,
        unreadCount: threadEmails.filter(e => !e.flags.seen).length,
        hasAttachments: threadEmails.some(e => e.attachments.length > 0),
        labels: Array.from(new Set(threadEmails.flatMap(e => e.labels))),
      });
    });

    // Sort threads by last activity
    return threads.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }, []);

  // Stats calculation
  const getEmailStats = useCallback((): EmailStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayEmails = state.emails.filter(e => e.date >= today);
    const weekEmails = state.emails.filter(e => e.date >= weekAgo);
    const monthEmails = state.emails.filter(e => e.date >= monthAgo);

    // Calculate top senders
    const senderCounts = new Map<string, { name?: string; count: number }>();
    state.emails.forEach(email => {
      const existing = senderCounts.get(email.from.address) || { name: email.from.name, count: 0 };
      senderCounts.set(email.from.address, {
        name: existing.name || email.from.name,
        count: existing.count + 1,
      });
    });

    const topSenders = Array.from(senderCounts.entries())
      .map(([email, data]) => ({ email, name: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEmails: state.emails.length,
      unreadEmails: state.emails.filter(e => !e.flags.seen).length,
      todayEmails: todayEmails.length,
      weekEmails: weekEmails.length,
      monthEmails: monthEmails.length,
      sentEmails: 0, // Would need to check sent folder
      receivedEmails: state.emails.length,
      avgResponseTime: 0, // Would need to calculate from email chains
      topSenders,
      categoryBreakdown: [], // Would need AI categorization
    };
  }, [state.emails]);

  return {
    ...state,
    selectFolder,
    refreshFolder,
    syncAllFolders,
    fetchEmails,
    refreshEmails,
    markAsRead,
    markAsFlagged,
    moveToFolder,
    deleteEmails,
    selectEmail,
    selectEmails,
    toggleEmailSelection,
    selectAll,
    clearSelection,
    searchEmails,
    clearSearch,
    getEmailThread,
    groupEmailsByThread,
    getEmailStats,
  };
}