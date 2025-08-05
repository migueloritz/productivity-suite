use crate::email_service::{ComposeEmailData, EmailAddressData, AttachmentData};
use anyhow::{Result, anyhow};
use mail_builder::MessageBuilder;
use mail_builder::headers::address::Address;
use async_std::net::TcpStream;
use uuid::Uuid;
use base64::{Engine as _, engine::general_purpose};

pub struct SmtpClient {
    server: String,
    port: u16,
    use_tls: bool,
    username: String,
    password: String,
}

impl SmtpClient {
    pub async fn new(
        server: &str,
        port: u16,
        use_tls: bool,
        username: &str,
        password: &str,
    ) -> Result<Self> {
        let client = Self {
            server: server.to_string(),
            port,
            use_tls,
            username: username.to_string(),
            password: password.to_string(),
        };

        // Test connection
        client.test_connection().await?;
        
        Ok(client)
    }

    async fn test_connection(&self) -> Result<()> {
        // Simple connection test
        let _stream = TcpStream::connect(format!("{}:{}", self.server, self.port)).await?;
        Ok(())
    }

    pub async fn send_email(&mut self, email_data: ComposeEmailData) -> Result<String> {
        let message_id = format!("<{}>", Uuid::new_v4().to_string());
        
        let mut message_builder = MessageBuilder::new()
            .message_id(&message_id)
            .subject(&email_data.subject);

        // Set From header
        message_builder = message_builder.from((&self.username, self.username.as_str()));

        // Set To recipients
        for to_addr in &email_data.to {
            let addr = if let Some(name) = &to_addr.name {
                Address::new_address(name.clone(), to_addr.address.clone())
            } else {
                Address::new_address(to_addr.address.clone(), to_addr.address.clone())
            };
            message_builder = message_builder.to(addr);
        }

        // Set CC recipients
        if let Some(cc_list) = &email_data.cc {
            for cc_addr in cc_list {
                let addr = if let Some(name) = &cc_addr.name {
                    Address::new_address(name.clone(), cc_addr.address.clone())
                } else {
                    Address::new_address(cc_addr.address.clone(), cc_addr.address.clone())
                };
                message_builder = message_builder.cc(addr);
            }
        }

        // Set BCC recipients
        if let Some(bcc_list) = &email_data.bcc {
            for bcc_addr in bcc_list {
                let addr = if let Some(name) = &bcc_addr.name {
                    Address::new_address(name.clone(), bcc_addr.address.clone())
                } else {
                    Address::new_address(bcc_addr.address.clone(), bcc_addr.address.clone())
                };
                message_builder = message_builder.bcc(addr);
            }
        }

        // Set priority
        if let Some(priority) = &email_data.priority {
            let priority_value = match priority.as_str() {
                "high" => "1 (Highest)",
                "low" => "5 (Lowest)",
                _ => "3 (Normal)",
            };
            message_builder = message_builder.header("X-Priority", priority_value);
        }

        // Set read receipt
        if email_data.request_read_receipt == Some(true) {
            message_builder = message_builder.header("Disposition-Notification-To", &self.username);
        }

        // Set reply-to if this is a reply
        if let Some(reply_to_id) = &email_data.reply_to_id {
            message_builder = message_builder.in_reply_to(reply_to_id);
        }

        // Add body content
        if let Some(html_body) = &email_data.body_html {
            message_builder = message_builder.html_body(html_body);
        }
        
        if !email_data.body_text.is_empty() {
            message_builder = message_builder.text_body(&email_data.body_text);
        }

        // Add attachments
        for attachment in &email_data.attachments {
            message_builder = message_builder.binary_attachment(
                &attachment.mime_type,
                &attachment.filename,
                &attachment.content,
            );
        }

        // Build the message
        let message = message_builder.write_to_vec()?;

        // Send via SMTP
        self.send_raw_message(&message, &email_data).await?;

        Ok(message_id)
    }

    async fn send_raw_message(&self, message: &[u8], email_data: &ComposeEmailData) -> Result<()> {
        use async_std::io::prelude::*;
        
        let tcp_stream = TcpStream::connect(format!("{}:{}", self.server, self.port)).await?;
        
        let mut stream: Box<dyn async_std::io::Write + Send + Unpin> = if self.use_tls {
            let tls_connector = async_native_tls::TlsConnector::new();
            let tls_stream = tls_connector.connect(&self.server, tcp_stream).await?;
            Box::new(tls_stream)
        } else {
            Box::new(tcp_stream)
        };

        // SMTP conversation
        let mut buffer = [0; 1024];
        
        // Read server greeting
        let mut reader = stream.clone();
        reader.read(&mut buffer).await?;
        
        // EHLO command
        let ehlo_cmd = format!("EHLO {}\r\n", self.server);
        stream.write_all(ehlo_cmd.as_bytes()).await?;
        reader.read(&mut buffer).await?;

        // STARTTLS if not using TLS connection
        if !self.use_tls && self.port != 25 {
            stream.write_all(b"STARTTLS\r\n").await?;
            reader.read(&mut buffer).await?;
            
            // Upgrade to TLS
            let tcp_stream = unsafe { std::mem::zeroed() }; // This is a simplified example
            let tls_connector = async_native_tls::TlsConnector::new();
            let tls_stream = tls_connector.connect(&self.server, tcp_stream).await?;
            stream = Box::new(tls_stream);
        }

        // AUTH LOGIN
        stream.write_all(b"AUTH LOGIN\r\n").await?;
        reader.read(&mut buffer).await?;

        // Send username (base64 encoded)
        let username_b64 = general_purpose::STANDARD.encode(&self.username);
        stream.write_all(format!("{}\r\n", username_b64).as_bytes()).await?;
        reader.read(&mut buffer).await?;

        // Send password (base64 encoded)
        let password_b64 = general_purpose::STANDARD.encode(&self.password);
        stream.write_all(format!("{}\r\n", password_b64).as_bytes()).await?;
        reader.read(&mut buffer).await?;

        // MAIL FROM
        let mail_from = format!("MAIL FROM:<{}>\r\n", self.username);
        stream.write_all(mail_from.as_bytes()).await?;
        reader.read(&mut buffer).await?;

        // RCPT TO for each recipient
        for to_addr in &email_data.to {
            let rcpt_to = format!("RCPT TO:<{}>\r\n", to_addr.address);
            stream.write_all(rcpt_to.as_bytes()).await?;
            reader.read(&mut buffer).await?;
        }

        if let Some(cc_list) = &email_data.cc {
            for cc_addr in cc_list {
                let rcpt_to = format!("RCPT TO:<{}>\r\n", cc_addr.address);
                stream.write_all(rcpt_to.as_bytes()).await?;
                reader.read(&mut buffer).await?;
            }
        }

        if let Some(bcc_list) = &email_data.bcc {
            for bcc_addr in bcc_list {
                let rcpt_to = format!("RCPT TO:<{}>\r\n", bcc_addr.address);
                stream.write_all(rcpt_to.as_bytes()).await?;
                reader.read(&mut buffer).await?;
            }
        }

        // DATA command
        stream.write_all(b"DATA\r\n").await?;
        reader.read(&mut buffer).await?;

        // Send message content
        stream.write_all(message).await?;
        stream.write_all(b"\r\n.\r\n").await?;
        reader.read(&mut buffer).await?;

        // QUIT
        stream.write_all(b"QUIT\r\n").await?;
        reader.read(&mut buffer).await?;

        Ok(())
    }

    pub async fn verify_connection(&self) -> Result<bool> {
        self.test_connection().await?;
        Ok(true)
    }
}