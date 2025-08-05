use anyhow::{Result, anyhow};
use chrono::{DateTime, Utc};
use mail_parser::{Message, MessageParser, Addr, HeaderValue};
use uuid::Uuid;
use regex::Regex;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct ParsedAddress {
    pub name: Option<String>,
    pub address: String,
}

#[derive(Debug, Clone)]
pub struct ParsedAttachment {
    pub id: String,
    pub filename: String,
    pub mime_type: String,
    pub size: u64,
    pub content_id: Option<String>,
    pub is_inline: bool,
    pub content: Option<Vec<u8>>,
}

#[derive(Debug, Clone)]
pub struct ParsedEmail {
    pub message_id: Option<String>,
    pub thread_id: Option<String>,
    pub subject: Option<String>,
    pub from: Option<ParsedAddress>,
    pub to: Vec<ParsedAddress>,
    pub cc: Vec<ParsedAddress>,
    pub bcc: Vec<ParsedAddress>,
    pub reply_to: Option<ParsedAddress>,
    pub date: Option<DateTime<Utc>>,
    pub received_date: Option<DateTime<Utc>>,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub attachments: Vec<ParsedAttachment>,
    pub headers: HashMap<String, String>,
    pub references: Vec<String>,
    pub in_reply_to: Option<String>,
}

pub fn parse_email(raw_message: &[u8]) -> Result<ParsedEmail> {
    let message = MessageParser::default()
        .parse(raw_message)
        .ok_or_else(|| anyhow!("Failed to parse email"))?;

    let mut parsed = ParsedEmail {
        message_id: None,
        thread_id: None,
        subject: None,
        from: None,
        to: Vec::new(),
        cc: Vec::new(),
        bcc: Vec::new(),
        reply_to: None,
        date: None,
        received_date: None,
        body_text: None,
        body_html: None,
        attachments: Vec::new(),
        headers: HashMap::new(),
        references: Vec::new(),
        in_reply_to: None,
    };

    // Parse headers
    parse_headers(&message, &mut parsed)?;
    
    // Parse body content
    parse_body(&message, &mut parsed)?;
    
    // Parse attachments
    parse_attachments(&message, &mut parsed)?;
    
    // Extract thread ID from references or message ID
    extract_thread_id(&mut parsed);

    Ok(parsed)
}

fn parse_headers(message: &Message, parsed: &mut ParsedEmail) -> Result<()> {
    // Message ID
    if let Some(HeaderValue::Text(msg_id)) = message.header("Message-ID") {
        parsed.message_id = Some(clean_message_id(msg_id));
    }

    // Subject
    if let Some(HeaderValue::Text(subject)) = message.header("Subject") {
        parsed.subject = Some(decode_header(subject));
    }

    // From
    if let Some(HeaderValue::Address(addr_list)) = message.header("From") {
        if let Some(addr) = addr_list.first() {
            parsed.from = Some(convert_address(addr));
        }
    }

    // To
    if let Some(HeaderValue::Address(addr_list)) = message.header("To") {
        parsed.to = addr_list.iter().map(convert_address).collect();
    }

    // CC
    if let Some(HeaderValue::Address(addr_list)) = message.header("Cc") {
        parsed.cc = addr_list.iter().map(convert_address).collect();
    }

    // BCC
    if let Some(HeaderValue::Address(addr_list)) = message.header("Bcc") {
        parsed.bcc = addr_list.iter().map(convert_address).collect();
    }

    // Reply-To
    if let Some(HeaderValue::Address(addr_list)) = message.header("Reply-To") {
        if let Some(addr) = addr_list.first() {
            parsed.reply_to = Some(convert_address(addr));
        }
    }

    // Date
    if let Some(HeaderValue::DateTime(date)) = message.header("Date") {
        parsed.date = Some(*date);
    }

    // Received date (use the first Received header)
    if let Some(HeaderValue::DateTime(date)) = message.header("Received") {
        parsed.received_date = Some(*date);
    }

    // References
    if let Some(HeaderValue::Text(refs)) = message.header("References") {
        parsed.references = extract_message_ids(refs);
    }

    // In-Reply-To
    if let Some(HeaderValue::Text(reply_to)) = message.header("In-Reply-To") {
        parsed.in_reply_to = Some(clean_message_id(reply_to));
    }

    // Store all headers for reference
    for header in message.headers() {
        if let Some(name) = header.name().as_str() {
            if let Some(value) = header.value().as_text() {
                parsed.headers.insert(name.to_string(), value.to_string());
            }
        }
    }

    Ok(())
}

