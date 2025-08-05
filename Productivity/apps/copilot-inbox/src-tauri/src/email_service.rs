use crate::imap_client::ImapClient;
use crate::smtp_client::SmtpClient;
use crate::parser::{parse_email, parse_address_list};
use anyhow::{Result, anyhow};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAccountConfig {
    pub id: String,
    pub name: String,
    pub email: String,
    pub provider: String,
    pub imap_server: String,
    pub imap_port: u16,
    pub smtp_server: String,
    pub smtp_port: u16,
    pub username: String,
    pub password: String,
    pub use_tls: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailFolderData {
    pub id: String,
    pub name: String,
    pub path: String,
    pub folder_type: String,
    pub parent_id: Option<String>,
    pub unread_count: u32,
    pub total_count: u32,
    pub last_sync: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAddressData {
    pub name: Option<String>,
    pub address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAttachmentData {
    pub id: String,
    pub filename: String,
    pub mime_type: String,
    pub size: u64,
    pub content_id: Option<String>,
    pub is_inline: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailFlagsData {
    pub seen: bool,
    pub answered: bool,
    pub flagged: bool,
    pub deleted: bool,
    pub draft: bool,
    pub recent: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailData {
    pub id: String,
    pub message_id: String,
    pub thread_id: Option<String>,
    pub account_id: String,
    pub folder_id: String,
    pub subject: String,
    pub from: EmailAddressData,
    pub to: Vec<EmailAddressData>,
    pub cc: Option<Vec<EmailAddressData>>,
    pub bcc: Option<Vec<EmailAddressData>>,
    pub reply_to: Option<EmailAddressData>,
    pub date: DateTime<Utc>,
    pub received_date: DateTime<Utc>,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub attachments: Vec<EmailAttachmentData>,
    pub flags: EmailFlagsData,
    pub labels: Vec<String>,
    pub priority: String,
    pub importance: String,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComposeEmailData {
    pub to: Vec<EmailAddressData>,
    pub cc: Option<Vec<EmailAddressData>>,
    pub bcc: Option<Vec<EmailAddressData>>,
    pub subject: String,
    pub body_html: Option<String>,
    pub body_text: String,
    pub attachments: Vec<AttachmentData>,
    pub priority: Option<String>,
    pub request_read_receipt: Option<bool>,
    pub reply_to_id: Option<String>,
    pub forward_from_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AttachmentData {
    pub filename: String,
    pub mime_type: String,
    pub content: Vec<u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQueryData {
    pub query: String,
    pub folder: Option<String>,
    pub from: Option<String>,
    pub to: Option<String>,
    pub subject: Option<String>,
    pub date_from: Option<DateTime<Utc>>,
    pub date_to: Option<DateTime<Utc>>,
    pub has_attachment: Option<bool>,
    pub is_unread: Option<bool>,
    pub is_flagged: Option<bool>,
    pub labels: Option<Vec<String>>,
}

pub struct EmailService {
    imap_clients: HashMap<String, ImapClient>,
    smtp_clients: HashMap<String, SmtpClient>,
}

impl EmailService {
    pub fn new() -> Self {
        Self {
            imap_clients: HashMap::new(),
            smtp_clients: HashMap::new(),
        }
    }

    pub async fn connect_account(&mut self, config: EmailAccountConfig) -> Result<bool> {
        // Test IMAP connection
        let mut imap_client = ImapClient::new(
            &config.imap_server,
            config.imap_port,
            config.use_tls,
        ).await?;
        
        imap_client.login(&config.username, &config.password).await?;
        
        // Test SMTP connection
        let smtp_client = SmtpClient::new(
            &config.smtp_server,
            config.smtp_port,
            config.use_tls,
            &config.username,
            &config.password,
        ).await?;

        // Store clients
        self.imap_clients.insert(config.id.clone(), imap_client);
        self.smtp_clients.insert(config.id.clone(), smtp_client);

        Ok(true)
    }

    pub async fn disconnect_account(&mut self, account_id: &str) -> Result<bool> {
        if let Some(mut imap_client) = self.imap_clients.remove(account_id) {
            imap_client.logout().await?;
        }
        
        self.smtp_clients.remove(account_id);
        Ok(true)
    }

    pub async fn test_connection(&self, config: EmailAccountConfig) -> Result<bool> {
        // Test IMAP connection
        let mut imap_client = ImapClient::new(
            &config.imap_server,
            config.imap_port,
            config.use_tls,
        ).await?;
        
        imap_client.login(&config.username, &config.password).await?;
        imap_client.logout().await?;

        // Test SMTP connection
        let _smtp_client = SmtpClient::new(
            &config.smtp_server,
            config.smtp_port,
            config.use_tls,
            &config.username,
            &config.password,
        ).await?;

        Ok(true)
    }

    pub async fn sync_folders(&mut self, account_id: &str) -> Result<Vec<EmailFolderData>> {
        let imap_client = self.imap_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        let folders = imap_client.list_folders().await?;
        let mut folder_data = Vec::new();

        for folder in folders {
            let stats = imap_client.get_folder_stats(&folder.name).await?;
            
            folder_data.push(EmailFolderData {
                id: Uuid::new_v4().to_string(),
                name: folder.name.clone(),
                path: folder.name,
                folder_type: determine_folder_type(&folder.name),
                parent_id: None,
                unread_count: stats.unseen,
                total_count: stats.total,
                last_sync: Some(Utc::now()),
            });
        }

        Ok(folder_data)
    }

    pub async fn fetch_emails(
        &mut self,
        account_id: &str,
        folder_id: &str,
        limit: Option<usize>,
        offset: Option<usize>,
    ) -> Result<Vec<EmailData>> {
        let imap_client = self.imap_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        imap_client.select_folder(folder_id).await?;
        
        let limit = limit.unwrap_or(50);
        let offset = offset.unwrap_or(0);
        
        let message_ids = imap_client.search("ALL").await?;
        let start = message_ids.len().saturating_sub(offset + limit);
        let end = message_ids.len().saturating_sub(offset);
        
        let mut emails = Vec::new();
        
        for &msg_id in &message_ids[start..end] {
            if let Ok(email_data) = self.fetch_single_email(imap_client, account_id, folder_id, msg_id).await {
                emails.push(email_data);
            }
        }

        emails.reverse(); // Show newest first
        Ok(emails)
    }

    pub async fn fetch_email_content(
        &mut self,
        account_id: &str,
        folder_id: &str,
        message_id: &str,
    ) -> Result<EmailData> {
        let imap_client = self.imap_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        imap_client.select_folder(folder_id).await?;
        
        let msg_id: u32 = message_id.parse()?;
        self.fetch_single_email(imap_client, account_id, folder_id, msg_id).await
    }

    async fn fetch_single_email(
        &self,
        imap_client: &mut ImapClient,
        account_id: &str,
        folder_id: &str,
        msg_id: u32,
    ) -> Result<EmailData> {
        let message = imap_client.fetch_message(msg_id).await?;
        let parsed = parse_email(&message.body)?;

        Ok(EmailData {
            id: msg_id.to_string(),
            message_id: parsed.message_id.unwrap_or_else(|| Uuid::new_v4().to_string()),
            thread_id: parsed.thread_id,
            account_id: account_id.to_string(),
            folder_id: folder_id.to_string(),
            subject: parsed.subject.unwrap_or_default(),
            from: EmailAddressData {
                name: parsed.from.as_ref().and_then(|f| f.name.clone()),
                address: parsed.from.as_ref().map(|f| f.address.clone()).unwrap_or_default(),
            },
            to: parsed.to.into_iter().map(|addr| EmailAddressData {
                name: addr.name,
                address: addr.address,
            }).collect(),
            cc: if parsed.cc.is_empty() { None } else {
                Some(parsed.cc.into_iter().map(|addr| EmailAddressData {
                    name: addr.name,
                    address: addr.address,
                }).collect())
            },
            bcc: if parsed.bcc.is_empty() { None } else {
                Some(parsed.bcc.into_iter().map(|addr| EmailAddressData {
                    name: addr.name,
                    address: addr.address,
                }).collect())
            },
            reply_to: parsed.reply_to.map(|addr| EmailAddressData {
                name: addr.name,
                address: addr.address,
            }),
            date: parsed.date.unwrap_or_else(Utc::now),
            received_date: parsed.received_date.unwrap_or_else(Utc::now),
            body_text: parsed.body_text,
            body_html: parsed.body_html,
            attachments: parsed.attachments.into_iter().map(|att| EmailAttachmentData {
                id: att.id,
                filename: att.filename,
                mime_type: att.mime_type,
                size: att.size,
                content_id: att.content_id,
                is_inline: att.is_inline,
            }).collect(),
            flags: EmailFlagsData {
                seen: message.flags.contains(&"\\Seen".to_string()),
                answered: message.flags.contains(&"\\Answered".to_string()),
                flagged: message.flags.contains(&"\\Flagged".to_string()),
                deleted: message.flags.contains(&"\\Deleted".to_string()),
                draft: message.flags.contains(&"\\Draft".to_string()),
                recent: message.flags.contains(&"\\Recent".to_string()),
            },
            labels: message.labels,
            priority: "normal".to_string(),
            importance: "normal".to_string(),
            size: message.size,
        })
    }

    pub async fn send_email(&mut self, account_id: &str, email_data: ComposeEmailData) -> Result<String> {
        let smtp_client = self.smtp_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        let message_id = smtp_client.send_email(email_data).await?;
        Ok(message_id)
    }

    pub async fn mark_as_read(&mut self, account_id: &str, folder_id: &str, message_id: &str, read: bool) -> Result<bool> {
        let imap_client = self.imap_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        imap_client.select_folder(folder_id).await?;
        let msg_id: u32 = message_id.parse()?;
        
        if read {
            imap_client.add_flags(msg_id, &["\\Seen"]).await?;
        } else {
            imap_client.remove_flags(msg_id, &["\\Seen"]).await?;
        }
        
        Ok(true)
    }

    pub async fn mark_as_flagged(&mut self, account_id: &str, folder_id: &str, message_id: &str, flagged: bool) -> Result<bool> {
        let imap_client = self.imap_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        imap_client.select_folder(folder_id).await?;
        let msg_id: u32 = message_id.parse()?;
        
        if flagged {
            imap_client.add_flags(msg_id, &["\\Flagged"]).await?;
        } else {
            imap_client.remove_flags(msg_id, &["\\Flagged"]).await?;
        }
        
        Ok(true)
    }

    pub async fn move_email(&mut self, account_id: &str, from_folder_id: &str, to_folder_id: &str, message_id: &str) -> Result<bool> {
        let imap_client = self.imap_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        imap_client.select_folder(from_folder_id).await?;
        let msg_id: u32 = message_id.parse()?;
        
        imap_client.move_message(msg_id, to_folder_id).await?;
        Ok(true)
    }

    pub async fn delete_email(&mut self, account_id: &str, folder_id: &str, message_id: &str, permanent: bool) -> Result<bool> {
        let imap_client = self.imap_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        imap_client.select_folder(folder_id).await?;
        let msg_id: u32 = message_id.parse()?;
        
        if permanent {
            imap_client.add_flags(msg_id, &["\\Deleted"]).await?;
            imap_client.expunge().await?;
        } else {
            // Move to trash folder
            imap_client.move_message(msg_id, "Trash").await?;
        }
        
        Ok(true)
    }

    pub async fn search_emails(&mut self, account_id: &str, query: SearchQueryData) -> Result<Vec<EmailData>> {
        let imap_client = self.imap_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        let folder = query.folder.as_deref().unwrap_or("INBOX");
        imap_client.select_folder(folder).await?;
        
        let search_criteria = build_search_criteria(&query);
        let message_ids = imap_client.search(&search_criteria).await?;
        
        let mut emails = Vec::new();
        for &msg_id in &message_ids {
            if let Ok(email_data) = self.fetch_single_email(imap_client, account_id, folder, msg_id).await {
                emails.push(email_data);
            }
        }

        emails.reverse(); // Show newest first
        Ok(emails)
    }

    pub async fn download_attachment(&mut self, account_id: &str, folder_id: &str, message_id: &str, attachment_id: &str) -> Result<Vec<u8>> {
        let imap_client = self.imap_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        imap_client.select_folder(folder_id).await?;
        let msg_id: u32 = message_id.parse()?;
        
        imap_client.download_attachment(msg_id, attachment_id).await
    }

    pub async fn get_thread_emails(&mut self, account_id: &str, thread_id: &str) -> Result<Vec<EmailData>> {
        let imap_client = self.imap_clients.get_mut(account_id)
            .ok_or_else(|| anyhow!("Account not connected"))?;

        // Search for emails with the same thread ID
        let search_criteria = format!("HEADER \"References\" \"{}\" OR HEADER \"In-Reply-To\" \"{}\"", thread_id, thread_id);
        let message_ids = imap_client.search(&search_criteria).await?;
        
        let mut emails = Vec::new();
        for &msg_id in &message_ids {
            if let Ok(email_data) = self.fetch_single_email(imap_client, account_id, "INBOX", msg_id).await {
                emails.push(email_data);
            }
        }

        // Sort by date
        emails.sort_by(|a, b| a.date.cmp(&b.date));
        Ok(emails)
    }
}

fn determine_folder_type(folder_name: &str) -> String {
    let lower = folder_name.to_lowercase();
    match lower.as_str() {
        "inbox" => "inbox".to_string(),
        "sent" | "sent items" | "sent mail" => "sent".to_string(),
        "drafts" | "draft" => "drafts".to_string(),
        "trash" | "deleted items" | "deleted" => "trash".to_string(),
        "spam" | "junk" | "junk email" => "spam".to_string(),
        _ => "custom".to_string(),
    }
}

fn build_search_criteria(query: &SearchQueryData) -> String {
    let mut criteria = Vec::new();
    
    if !query.query.is_empty() {
        criteria.push(format!("TEXT \"{}\"", query.query));
    }
    
    if let Some(from) = &query.from {
        criteria.push(format!("FROM \"{}\"", from));
    }
    
    if let Some(to) = &query.to {
        criteria.push(format!("TO \"{}\"", to));
    }
    
    if let Some(subject) = &query.subject {
        criteria.push(format!("SUBJECT \"{}\"", subject));
    }
    
    if let Some(date_from) = &query.date_from {
        criteria.push(format!("SINCE \"{}\"", date_from.format("%d-%b-%Y")));
    }
    
    if let Some(date_to) = &query.date_to {
        criteria.push(format!("BEFORE \"{}\"", date_to.format("%d-%b-%Y")));
    }
    
    if query.has_attachment == Some(true) {
        criteria.push("HAS ATTACHMENT".to_string());
    }
    
    if query.is_unread == Some(true) {
        criteria.push("UNSEEN".to_string());
    }
    
    if query.is_flagged == Some(true) {
        criteria.push("FLAGGED".to_string());
    }
    
    if criteria.is_empty() {
        "ALL".to_string()
    } else {
        criteria.join(" ")
    }
}