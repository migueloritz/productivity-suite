import { invoke } from '@tauri-apps/api/tauri';
import { 
  Email, 
  EmailAccount, 
  EmailFolder, 
  ComposeEmail, 
  SearchQuery, 
  SearchResult,
  EmailThread,
  SyncStatus,
  ApiResponse,
  EmailAttachment
} from '../types';

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Account Management
  async connectAccount(account: Omit<EmailAccount, 'folders'>): Promise<boolean> {
    try {
      const result = await invoke<boolean>('connect_account', {
        account: {
          id: account.id,
          name: account.name,
          email: account.email,
          provider: account.provider,
          imap_server: account.imapServer,
          imap_port: account.imapPort,
          smtp_server: account.smtpServer,
          smtp_port: account.smtpPort,
          username: account.username,
          password: account.encryptedPassword,
          use_tls: true,
        }
      });
      return result;
    } catch (error) {
      console.error('Failed to connect account:', error);
      throw new Error(`Failed to connect account: ${error}`);
    }
  }

  async disconnectAccount(accountId: string): Promise<boolean> {
    try {
      const result = await invoke<boolean>('disconnect_account', {
        accountId
      });
      return result;
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      throw new Error(`Failed to disconnect account: ${error}`);
    }
  }

  async testConnection(account: Omit<EmailAccount, 'folders'>): Promise<boolean> {
    try {
      const result = await invoke<boolean>('test_connection', {
        config: {
          id: account.id,
          name: account.name,
          email: account.email,
          provider: account.provider,
          imap_server: account.imapServer,
          imap_port: account.imapPort,
          smtp_server: account.smtpServer,
          smtp_port: account.smtpPort,
          username: account.username,
          password: account.encryptedPassword,
          use_tls: true,
        }
      });
      return result;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw new Error(`Connection test failed: ${error}`);
    }
  }

  // Folder Management
  async syncFolders(accountId: string): Promise<EmailFolder[]> {
    try {
      const folders = await invoke<any[]>('sync_folders', { accountId });
      return folders.map(this.transformFolderData);
    } catch (error) {
      console.error('Failed to sync folders:', error);
      throw new Error(`Failed to sync folders: ${error}`);
    }
  }

  // Email Operations
  async fetchEmails(
    accountId: string, 
    folderId: string, 
    limit?: number, 
    offset?: number
  ): Promise<Email[]> {
    try {
      const emails = await invoke<any[]>('fetch_emails', {
        accountId,
        folderId,
        limit,
        offset
      });
      return emails.map(this.transformEmailData);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      throw new Error(`Failed to fetch emails: ${error}`);
    }
  }

  async fetchEmailContent(
    accountId: string, 
    folderId: string, 
    messageId: string
  ): Promise<Email> {
    try {
      const email = await invoke<any>('fetch_email_content', {
        accountId,
        folderId,
        messageId
      });
      return this.transformEmailData(email);
    } catch (error) {
      console.error('Failed to fetch email content:', error);
      throw new Error(`Failed to fetch email content: ${error}`);
    }
  }

  async sendEmail(accountId: string, email: ComposeEmail): Promise<string> {
    try {
      const messageId = await invoke<string>('send_email', {
        accountId,
        emailData: {
          to: email.to,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          body_html: email.bodyHtml,
          body_text: email.bodyText,
          attachments: email.attachments.map(file => ({
            filename: file.name,
            mime_type: file.type,
            content: new Uint8Array(), // File content would need to be read
          })),
          priority: email.priority,
          request_read_receipt: email.requestReadReceipt,
          reply_to_id: email.replyToId,
          forward_from_id: email.forwardFromId,
        }
      });
      return messageId;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  async markAsRead(
    accountId: string, 
    folderId: string, 
    messageId: string, 
    read: boolean
  ): Promise<boolean> {
    try {
      const result = await invoke<boolean>('mark_as_read', {
        accountId,
        folderId,
        messageId,
        read
      });
      return result;
    } catch (error) {
      console.error('Failed to mark email as read:', error);
      throw new Error(`Failed to mark email as read: ${error}`);
    }
  }

  async markAsFlagged(
    accountId: string, 
    folderId: string, 
    messageId: string, 
    flagged: boolean
  ): Promise<boolean> {
    try {
      const result = await invoke<boolean>('mark_as_flagged', {
        accountId,
        folderId,
        messageId,
        flagged
      });
      return result;
    } catch (error) {
      console.error('Failed to mark email as flagged:', error);
      throw new Error(`Failed to mark email as flagged: ${error}`);
    }
  }

  async moveEmail(
    accountId: string, 
    fromFolderId: string, 
    toFolderId: string, 
    messageId: string
  ): Promise<boolean> {
    try {
      const result = await invoke<boolean>('move_email', {
        accountId,
        fromFolderId,
        toFolderId,
        messageId
      });
      return result;
    } catch (error) {
      console.error('Failed to move email:', error);
      throw new Error(`Failed to move email: ${error}`);
    }
  }

  async deleteEmail(
    accountId: string, 
    folderId: string, 
    messageId: string, 
    permanent: boolean = false
  ): Promise<boolean> {
    try {
      const result = await invoke<boolean>('delete_email', {
        accountId,
        folderId,
        messageId,
        permanent
      });
      return result;
    } catch (error) {
      console.error('Failed to delete email:', error);
      throw new Error(`Failed to delete email: ${error}`);
    }
  }

  // Search
  async searchEmails(accountId: string, query: SearchQuery): Promise<Email[]> {
    try {
      const emails = await invoke<any[]>('search_emails', {
        accountId,
        query: {
          query: query.query,
          folder: query.folder,
          from: query.from,
          to: query.to,
          subject: query.subject,
          date_from: query.dateFrom,
          date_to: query.dateTo,
          has_attachment: query.hasAttachment,
          is_unread: query.isUnread,
          is_flagged: query.isFlagged,
          labels: query.labels,
        }
      });
      return emails.map(this.transformEmailData);
    } catch (error) {
      console.error('Failed to search emails:', error);
      throw new Error(`Failed to search emails: ${error}`);
    }
  }

  // Attachments
  async downloadAttachment(
    accountId: string, 
    folderId: string, 
    messageId: string, 
    attachmentId: string
  ): Promise<Uint8Array> {
    try {
      const data = await invoke<number[]>('download_attachment', {
        accountId,
        folderId,
        messageId,
        attachmentId
      });
      return new Uint8Array(data);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      throw new Error(`Failed to download attachment: ${error}`);
    }
  }

  // Threading
  async getThreadEmails(accountId: string, threadId: string): Promise<Email[]> {
    try {
      const emails = await invoke<any[]>('get_thread_emails', {
        accountId,
        threadId
      });
      return emails.map(this.transformEmailData);
    } catch (error) {
      console.error('Failed to get thread emails:', error);
      throw new Error(`Failed to get thread emails: ${error}`);
    }
  }

  // Data transformation helpers
  private transformEmailData(data: any): Email {
    return {
      id: data.id,
      messageId: data.message_id,
      threadId: data.thread_id,
      accountId: data.account_id,
      folderId: data.folder_id,
      subject: data.subject,
      from: {
        name: data.from.name,
        address: data.from.address,
      },
      to: data.to.map((addr: any) => ({
        name: addr.name,
        address: addr.address,
      })),
      cc: data.cc?.map((addr: any) => ({
        name: addr.name,
        address: addr.address,
      })),
      bcc: data.bcc?.map((addr: any) => ({
        name: addr.name,
        address: addr.address,
      })),
      replyTo: data.reply_to ? {
        name: data.reply_to.name,
        address: data.reply_to.address,
      } : undefined,
      date: new Date(data.date),
      receivedDate: new Date(data.received_date),
      bodyText: data.body_text,
      bodyHtml: data.body_html,
      attachments: data.attachments.map((att: any) => ({
        id: att.id,
        filename: att.filename,
        mimeType: att.mime_type,
        size: att.size,
        contentId: att.content_id,
        isInline: att.is_inline,
      })),
      flags: {
        seen: data.flags.seen,
        answered: data.flags.answered,
        flagged: data.flags.flagged,
        deleted: data.flags.deleted,
        draft: data.flags.draft,
        recent: data.flags.recent,
      },
      labels: data.labels,
      priority: data.priority as 'low' | 'normal' | 'high',
      importance: data.importance as 'low' | 'normal' | 'high',
      size: data.size,
    };
  }

  private transformFolderData(data: any): EmailFolder {
    return {
      id: data.id,
      name: data.name,
      path: data.path,
      type: data.folder_type as 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'custom',
      parentId: data.parent_id,
      unreadCount: data.unread_count,
      totalCount: data.total_count,
      lastSync: data.last_sync ? new Date(data.last_sync) : null,
    };
  }

  // Utility methods
  async saveEmailDraft(email: ComposeEmail): Promise<string> {
    // Implementation would save draft locally or to server
    const draftId = `draft_${Date.now()}`;
    localStorage.setItem(`draft_${draftId}`, JSON.stringify(email));
    return draftId;
  }

  async loadEmailDraft(draftId: string): Promise<ComposeEmail | null> {
    const draftData = localStorage.getItem(`draft_${draftId}`);
    return draftData ? JSON.parse(draftData) : null;
  }

  async deleteDraft(draftId: string): Promise<void> {
    localStorage.removeItem(`draft_${draftId}`);
  }

  // Email validation
  validateEmailAddress(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateEmailAddresses(emails: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];
    
    emails.forEach(email => {
      if (this.validateEmailAddress(email.trim())) {
        valid.push(email.trim());
      } else {
        invalid.push(email.trim());
      }
    });
    
    return { valid, invalid };
  }

  // Helper for parsing email addresses from string
  parseEmailAddresses(addressString: string): { name?: string; address: string }[] {
    const addresses: { name?: string; address: string }[] = [];
    const regex = /(?:"?([^"]*)"?\s)?(?:([^\s@<>]+)@([^\s@<>,]+))/g;
    
    let match;
    while ((match = regex.exec(addressString)) !== null) {
      const name = match[1]?.trim();
      const email = `${match[2]}@${match[3]}`;
      
      addresses.push({
        name: name && name.length > 0 ? name : undefined,
        address: email,
      });
    }
    
    return addresses;
  }

  // Format email address for display
  formatEmailAddress(address: { name?: string; address: string }): string {
    if (address.name) {
      return `"${address.name}" <${address.address}>`;
    }
    return address.address;
  }

  // Get email priority display
  getPriorityDisplay(priority: 'low' | 'normal' | 'high'): { label: string; color: string; icon: string } {
    switch (priority) {
      case 'high':
        return { label: 'High', color: 'text-red-600', icon: '⚠️' };
      case 'low':
        return { label: 'Low', color: 'text-gray-500', icon: '⬇️' };
      default:
        return { label: 'Normal', color: 'text-gray-700', icon: '' };
    }
  }

  // Get attachment icon based on file type
  getAttachmentIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '📦';
    return '📎';
  }
}