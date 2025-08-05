use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::api::path::document_dir;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use anyhow::Result;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Document {
    pub id: String,
    pub title: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub word_count: usize,
    pub character_count: usize,
    pub file_path: String,
    pub tags: Vec<String>,
    pub template: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DocumentInfo {
    pub id: String,
    pub title: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub word_count: usize,
    pub file_path: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub documents: Vec<DocumentInfo>,
    pub total: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WordCountResult {
    pub words: usize,
    pub characters: usize,
    pub characters_no_spaces: usize,
    pub paragraphs: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FindReplaceResult {
    pub replaced_count: usize,
    pub content: String,
}

fn get_documents_dir() -> Result<PathBuf> {
    let mut path = document_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("CopilotDoc");
    if !path.exists() {
        fs::create_dir_all(&path)?;
    }
    Ok(path)
}

fn calculate_word_count(content: &str) -> WordCountResult {
    let words = content.split_whitespace().count();
    let characters = content.chars().count();
    let characters_no_spaces = content.chars().filter(|c| !c.is_whitespace()).count();
    let paragraphs = content.split("\n\n").filter(|p| !p.trim().is_empty()).count();
    
    WordCountResult {
        words,
        characters,
        characters_no_spaces,
        paragraphs,
    }
}

#[tauri::command]
pub async fn create_document(title: String, template: Option<String>) -> Result<Document, String> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let documents_dir = get_documents_dir().map_err(|e| e.to_string())?;
    let file_path = documents_dir.join(format!("{}.json", id));
    
    let content = match template {
        Some(template_name) => get_template_content(&template_name),
        None => String::new(),
    };
    
    let word_count_result = calculate_word_count(&content);
    
    let document = Document {
        id: id.clone(),
        title,
        content: content.clone(),
        created_at: now,
        updated_at: now,
        word_count: word_count_result.words,
        character_count: word_count_result.characters,
        file_path: file_path.to_string_lossy().to_string(),
        tags: Vec::new(),
        template,
    };
    
    let json = serde_json::to_string_pretty(&document).map_err(|e| e.to_string())?;
    fs::write(&file_path, json).map_err(|e| e.to_string())?;
    
    Ok(document)
}

#[tauri::command]
pub async fn save_document(id: String, title: String, content: String, tags: Vec<String>) -> Result<Document, String> {
    let documents_dir = get_documents_dir().map_err(|e| e.to_string())?;
    let file_path = documents_dir.join(format!("{}.json", id));
    
    if !file_path.exists() {
        return Err("Document not found".to_string());
    }
    
    let existing_content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let mut document: Document = serde_json::from_str(&existing_content).map_err(|e| e.to_string())?;
    
    let word_count_result = calculate_word_count(&content);
    
    document.title = title;
    document.content = content;
    document.tags = tags;
    document.updated_at = Utc::now();
    document.word_count = word_count_result.words;
    document.character_count = word_count_result.characters;
    
    let json = serde_json::to_string_pretty(&document).map_err(|e| e.to_string())?;
    fs::write(&file_path, json).map_err(|e| e.to_string())?;
    
    // Create backup
    create_backup_internal(&document).ok();
    
    Ok(document)
}

#[tauri::command]
pub async fn load_document(id: String) -> Result<Document, String> {
    let documents_dir = get_documents_dir().map_err(|e| e.to_string())?;
    let file_path = documents_dir.join(format!("{}.json", id));
    
    if !file_path.exists() {
        return Err("Document not found".to_string());
    }
    
    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let document: Document = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    Ok(document)
}

#[tauri::command]
pub async fn delete_document(id: String) -> Result<bool, String> {
    let documents_dir = get_documents_dir().map_err(|e| e.to_string())?;
    let file_path = documents_dir.join(format!("{}.json", id));
    
    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| e.to_string())?;
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub async fn list_documents() -> Result<Vec<DocumentInfo>, String> {
    let documents_dir = get_documents_dir().map_err(|e| e.to_string())?;
    let mut documents = Vec::new();
    
    if let Ok(entries) = fs::read_dir(&documents_dir) {
        for entry in entries.flatten() {
            if let Some(extension) = entry.path().extension() {
                if extension == "json" {
                    if let Ok(content) = fs::read_to_string(entry.path()) {
                        if let Ok(document) = serde_json::from_str::<Document>(&content) {
                            documents.push(DocumentInfo {
                                id: document.id,
                                title: document.title,
                                created_at: document.created_at,
                                updated_at: document.updated_at,
                                word_count: document.word_count,
                                file_path: document.file_path,
                                tags: document.tags,
                            });
                        }
                    }
                }
            }
        }
    }
    
    // Sort by updated_at descending
    documents.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    
    Ok(documents)
}

#[tauri::command]
pub async fn get_document_info(id: String) -> Result<DocumentInfo, String> {
    let document = load_document(id).await?;
    Ok(DocumentInfo {
        id: document.id,
        title: document.title,
        created_at: document.created_at,
        updated_at: document.updated_at,
        word_count: document.word_count,
        file_path: document.file_path,
        tags: document.tags,
    })
}

#[tauri::command]
pub async fn search_documents(query: String, limit: Option<usize>) -> Result<SearchResult, String> {
    let documents = list_documents().await?;
    let query_lower = query.to_lowercase();
    
    let filtered: Vec<DocumentInfo> = documents
        .into_iter()
        .filter(|doc| {
            doc.title.to_lowercase().contains(&query_lower) ||
            doc.tags.iter().any(|tag| tag.to_lowercase().contains(&query_lower))
        })
        .take(limit.unwrap_or(50))
        .collect();
    
    let total = filtered.len();
    
    Ok(SearchResult {
        documents: filtered,
        total,
    })
}

#[tauri::command]
pub async fn get_word_count(content: String) -> Result<WordCountResult, String> {
    Ok(calculate_word_count(&content))
}

#[tauri::command]
pub async fn get_reading_time(content: String) -> Result<f64, String> {
    let word_count = calculate_word_count(&content).words;
    // Average reading speed: 200-250 words per minute
    let reading_time = word_count as f64 / 225.0;
    Ok(reading_time)
}

#[tauri::command]
pub async fn find_and_replace(content: String, find: String, replace: String, replace_all: bool) -> Result<FindReplaceResult, String> {
    let result = if replace_all {
        content.replace(&find, &replace)
    } else {
        content.replacen(&find, &replace, 1)
    };
    
    let replaced_count = if replace_all {
        content.matches(&find).count()
    } else {
        if content.contains(&find) { 1 } else { 0 }
    };
    
    Ok(FindReplaceResult {
        replaced_count,
        content: result,
    })
}

#[tauri::command]
pub async fn create_backup(id: String) -> Result<String, String> {
    let document = load_document(id).await?;
    create_backup_internal(&document).map_err(|e| e.to_string())
}

fn create_backup_internal(document: &Document) -> Result<String> {
    let documents_dir = get_documents_dir()?;
    let backup_dir = documents_dir.join("backups");
    if !backup_dir.exists() {
        fs::create_dir_all(&backup_dir)?;
    }
    
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let backup_filename = format!("{}_{}.json", document.id, timestamp);
    let backup_path = backup_dir.join(backup_filename);
    
    let json = serde_json::to_string_pretty(document)?;
    fs::write(&backup_path, json)?;
    
    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn restore_backup(backup_path: String) -> Result<Document, String> {
    let path = Path::new(&backup_path);
    if !path.exists() {
        return Err("Backup file not found".to_string());
    }
    
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let document: Document = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    
    // Save as current document
    let documents_dir = get_documents_dir().map_err(|e| e.to_string())?;
    let file_path = documents_dir.join(format!("{}.json", document.id));
    fs::write(&file_path, content).map_err(|e| e.to_string())?;
    
    Ok(document)
}

#[tauri::command]
pub async fn get_document_history(id: String) -> Result<Vec<String>, String> {
    let documents_dir = get_documents_dir().map_err(|e| e.to_string())?;
    let backup_dir = documents_dir.join("backups");
    let mut backups = Vec::new();
    
    if let Ok(entries) = fs::read_dir(&backup_dir) {
        for entry in entries.flatten() {
            if let Some(filename) = entry.file_name().to_str() {
                if filename.starts_with(&format!("{}_", id)) && filename.ends_with(".json") {
                    backups.push(entry.path().to_string_lossy().to_string());
                }
            }
        }
    }
    
    backups.sort();
    backups.reverse(); // Most recent first
    
    Ok(backups)
}

fn get_template_content(template_name: &str) -> String {
    match template_name {
        "letter" => include_str!("../templates/letter.html").to_string(),
        "report" => include_str!("../templates/report.html").to_string(),
        "essay" => include_str!("../templates/essay.html").to_string(),
        "memo" => include_str!("../templates/memo.html").to_string(),
        "meeting_notes" => include_str!("../templates/meeting_notes.html").to_string(),
        _ => String::new(),
    }
}