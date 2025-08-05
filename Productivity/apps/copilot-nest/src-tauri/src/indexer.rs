use std::path::{Path, PathBuf};
use std::collections::HashMap;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::fs;
use parking_lot::RwLock;
use tantivy::{
    collector::TopDocs,
    doc,
    query::QueryParser,
    schema::{Field, Schema, TEXT, STORED, STRING, DATETIME, U64},
    Index, IndexReader, IndexWriter, ReloadPolicy,
    Document,
};
use walkdir::WalkDir;
use ignore::WalkBuilder;
use chrono::{DateTime, Utc};
use anyhow::{Result, Context};
use uuid::Uuid;
use sha2::{Sha256, Digest};
use crossbeam_channel::{unbounded, Receiver, Sender};
use rayon::prelude::*;

use crate::{AppState, file_service::FileItem};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexingStatus {
    pub is_running: bool,
    pub current_path: Option<String>,
    pub processed_files: u64,
    pub total_files: u64,
    pub errors: Vec<String>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub progress_percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexedDocument {
    pub id: String,
    pub path: String,
    pub title: String,
    pub content: String,
    pub file_type: String,
    pub mime_type: String,
    pub size: u64,
    pub modified_at: DateTime<Utc>,
    pub indexed_at: DateTime<Utc>,
    pub hash: String,
    pub metadata: HashMap<String, serde_json::Value>,
}

pub struct FileIndexer {
    index: Index,
    reader: IndexReader,
    writer: Arc<RwLock<IndexWriter>>,
    schema: Schema,
    fields: IndexFields,
    data_dir: PathBuf,
    status: Arc<RwLock<IndexingStatus>>,
}

struct IndexFields {
    id: Field,
    path: Field,
    title: Field,
    content: Field,
    file_type: Field,
    mime_type: Field,
    size: Field,
    modified_at: Field,
    indexed_at: Field,
    hash: Field,
}

impl FileIndexer {
    pub fn new<P: AsRef<Path>>(data_dir: P) -> Result<Self> {
        let data_dir = data_dir.as_ref().to_path_buf();
        let index_dir = data_dir.join("index");
        
        // Create index directory if it doesn't exist
        std::fs::create_dir_all(&index_dir)
            .with_context(|| format!("Failed to create index directory: {:?}", index_dir))?;
        
        // Define schema
        let mut schema_builder = Schema::builder();
        
        let fields = IndexFields {
            id: schema_builder.add_text_field("id", STRING | STORED),
            path: schema_builder.add_text_field("path", STRING | STORED),
            title: schema_builder.add_text_field("title", TEXT | STORED),
            content: schema_builder.add_text_field("content", TEXT),
            file_type: schema_builder.add_text_field("file_type", STRING | STORED),
            mime_type: schema_builder.add_text_field("mime_type", STRING | STORED),
            size: schema_builder.add_u64_field("size", U64 | STORED),
            modified_at: schema_builder.add_date_field("modified_at", DATETIME | STORED),
            indexed_at: schema_builder.add_date_field("indexed_at", DATETIME | STORED),
            hash: schema_builder.add_text_field("hash", STRING | STORED),
        };
        
        let schema = schema_builder.build();
        
        // Create or open index
        let index = if index_dir.join("meta.json").exists() {
            Index::open_in_dir(&index_dir)
                .with_context(|| format!("Failed to open existing index: {:?}", index_dir))?
        } else {
            Index::create_in_dir(&index_dir, schema.clone())
                .with_context(|| format!("Failed to create new index: {:?}", index_dir))?
        };
        
        let reader = index.reader_builder()
            .reload_policy(ReloadPolicy::OnCommit)
            .try_into()
            .context("Failed to create index reader")?;
        
        let writer = index.writer(50_000_000) // 50MB buffer
            .context("Failed to create index writer")?;
        
        let status = IndexingStatus {
            is_running: false,
            current_path: None,
            processed_files: 0,
            total_files: 0,
            errors: Vec::new(),
            started_at: None,
            completed_at: None,
            progress_percentage: 0.0,
        };
        
        Ok(FileIndexer {
            index,
            reader,
            writer: Arc::new(RwLock::new(writer)),
            schema,
            fields,
            data_dir,
            status: Arc::new(RwLock::new(status)),
        })
    }
    
    pub async fn index_directory<P: AsRef<Path>>(&self, path: P, recursive: bool) -> Result<()> {
        let path = path.as_ref();
        
        // Update status
        {
            let mut status = self.status.write();
            status.is_running = true;
            status.started_at = Some(Utc::now());
            status.current_path = Some(path.to_string_lossy().to_string());
            status.processed_files = 0;
            status.errors.clear();
        }
        
        // Count total files first
        let total_files = self.count_indexable_files(path, recursive).await?;
        self.status.write().total_files = total_files;
        
        // Create channel for parallel processing
        let (sender, receiver): (Sender<PathBuf>, Receiver<PathBuf>) = unbounded();
        
        // Spawn file discovery task
        let sender_clone = sender.clone();
        let path_clone = path.to_path_buf();
        tokio::spawn(async move {
            Self::discover_files(path_clone, recursive, sender_clone).await;
        });
        
        // Process files in parallel
        let mut handles = Vec::new();
        let num_workers = num_cpus::get().min(8); // Limit to 8 workers
        
        for _ in 0..num_workers {
            let receiver_clone = receiver.clone();
            let writer_clone = self.writer.clone();
            let fields_clone = self.fields.clone();
            let status_clone = self.status.clone();
            
            let handle = tokio::spawn(async move {
                while let Ok(file_path) = receiver_clone.recv() {
                    if let Err(e) = Self::index_single_file(
                        &file_path,
                        &writer_clone,
                        &fields_clone,
                        &status_clone
                    ).await {
                        let mut status = status_clone.write();
                        status.errors.push(format!("Error indexing {:?}: {}", file_path, e));
                    }
                }
            });
            
            handles.push(handle);
        }
        
        // Wait for all workers to finish
        for handle in handles {
            handle.await?;
        }
        
        // Commit changes
        {
            let mut writer = self.writer.write();
            writer.commit().context("Failed to commit index changes")?;
        }
        
        // Update final status
        {
            let mut status = self.status.write();
            status.is_running = false;
            status.completed_at = Some(Utc::now());
            status.progress_percentage = 100.0;
        }
        
        Ok(())
    }
    
    async fn count_indexable_files<P: AsRef<Path>>(&self, path: P, recursive: bool) -> Result<u64> {
        let mut count = 0;
        
        let walk_builder = WalkBuilder::new(path.as_ref())
            .max_depth(if recursive { None } else { Some(1) })
            .hidden(false) // Include hidden files for now
            .ignore(true) // Respect .gitignore files
            .build();
        
        for result in walk_builder {
            let entry = result.context("Failed to read directory entry")?;
            if entry.file_type().map(|ft| ft.is_file()).unwrap_or(false) {
                if Self::is_indexable_file(entry.path()) {
                    count += 1;
                }
            }
        }
        
        Ok(count)
    }
    
    async fn discover_files<P: AsRef<Path>>(path: P, recursive: bool, sender: Sender<PathBuf>) {
        let walk_builder = WalkBuilder::new(path.as_ref())
            .max_depth(if recursive { None } else { Some(1) })
            .hidden(false)
            .ignore(true)
            .build();
        
        for result in walk_builder {
            if let Ok(entry) = result {
                if entry.file_type().map(|ft| ft.is_file()).unwrap_or(false) {
                    if Self::is_indexable_file(entry.path()) {
                        if sender.send(entry.path().to_path_buf()).is_err() {
                            break; // Receiver dropped
                        }
                    }
                }
            }
        }
    }
    
    fn is_indexable_file(path: &Path) -> bool {
        // Check file extension
        if let Some(ext) = path.extension() {
            let ext_str = ext.to_string_lossy().to_lowercase();
            matches!(ext_str.as_str(), 
                "txt" | "md" | "rst" | "org" | 
                "html" | "htm" | "xml" | 
                "json" | "yaml" | "yml" | "toml" |
                "js" | "ts" | "jsx" | "tsx" | "py" | "rs" | "go" | "java" | "cpp" | "c" | "h" |
                "css" | "scss" | "sass" | "less" |
                "log" | "conf" | "config" | "ini" |
                "csv" | "tsv" |
                "tex" | "bib"
            )
        } else {
            // Files without extension - check if they're text files
            // This is a simplified check - in practice you'd want to read a few bytes
            true
        }
    }
    
    async fn index_single_file(
        path: &Path,
        writer: &Arc<RwLock<IndexWriter>>,
        fields: &IndexFields,
        status: &Arc<RwLock<IndexingStatus>>,
    ) -> Result<()> {
        // Update current path in status
        {
            let mut status_guard = status.write();
            status_guard.current_path = Some(path.to_string_lossy().to_string());
        }
        
        // Read file content
        let content = match fs::read_to_string(path).await {
            Ok(content) => content,
            Err(_) => {
                // Try reading as bytes and detecting encoding
                let bytes = fs::read(path).await?;
                let (decoded, _, _) = encoding_rs::UTF_8.decode(&bytes);
                decoded.to_string()
            }
        };
        
        // Get file metadata
        let metadata = fs::metadata(path).await?;
        let file_item = FileItem::from_path(path).await?;
        
        // Calculate hash
        let mut hasher = Sha256::new();
        hasher.update(content.as_bytes());
        let hash = format!("{:x}", hasher.finalize());
        
        // Create document
        let doc_id = Uuid::new_v4().to_string();
        let title = path.file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        
        let now = Utc::now();
        let modified_at = file_item.modified_at;
        
        let mut doc = Document::new();
        doc.add_text(fields.id, &doc_id);
        doc.add_text(fields.path, &path.to_string_lossy());
        doc.add_text(fields.title, &title);
        doc.add_text(fields.content, &content);
        doc.add_text(fields.file_type, &file_item.file_type);
        doc.add_text(fields.mime_type, &file_item.mime_type);
        doc.add_u64(fields.size, file_item.size);
        doc.add_date(fields.modified_at, modified_at);
        doc.add_date(fields.indexed_at, now);
        doc.add_text(fields.hash, &hash);
        
        // Add document to index
        {
            let mut writer_guard = writer.write();
            writer_guard.add_document(doc)?;
        }
        
        // Update progress
        {
            let mut status_guard = status.write();
            status_guard.processed_files += 1;
            if status_guard.total_files > 0 {
                status_guard.progress_percentage = 
                    (status_guard.processed_files as f64 / status_guard.total_files as f64) * 100.0;
            }
        }
        
        Ok(())
    }
    
    pub fn get_status(&self) -> IndexingStatus {
        self.status.read().clone()
    }
    
    pub async fn rebuild_index(&self) -> Result<()> {
        // Clear existing index
        {
            let mut writer = self.writer.write();
            writer.delete_all_documents()?;
            writer.commit()?;
        }
        
        // Rebuild from common directories
        // This is a simplified approach - in practice you'd want to track indexed directories
        let common_dirs = [
            dirs::home_dir(),
            dirs::document_dir(),
            dirs::desktop_dir(),
        ];
        
        for dir_opt in &common_dirs {
            if let Some(dir) = dir_opt {
                if dir.exists() {
                    if let Err(e) = self.index_directory(dir, true).await {
                        log::warn!("Failed to index directory {:?}: {}", dir, e);
                    }
                }
            }
        }
        
        Ok(())
    }
    
    pub async fn shutdown(self) -> Result<()> {
        // Commit any pending changes
        {
            let mut writer = self.writer.write();
            writer.commit()?;
        }
        
        // Update status
        {
            let mut status = self.status.write();
            status.is_running = false;
        }
        
        Ok(())
    }
}

// Make IndexFields cloneable for use in async tasks
impl Clone for IndexFields {
    fn clone(&self) -> Self {
        IndexFields {
            id: self.id,
            path: self.path,
            title: self.title,
            content: self.content,
            file_type: self.file_type,
            mime_type: self.mime_type,
            size: self.size,
            modified_at: self.modified_at,
            indexed_at: self.indexed_at,
            hash: self.hash,
        }
    }
}

// Tauri commands
#[tauri::command]
pub async fn index_directory(
    path: String,
    recursive: Option<bool>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let indexer_guard = state.indexer.lock();
    if let Some(indexer) = indexer_guard.as_ref() {
        indexer.index_directory(&path, recursive.unwrap_or(false))
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Indexer not initialized".to_string())
    }
}

#[tauri::command]
pub async fn index_file(
    path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let indexer_guard = state.indexer.lock();
    if let Some(indexer) = indexer_guard.as_ref() {
        // For single file indexing, we create a temporary directory list
        let parent = Path::new(&path).parent()
            .ok_or("File has no parent directory")?;
        
        indexer.index_directory(parent, false)
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Indexer not initialized".to_string())
    }
}

#[tauri::command]
pub async fn get_indexing_status(
    state: State<'_, AppState>,
) -> Result<IndexingStatus, String> {
    let indexer_guard = state.indexer.lock();
    if let Some(indexer) = indexer_guard.as_ref() {
        Ok(indexer.get_status())
    } else {
        Err("Indexer not initialized".to_string())
    }
}

#[tauri::command]
pub async fn rebuild_index(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let indexer_guard = state.indexer.lock();
    if let Some(indexer) = indexer_guard.as_ref() {
        indexer.rebuild_index()
            .await
            .map_err(|e| e.to_string())
    } else {
        Err("Indexer not initialized".to_string())
    }
}