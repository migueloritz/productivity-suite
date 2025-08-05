import { useState, useEffect, useCallback } from 'react';
import { EmailAccount, NotificationSettings } from '../types';
import { EmailService } from '../services/email';
import { ImapService } from '../services/imap';

interface AuthState {
  accounts: EmailAccount[];
  currentAccount: EmailAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  addAccount: (account: Omit<EmailAccount, 'folders'>) => Promise<boolean>;
  removeAccount: (accountId: string) => Promise<boolean>;
  switchAccount: (accountId: string) => void;
  testConnection: (account: Omit<EmailAccount, 'folders'>) => Promise<boolean>;
  refreshAccount: (accountId: string) => Promise<void>;
  updateAccountSettings: (accountId: string, settings: Partial<EmailAccount>) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthContextType {
  const [state, setState] = useState<AuthState>({
    accounts: [],
    currentAccount: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const emailService = EmailService.getInstance();
  const imapService = ImapService.getInstance();

  // Load accounts from storage on mount
  useEffect(() => {
    loadStoredAccounts();
  }, []);

  const loadStoredAccounts = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const storedAccounts = localStorage.getItem('email_accounts');
      if (storedAccounts) {
        const accounts: EmailAccount[] = JSON.parse(storedAccounts);
        const currentAccountId = localStorage.getItem('current_account_id');
        const currentAccount = accounts.find(acc => acc.id === currentAccountId) || accounts[0] || null;

        // Attempt to reconnect to stored accounts
        for (const account of accounts) {
          try {
            await emailService.connectAccount(account);
          } catch (error) {
            console.warn(`Failed to reconnect to account ${account.email}:`, error);
          }
        }

        setState({
          accounts,
          currentAccount,
          isAuthenticated: accounts.length > 0,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load accounts',
      }));
    }
  }, [emailService]);

  const addAccount = useCallback(async (accountData: Omit<EmailAccount, 'folders'>): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Test connection first
      const isValid = await emailService.testConnection(accountData);
      if (!isValid) {
        throw new Error('Failed to connect to email account');
      }

      // Connect to the account
      await emailService.connectAccount(accountData);

      // Sync folders
      const folders = await emailService.syncFolders(accountData.id);

      const newAccount: EmailAccount = {
        ...accountData,
        folders,
        isDefault: state.accounts.length === 0,
        lastSync: new Date(),
      };

      const updatedAccounts = [...state.accounts, newAccount];
      const currentAccount = state.currentAccount || newAccount;

      // Save to storage
      localStorage.setItem('email_accounts', JSON.stringify(updatedAccounts));
      localStorage.setItem('current_account_id', currentAccount.id);

      setState({
        accounts: updatedAccounts,
        currentAccount,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to add account',
      }));
      return false;
    }
  }, [state.accounts, state.currentAccount, emailService]);

  const removeAccount = useCallback(async (accountId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Disconnect from the account
      await emailService.disconnectAccount(accountId);

      const updatedAccounts = state.accounts.filter(acc => acc.id !== accountId);
      const newCurrentAccount = state.currentAccount?.id === accountId 
        ? (updatedAccounts[0] || null)
        : state.currentAccount;

      // Update storage
      localStorage.setItem('email_accounts', JSON.stringify(updatedAccounts));
      if (newCurrentAccount) {
        localStorage.setItem('current_account_id', newCurrentAccount.id);
      } else {
        localStorage.removeItem('current_account_id');
      }

      setState({
        accounts: updatedAccounts,
        currentAccount: newCurrentAccount,
        isAuthenticated: updatedAccounts.length > 0,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to remove account',
      }));
      return false;
    }
  }, [state.accounts, state.currentAccount, emailService]);

  const switchAccount = useCallback((accountId: string) => {
    const account = state.accounts.find(acc => acc.id === accountId);
    if (account) {
      setState(prev => ({ ...prev, currentAccount: account }));
      localStorage.setItem('current_account_id', accountId);
    }
  }, [state.accounts]);

  const testConnection = useCallback(async (account: Omit<EmailAccount, 'folders'>): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const result = await emailService.testConnection(account);
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection test failed',
      }));
      return false;
    }
  }, [emailService]);

  const refreshAccount = useCallback(async (accountId: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const account = state.accounts.find(acc => acc.id === accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      // Reconnect and sync folders
      await emailService.connectAccount(account);
      const folders = await emailService.syncFolders(accountId);

      const updatedAccount = { 
        ...account, 
        folders, 
        lastSync: new Date() 
      };

      const updatedAccounts = state.accounts.map(acc => 
        acc.id === accountId ? updatedAccount : acc
      );

      // Update storage
      localStorage.setItem('email_accounts', JSON.stringify(updatedAccounts));

      setState(prev => ({
        ...prev,
        accounts: updatedAccounts,
        currentAccount: prev.currentAccount?.id === accountId ? updatedAccount : prev.currentAccount,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to refresh account',
      }));
    }
  }, [state.accounts, emailService]);

  const updateAccountSettings = useCallback(async (
    accountId: string, 
    settings: Partial<EmailAccount>
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const updatedAccounts = state.accounts.map(acc =>
        acc.id === accountId ? { ...acc, ...settings } : acc
      );

      const updatedCurrentAccount = state.currentAccount?.id === accountId
        ? { ...state.currentAccount, ...settings }
        : state.currentAccount;

      // Update storage
      localStorage.setItem('email_accounts', JSON.stringify(updatedAccounts));

      setState(prev => ({
        ...prev,
        accounts: updatedAccounts,
        currentAccount: updatedCurrentAccount,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update account settings',
      }));
    }
  }, [state.accounts, state.currentAccount]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Disconnect all accounts
      for (const account of state.accounts) {
        try {
          await emailService.disconnectAccount(account.id);
        } catch (error) {
          console.warn(`Failed to disconnect account ${account.email}:`, error);
        }
      }

      // Clear storage
      localStorage.removeItem('email_accounts');
      localStorage.removeItem('current_account_id');

      setState({
        accounts: [],
        currentAccount: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to sign out',
      }));
    }
  }, [state.accounts, emailService]);

  return {
    ...state,
    addAccount,
    removeAccount,
    switchAccount,
    testConnection,
    refreshAccount,
    updateAccountSettings,
    signOut,
  };
}

