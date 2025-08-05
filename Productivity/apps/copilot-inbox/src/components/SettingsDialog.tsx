import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useAuth, EMAIL_PROVIDERS } from '../hooks/useAuth';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SettingsDialogProps {
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ onClose }) => {
  const { addAccount, accounts, removeAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'accounts' | 'general'>('accounts');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    email: '',
    provider: 'imap' as keyof typeof EMAIL_PROVIDERS | 'imap',
    imapServer: '',
    imapPort: 993,
    smtpServer: '',
    smtpPort: 587,
    username: '',
    password: '',
  });

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const accountData = {
        id: `account_${Date.now()}`,
        ...newAccount,
        encryptedPassword: btoa(newAccount.password), // Simple encoding for demo
      };
      
      await addAccount(accountData);
      setShowAddAccount(false);
      setNewAccount({
        name: '',
        email: '',
        provider: 'imap',
        imapServer: '',
        imapPort: 993,
        smtpServer: '',
        smtpPort: 587,
        username: '',
        password: '',
      });
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const handleProviderChange = (provider: string) => {
    if (provider in EMAIL_PROVIDERS) {
      const providerConfig = EMAIL_PROVIDERS[provider as keyof typeof EMAIL_PROVIDERS];
      setNewAccount(prev => ({
        ...prev,
        provider: provider as any,
        imapServer: providerConfig.imapServer,
        imapPort: providerConfig.imapPort,
        smtpServer: providerConfig.smtpServer,
        smtpPort: providerConfig.smtpPort,
      }));
    } else {
      setNewAccount(prev => ({ ...prev, provider: 'imap' }));
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-25" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Settings</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'accounts', label: 'Email Accounts' },
                  { id: 'general', label: 'General' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6">
              {activeTab === 'accounts' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">Email Accounts</h4>
                    <button
                      onClick={() => setShowAddAccount(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Add Account
                    </button>
                  </div>

                  {/* Account List */}
                  <div className="space-y-4">
                    {accounts.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{account.name}</p>
                          <p className="text-sm text-gray-500">{account.email}</p>
                        </div>
                        <button
                          onClick={() => removeAccount(account.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Account Form */}
                  {showAddAccount && (
                    <form onSubmit={handleAddAccount} className="space-y-4 border-t border-gray-200 pt-6">
                      <h5 className="text-lg font-medium text-gray-900">Add New Account</h5>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <input
                            type="text"
                            value={newAccount.name}
                            onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            value={newAccount.email}
                            onChange={(e) => setNewAccount(prev => ({ ...prev, email: e.target.value }))}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Provider</label>
                        <select
                          value={newAccount.provider}
                          onChange={(e) => handleProviderChange(e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="imap">Custom IMAP</option>
                          {Object.entries(EMAIL_PROVIDERS).map(([key, provider]) => (
                            <option key={key} value={key}>{provider.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Username</label>
                          <input
                            type="text"
                            value={newAccount.username}
                            onChange={(e) => setNewAccount(prev => ({ ...prev, username: e.target.value }))}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Password</label>
                          <input
                            type="password"
                            value={newAccount.password}
                            onChange={(e) => setNewAccount(prev => ({ ...prev, password: e.target.value }))}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddAccount(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                        >
                          Add Account
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h4 className="text-lg font-medium text-gray-900">General Settings</h4>
                  <p className="text-gray-600">General settings will be implemented here.</p>
                </div>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};