fn parse_body(message: &Message, parsed: &mut ParsedEmail) -> Result<()> {
    // Get text body
    if let Some(text_body) = message.body_text(0) {
        parsed.body_text = Some(text_body.to_string());
    }

    // Get HTML body
    if let Some(html_body) = message.body_html(0) {
        parsed.body_html = Some(html_body.to_string());
    }

    // If no text body but we have HTML, convert HTML to text
    if parsed.body_text.is_none() && parsed.body_html.is_some() {
        if let Some(html) = &parsed.body_html {
            parsed.body_text = Some(html_to_text(html));
        }
    }

    Ok(())
}

fn parse_attachments(message: &Message, parsed: &mut ParsedEmail) -> Result<()> {
    for attachment in message.attachments() {
        let filename = attachment
            .attachment_name()
            .unwrap_or("untitled")
            .to_string();

        let mime_type = attachment
            .content_type()
            .map(|ct| ct.to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string());

        let content_id = attachment
            .content_id()
            .map(|cid| cid.to_string());

        let is_inline = attachment.is_inline();

        let content = attachment.contents().to_vec();
        let size = content.len() as u64;

        parsed.attachments.push(ParsedAttachment {
            id: Uuid::new_v4().to_string(),
            filename,
            mime_type,
            size,
            content_id,
            is_inline,
            content: Some(content),
        });
    }

    Ok(())
}

fn convert_address(addr: &Addr) -> ParsedAddress {
    ParsedAddress {
        name: addr.name().map(|s| s.to_string()),
        address: addr.address().unwrap_or("").to_string(),
    }
}

fn clean_message_id(msg_id: &str) -> String {
    msg_id.trim_matches(|c| c == '<' || c == '>').to_string()
}

fn extract_message_ids(refs: &str) -> Vec<String> {
    let re = Regex::new(r"<([^>]+)>").unwrap();
    re.captures_iter(refs)
        .map(|cap| cap[1].to_string())
        .collect()
}

fn extract_thread_id(parsed: &mut ParsedEmail) {
    // Use the first reference as thread ID, or the message ID if no references
    if !parsed.references.is_empty() {
        parsed.thread_id = Some(parsed.references[0].clone());
    } else if let Some(in_reply_to) = &parsed.in_reply_to {
        parsed.thread_id = Some(in_reply_to.clone());
    } else if let Some(msg_id) = &parsed.message_id {
        parsed.thread_id = Some(msg_id.clone());
    }
}

fn decode_header(header: &str) -> String {
    // Simple header decoding - in a real implementation, you'd want to handle
    // RFC 2047 encoded-word decoding properly
    header.to_string()
}

fn html_to_text(html: &str) -> String {
    // Use html2text crate for better HTML to text conversion
    html2text::from_read(html.as_bytes(), 80)
}

pub fn parse_address_list(addresses: &str) -> Result<Vec<ParsedAddress>> {
    let parser = MessageParser::default();
    if let Some(HeaderValue::Address(addr_list)) = parser.parse_header_value("To", addresses.as_bytes()) {
        Ok(addr_list.iter().map(convert_address).collect())
    } else {
        // Fallback: simple parsing
        let addresses: Vec<ParsedAddress> = addresses
            .split(',')
            .map(|addr| {
                let addr = addr.trim();
                if let Some(captures) = Regex::new(r#"^(.*?)\s*<(.+?)>$"#).unwrap().captures(addr) {
                    ParsedAddress {
                        name: Some(captures[1].trim_matches('"').trim().to_string()),
                        address: captures[2].to_string(),
                    }
                } else {
                    ParsedAddress {
                        name: None,
                        address: addr.to_string(),
                    }
                }
            })
            .collect();
        
        Ok(addresses)
    }
}

pub fn build_thread_id(references: &[String], in_reply_to: Option<&str>) -> Option<String> {
    if !references.is_empty() {
        Some(references[0].clone())
    } else {
        in_reply_to.map(|s| s.to_string())
    }
}