// Encryption utilities for storing sensitive data
export class PasswordManager {
  private static readonly KEY_NAME = 'email_encryption_key';

  static async encryptPassword(password: string): Promise<string> {
    try {
      // In a real implementation, use proper encryption
      // For demo purposes, we'll use simple base64 encoding
      return btoa(password);
    } catch (error) {
      console.error('Failed to encrypt password:', error);
      throw new Error('Password encryption failed');
    }
  }

  static async decryptPassword(encryptedPassword: string): Promise<string> {
    try {
      // In a real implementation, use proper decryption
      // For demo purposes, we'll use simple base64 decoding
      return atob(encryptedPassword);
    } catch (error) {
      console.error('Failed to decrypt password:', error);
      throw new Error('Password decryption failed');
    }
  }

  static async generateKey(): Promise<string> {
    // Generate a random encryption key
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static getStoredKey(): string | null {
    return localStorage.getItem(this.KEY_NAME);
  }

  static storeKey(key: string): void {
    localStorage.setItem(this.KEY_NAME, key);
  }

  static clearKey(): void {
    localStorage.removeItem(this.KEY_NAME);
  }
}

// OAuth utilities for providers that support it
export class OAuthManager {
  static async initiateGoogleOAuth(): Promise<{ accessToken: string; refreshToken: string }> {
    // Implementation would handle Google OAuth flow
    throw new Error('OAuth not implemented in demo');
  }

  static async initiateMicrosoftOAuth(): Promise<{ accessToken: string; refreshToken: string }> {
    // Implementation would handle Microsoft OAuth flow
    throw new Error('OAuth not implemented in demo');
  }

  static async refreshToken(refreshToken: string, provider: string): Promise<string> {
    // Implementation would refresh the access token
    throw new Error('Token refresh not implemented in demo');
  }

  static isOAuthSupported(provider: string): boolean {
    return ['gmail', 'outlook', 'exchange'].includes(provider.toLowerCase());
  }
}

// Account validation utilities
export function validateEmailAccount(account: Partial<EmailAccount>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!account.name?.trim()) {
    errors.push('Account name is required');
  }

  if (!account.email?.trim()) {
    errors.push('Email address is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) {
    errors.push('Valid email address is required');
  }

  if (!account.imapServer?.trim()) {
    errors.push('IMAP server is required');
  }

  if (!account.imapPort || account.imapPort < 1 || account.imapPort > 65535) {
    errors.push('Valid IMAP port is required');
  }

  if (!account.smtpServer?.trim()) {
    errors.push('SMTP server is required');
  }

  if (!account.smtpPort || account.smtpPort < 1 || account.smtpPort > 65535) {
    errors.push('Valid SMTP port is required');
  }

  if (!account.username?.trim()) {
    errors.push('Username is required');
  }

  if (!account.encryptedPassword?.trim()) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Provider presets for common email providers
export const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    imapServer: 'imap.gmail.com',
    imapPort: 993,
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    requiresOAuth: true,
    supportsAppPasswords: true,
  },
  outlook: {
    name: 'Outlook/Hotmail',
    imapServer: 'outlook.office365.com',
    imapPort: 993,
    smtpServer: 'smtp-mail.outlook.com',
    smtpPort: 587,
    requiresOAuth: false,
    supportsAppPasswords: true,
  },
  yahoo: {
    name: 'Yahoo Mail',
    imapServer: 'imap.mail.yahoo.com',
    imapPort: 993,
    smtpServer: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    requiresOAuth: false,
    supportsAppPasswords: true,
  },
  icloud: {
    name: 'iCloud Mail',
    imapServer: 'imap.mail.me.com',
    imapPort: 993,
    smtpServer: 'smtp.mail.me.com',
    smtpPort: 587,
    requiresOAuth: false,
    supportsAppPasswords: true,
  },
} as const;