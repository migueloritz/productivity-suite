use anyhow::{Result, anyhow};
use async_imap::Client;
use async_std::net::TcpStream;
use async_imap::types::{Fetch, Mailbox, Name};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone)]
pub struct ImapMessage {
    pub uid: u32,
    pub flags: Vec<String>,
    pub labels: Vec<String>,
    pub body: Vec<u8>,
    pub size: u64,
}

#[derive(Debug, Clone)]
pub struct FolderInfo {
    pub name: String,
    pub delimiter: Option<String>,
    pub attributes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderStats {
    pub total: u32,
    pub recent: u32,
    pub unseen: u32,
}

pub struct ImapClient {
    client: Option<async_imap::Session<async_std::net::TcpStream>>,
    server: String,
    port: u16,
    use_tls: bool,
}

impl ImapClient {
    pub async fn new(server: &str, port: u16, use_tls: bool) -> Result<Self> {
        Ok(Self {
            client: None,
            server: server.to_string(),
            port,
            use_tls,
        })
    }

    pub async fn login(&mut self, username: &str, password: &str) -> Result<()> {
        let tcp_stream = TcpStream::connect(format!("{}:{}", self.server, self.port)).await?;
        
        let client = if self.use_tls {
            let tls_connector = async_native_tls::TlsConnector::new();
            let tls_stream = tls_connector.connect(&self.server, tcp_stream).await?;
            async_imap::Client::new(tls_stream)
        } else {
            async_imap::Client::new(tcp_stream)
        };

        let mut session = client
            .login(username, password)
            .await
            .map_err(|e| anyhow!("Login failed: {:?}", e.0))?;

        // Check if we need to enable additional capabilities
        if let Ok(capabilities) = session.capabilities().await {
            if capabilities.has_str("IDLE") {
                // Enable IDLE if supported
            }
            if capabilities.has_str("CONDSTORE") {
                // Enable CONDSTORE if supported
            }
        }

        self.client = Some(session);
        Ok(())
    }

    pub async fn logout(&mut self) -> Result<()> {
        if let Some(mut session) = self.client.take() {
            session.logout().await?;
        }
        Ok(())
    }

    pub async fn list_folders(&mut self) -> Result<Vec<FolderInfo>> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        let folders = session.list(None, Some("*")).await?;
        let mut folder_info = Vec::new();
        
        for folder in folders {
            folder_info.push(FolderInfo {
                name: folder.name().to_string(),
                delimiter: folder.delimiter().map(|d| d.to_string()),
                attributes: folder.attributes().iter().map(|a| format!("{:?}", a)).collect(),
            });
        }
        
        Ok(folder_info)
    }