pub fn extract_calendar_events(body: &str) -> Vec<CalendarEvent> {
    let mut events = Vec::new();
    
    // Simple event extraction patterns
    let patterns = [
        r"(?i)meeting\s+(?:on\s+)?(\d{1,2}/\d{1,2}/\d{4})\s+(?:at\s+)?(\d{1,2}:\d{2}(?:\s*[AP]M)?)",
        r"(?i)appointment\s+(?:on\s+)?(\d{1,2}/\d{1,2}/\d{4})\s+(?:at\s+)?(\d{1,2}:\d{2}(?:\s*[AP]M)?)",
        r"(?i)conference\s+(?:on\s+)?(\d{1,2}/\d{1,2}/\d{4})\s+(?:at\s+)?(\d{1,2}:\d{2}(?:\s*[AP]M)?)",
    ];
    
    for pattern in &patterns {
        if let Ok(re) = Regex::new(pattern) {
            for captures in re.captures_iter(body) {
                if let (Some(date_str), Some(time_str)) = (captures.get(1), captures.get(2)) {
                    if let Ok(datetime) = parse_date_time(date_str.as_str(), time_str.as_str()) {
                        events.push(CalendarEvent {
                            title: "Extracted Event".to_string(),
                            start_date: datetime,
                            end_date: datetime + chrono::Duration::hours(1), // Default 1 hour duration
                            location: None,
                            description: None,
                            attendees: Vec::new(),
                            confidence: 0.7,
                        });
                    }
                }
            }
        }
    }
    
    events
}

#[derive(Debug, Clone)]
pub struct CalendarEvent {
    pub title: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub location: Option<String>,
    pub description: Option<String>,
    pub attendees: Vec<ParsedAddress>,
    pub confidence: f64,
}

fn parse_date_time(date_str: &str, time_str: &str) -> Result<DateTime<Utc>> {
    // Simple date/time parsing - in a real implementation, use a proper date parser
    use chrono::NaiveDateTime;
    
    let datetime_str = format!("{} {}", date_str, time_str);
    let formats = [
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y %I:%M %p",
        "%m/%d/%Y %I:%M%p",
    ];
    
    for format in &formats {
        if let Ok(dt) = NaiveDateTime::parse_from_str(&datetime_str, format) {
            return Ok(dt.and_utc());
        }
    }
    
    Err(anyhow!("Failed to parse date/time: {}", datetime_str))
}

pub fn detect_email_tone(body: &str) -> EmailTone {
    let body_lower = body.to_lowercase();
    
    // Urgent indicators
    let urgent_words = ["urgent", "asap", "immediately", "emergency", "critical", "deadline"];
    let urgent_score = urgent_words.iter()
        .map(|word| body_lower.matches(word).count())
        .sum::<usize>() as f64;
    
    // Professional indicators
    let professional_words = ["dear", "sincerely", "regards", "please", "thank you", "appreciate"];
    let professional_score = professional_words.iter()
        .map(|word| body_lower.matches(word).count())
        .sum::<usize>() as f64;
    
    // Casual indicators
    let casual_words = ["hey", "hi", "thanks", "cool", "awesome", "yeah"];
    let casual_score = casual_words.iter()
        .map(|word| body_lower.matches(word).count())
        .sum::<usize>() as f64;
    
    // Determine tone based on scores
    if urgent_score > 0.0 {
        EmailTone {
            tone_type: "urgent".to_string(),
            confidence: (urgent_score / (urgent_score + professional_score + casual_score)).min(1.0),
            suggestions: Vec::new(),
        }
    } else if professional_score > casual_score {
        EmailTone {
            tone_type: "professional".to_string(),
            confidence: (professional_score / (professional_score + casual_score)).min(1.0),
            suggestions: Vec::new(),
        }
    } else if casual_score > 0.0 {
        EmailTone {
            tone_type: "casual".to_string(),
            confidence: (casual_score / (professional_score + casual_score)).min(1.0),
            suggestions: Vec::new(),
        }
    } else {
        EmailTone {
            tone_type: "neutral".to_string(),
            confidence: 0.5,
            suggestions: Vec::new(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct EmailTone {
    pub tone_type: String,
    pub confidence: f64,
    pub suggestions: Vec<String>,
}