    pub async fn select_folder(&mut self, folder_name: &str) -> Result<Mailbox> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        let mailbox = session.select(folder_name).await?;
        Ok(mailbox)
    }

    pub async fn get_folder_stats(&mut self, folder_name: &str) -> Result<FolderStats> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        let status = session.status(folder_name, "(MESSAGES RECENT UNSEEN)").await?;
        
        Ok(FolderStats {
            total: status.messages.unwrap_or(0),
            recent: status.recent.unwrap_or(0),
            unseen: status.unseen.unwrap_or(0),
        })
    }

    pub async fn search(&mut self, criteria: &str) -> Result<Vec<u32>> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        let search_result = session.search(criteria).await?;
        Ok(search_result)
    }

    pub async fn fetch_message(&mut self, uid: u32) -> Result<ImapMessage> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        let messages = session
            .fetch(uid.to_string(), "(FLAGS BODY[] RFC822.SIZE)")
            .await?;
        
        if let Some(message) = messages.first() {
            let flags = message
                .flags()
                .iter()
                .map(|f| format!("{:?}", f))
                .collect();
            
            let body = message
                .body()
                .unwrap_or(&[])
                .to_vec();
            
            let size = message
                .rfc822_size()
                .unwrap_or(0) as u64;

            Ok(ImapMessage {
                uid,
                flags,
                labels: Vec::new(), // IMAP doesn't have labels by default
                body,
                size,
            })
        } else {
            Err(anyhow!("Message not found"))
        }
    }

    pub async fn fetch_messages(&mut self, sequence: &str) -> Result<Vec<ImapMessage>> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        let messages = session
            .fetch(sequence, "(FLAGS BODY[] RFC822.SIZE)")
            .await?;
        
        let mut result = Vec::new();
        
        for message in messages {
            let uid = message.uid.unwrap_or(0);
            let flags = message
                .flags()
                .iter()
                .map(|f| format!("{:?}", f))
                .collect();
            
            let body = message
                .body()
                .unwrap_or(&[])
                .to_vec();
            
            let size = message
                .rfc822_size()
                .unwrap_or(0) as u64;

            result.push(ImapMessage {
                uid,
                flags,
                labels: Vec::new(),
                body,
                size,
            });
        }
        
        Ok(result)
    }

    pub async fn add_flags(&mut self, uid: u32, flags: &[&str]) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        let flag_list = flags.join(" ");
        session
            .store(uid.to_string(), format!("+FLAGS ({})", flag_list))
            .await?;
        
        Ok(())
    }

    pub async fn remove_flags(&mut self, uid: u32, flags: &[&str]) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        let flag_list = flags.join(" ");
        session
            .store(uid.to_string(), format!("-FLAGS ({})", flag_list))
            .await?;
        
        Ok(())
    }

    pub async fn move_message(&mut self, uid: u32, destination_folder: &str) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        // Check if server supports MOVE extension
        if let Ok(capabilities) = session.capabilities().await {
            if capabilities.has_str("MOVE") {
                session.r#move(uid.to_string(), destination_folder).await?;
                return Ok(());
            }
        }
        
        // Fallback: Copy and mark as deleted
        session.copy(uid.to_string(), destination_folder).await?;
        self.add_flags(uid, &["\\Deleted"]).await?;
        
        Ok(())
    }

    pub async fn copy_message(&mut self, uid: u32, destination_folder: &str) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        session.copy(uid.to_string(), destination_folder).await?;
        Ok(())
    }

    pub async fn expunge(&mut self) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        session.expunge().await?;
        Ok(())
    }

    pub async fn download_attachment(&mut self, uid: u32, attachment_id: &str) -> Result<Vec<u8>> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        // Fetch the specific body part for the attachment
        let fetch_query = format!("BODY[{}]", attachment_id);
        let messages = session
            .fetch(uid.to_string(), &fetch_query)
            .await?;
        
        if let Some(message) = messages.first() {
            if let Some(body) = message.body() {
                return Ok(body.to_vec());
            }
        }
        
        Err(anyhow!("Attachment not found"))
    }

    pub async fn append_message(
        &mut self,
        folder: &str,
        flags: &[&str],
        date: Option<&str>,
        message: &[u8],
    ) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        let flag_list = if flags.is_empty() {
            None
        } else {
            Some(flags.join(" "))
        };
        
        session
            .append(folder, message)
            .flags(flag_list)
            .date(date)
            .await?;
        
        Ok(())
    }

    pub async fn idle(&mut self) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        // Check if IDLE is supported
        if let Ok(capabilities) = session.capabilities().await {
            if capabilities.has_str("IDLE") {
                // Start IDLE mode - this will block until new messages arrive
                let mut idle = session.idle().await?;
                
                // Wait for notifications
                if let Some(_response) = idle.wait_keepalive().await? {
                    // New message received or folder changed
                }
                
                idle.done().await?;
                return Ok(());
            }
        }
        
        Err(anyhow!("IDLE not supported by server"))
    }

    pub async fn create_folder(&mut self, folder_name: &str) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        session.create(folder_name).await?;
        Ok(())
    }

    pub async fn delete_folder(&mut self, folder_name: &str) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        session.delete(folder_name).await?;
        Ok(())
    }

    pub async fn rename_folder(&mut self, old_name: &str, new_name: &str) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        session.rename(old_name, new_name).await?;
        Ok(())
    }

    pub async fn subscribe_folder(&mut self, folder_name: &str) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        session.subscribe(folder_name).await?;
        Ok(())
    }

    pub async fn unsubscribe_folder(&mut self, folder_name: &str) -> Result<()> {
        let session = self.client.as_mut().ok_or_else(|| anyhow!("Not connected"))?;
        
        session.unsubscribe(folder_name).await?;
        Ok(())
    }
}