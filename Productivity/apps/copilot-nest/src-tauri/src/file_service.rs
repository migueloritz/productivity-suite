use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::fs;
use tokio::sync::RwLock;
use notify::{RecommendedWatcher, RecursiveMode, Watcher, Event, EventKind};
use walkdir::WalkDir;
use mime_guess;
use chrono::{DateTime, Utc};
use anyhow::{Result, Context};
use uuid::Uuid;

use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub id: String,
    pub name: String,
    pub path: String,
    pub parent_path: Option<String>,
    pub file_type: String,
    pub mime_type: String,
    pub size: u64,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub accessed_at: Option<DateTime<Utc>>,
    pub is_directory: bool,
    pub is_hidden: bool,
    pub permissions: FilePermissions,
    pub children: Option<Vec<FileItem>>,
    pub metadata: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilePermissions {
    pub readable: bool,
    pub writable: bool,
    pub executable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryWatcher {
    pub id: String,
    pub path: String,
    pub recursive: bool,
    pub active: bool,
}

// Global state for file watchers
type WatcherMap = Arc<RwLock<HashMap<String, (RecommendedWatcher, DirectoryWatcher)>>>;
static WATCHERS: once_cell::sync::Lazy<WatcherMap> = 
    once_cell::sync::Lazy::new(|| Arc::new(RwLock::new(HashMap::new())));

// Recent files store
static RECENT_FILES: once_cell::sync::Lazy<Arc<RwLock<Vec<FileItem>>>> = 
    once_cell::sync::Lazy::new(|| Arc::new(RwLock::new(Vec::new())));

impl FileItem {
    pub async fn from_path<P: AsRef<Path>>(path: P) -> Result<Self> {
        let path = path.as_ref();
        let metadata = fs::metadata(path).await
            .with_context(|| format!("Failed to read metadata for {:?}", path))?;
        
        let name = path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        
        let path_str = path.to_string_lossy().to_string();
        let parent_path = path.parent()
            .map(|p| p.to_string_lossy().to_string());
        
        let file_type = if metadata.is_dir() {
            "directory".to_string()
        } else {
            path.extension()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string()
        };
        
        let mime_type = if metadata.is_dir() {
            "inode/directory".to_string()
        } else {
            mime_guess::from_path(path).first_or_octet_stream().to_string()
        };
        
        let created_at = metadata.created()
            .unwrap_or(SystemTime::UNIX_EPOCH)
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let modified_at = metadata.modified()
            .unwrap_or(SystemTime::UNIX_EPOCH)
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let accessed_at = metadata.accessed()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_secs());
        
        let is_hidden = name.starts_with('.');
        
        // Check permissions
        let permissions = FilePermissions {
            readable: true, // Simplified - in real implementation check actual permissions
            writable: !metadata.permissions().readonly(),
            executable: false, // Simplified - platform-specific implementation needed
        };
        
        Ok(FileItem {
            id: Uuid::new_v4().to_string(),
            name,
            path: path_str,
            parent_path,
            file_type,
            mime_type,
            size: metadata.len(),
            created_at: DateTime::from_timestamp(created_at as i64, 0).unwrap_or_default(),
            modified_at: DateTime::from_timestamp(modified_at as i64, 0).unwrap_or_default(),
            accessed_at: accessed_at.and_then(|t| DateTime::from_timestamp(t as i64, 0)),
            is_directory: metadata.is_dir(),
            is_hidden,
            permissions,
            children: None,
            metadata: HashMap::new(),
        })
    }
    
    pub async fn with_children(mut self, max_depth: Option<usize>) -> Result<Self> {
        if !self.is_directory {
            return Ok(self);
        }
        
        let mut children = Vec::new();
        let mut entries = fs::read_dir(&self.path).await
            .with_context(|| format!("Failed to read directory {:?}", self.path))?;
        
        while let Some(entry) = entries.next_entry().await? {
            let child_path = entry.path();
            
            if let Ok(mut child) = FileItem::from_path(&child_path).await {
                // Recursively load children if depth allows
                if let Some(depth) = max_depth {
                    if depth > 0 && child.is_directory {
                        child = child.with_children(Some(depth - 1)).await?;
                    }
                }
                children.push(child);
            }
        }
        
        // Sort children: directories first, then files, both alphabetically
        children.sort_by(|a, b| {
            match (a.is_directory, b.is_directory) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
            }
        });
        
        self.children = Some(children);
        Ok(self)
    }
}

#[tauri::command]
pub async fn read_directory(
    path: String,
    recursive: Option<bool>,
    max_depth: Option<usize>,
) -> Result<FileItem, String> {
    let recursive = recursive.unwrap_or(false);
    let depth = if recursive { max_depth } else { Some(1) };
    
    FileItem::from_path(&path)
        .await
        .and_then(|item| async move { item.with_children(depth).await })
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_file_info(path: String) -> Result<FileItem, String> {
    FileItem::from_path(&path)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn read_file_content(path: String) -> Result<String, String> {
    // Check if file exists and is readable
    let metadata = fs::metadata(&path).await
        .map_err(|e| format!("Failed to access file: {}", e))?;
    
    if metadata.is_dir() {
        return Err("Cannot read content of directory".to_string());
    }
    
    // Check file size (limit to 10MB for safety)
    if metadata.len() > 10 * 1024 * 1024 {
        return Err("File too large to read".to_string());
    }
    
    // Try to read as UTF-8 first
    match fs::read_to_string(&path).await {
        Ok(content) => Ok(content),
        Err(_) => {
            // If UTF-8 fails, read as bytes and try to detect encoding
            let bytes = fs::read(&path).await
                .map_err(|e| format!("Failed to read file: {}", e))?;
            
            // Use encoding_rs to detect and convert encoding
            let (decoded, _, _) = encoding_rs::UTF_8.decode(&bytes);
            Ok(decoded.to_string())
        }
    }
}

#[tauri::command]
pub async fn watch_directory(
    path: String,
    recursive: Option<bool>,
) -> Result<String, String> {
    use notify::Event;
    use std::sync::mpsc;
    
    let recursive = recursive.unwrap_or(false);
    let watcher_id = Uuid::new_v4().to_string();
    
    let (tx, rx) = mpsc::channel();
    
    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        match res {
            Ok(event) => {
                if let Err(e) = tx.send(event) {
                    log::error!("Failed to send file system event: {}", e);
                }
            }
            Err(e) => log::error!("File system watch error: {}", e),
        }
    }).map_err(|e| format!("Failed to create watcher: {}", e))?;
    
    let watch_mode = if recursive {
        RecursiveMode::Recursive
    } else {
        RecursiveMode::NonRecursive
    };
    
    watcher.watch(Path::new(&path), watch_mode)
        .map_err(|e| format!("Failed to start watching: {}", e))?;
    
    let directory_watcher = DirectoryWatcher {
        id: watcher_id.clone(),
        path: path.clone(),
        recursive,
        active: true,
    };
    
    // Store the watcher
    let mut watchers = WATCHERS.write().await;
    watchers.insert(watcher_id.clone(), (watcher, directory_watcher));
    
    // Spawn a task to handle events
    let watcher_id_clone = watcher_id.clone();
    tokio::spawn(async move {
        while let Ok(event) = rx.recv() {
            log::info!("File system event for watcher {}: {:?}", watcher_id_clone, event);
            
            // Here you could emit events to the frontend
            // For now, we just log them
            match event.kind {
                EventKind::Create(_) => log::info!("File created: {:?}", event.paths),
                EventKind::Modify(_) => log::info!("File modified: {:?}", event.paths),
                EventKind::Remove(_) => log::info!("File removed: {:?}", event.paths),
                _ => {}
            }
        }
    });
    
    Ok(watcher_id)
}

#[tauri::command]
pub async fn unwatch_directory(watcher_id: String) -> Result<(), String> {
    let mut watchers = WATCHERS.write().await;
    
    if let Some((mut watcher, _)) = watchers.remove(&watcher_id) {
        // The watcher will be dropped automatically, stopping the watching
        log::info!("Stopped watching directory for watcher: {}", watcher_id);
        Ok(())
    } else {
        Err(format!("Watcher not found: {}", watcher_id))
    }
}

#[tauri::command]
pub async fn get_recent_files(limit: Option<usize>) -> Result<Vec<FileItem>, String> {
    let recent = RECENT_FILES.read().await;
    let limit = limit.unwrap_or(20);
    
    Ok(recent.iter().take(limit).cloned().collect())
}

pub async fn add_to_recent_files(file: FileItem) {
    let mut recent = RECENT_FILES.write().await;
    
    // Remove if already exists
    recent.retain(|f| f.path != file.path);
    
    // Add to front
    recent.insert(0, file);
    
    // Keep only last 100 files
    recent.truncate(100);
}

// Analytics functions
#[tauri::command]
pub async fn get_folder_analytics(path: String) -> Result<serde_json::Value, String> {
    let mut total_files = 0;
    let mut total_size = 0u64;
    let mut file_types = HashMap::new();
    let mut largest_files = Vec::new();
    
    for entry in WalkDir::new(&path).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            total_files += 1;
            
            if let Ok(metadata) = entry.metadata() {
                total_size += metadata.len();
                
                // Track file types
                if let Some(ext) = entry.path().extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    *file_types.entry(ext_str).or_insert(0) += 1;
                }
                
                // Track largest files
                if let Ok(file_item) = FileItem::from_path(entry.path()).await {
                    largest_files.push(file_item);
                }
            }
        }
    }
    
    // Sort largest files by size
    largest_files.sort_by(|a, b| b.size.cmp(&a.size));
    largest_files.truncate(10);
    
    let analytics = serde_json::json!({
        "total_files": total_files,
        "total_size": total_size,
        "file_types": file_types,
        "largest_files": largest_files,
        "analyzed_at": Utc::now(),
    });
    
    Ok(analytics)
}

#[tauri::command]
pub async fn get_file_type_distribution(path: String) -> Result<HashMap<String, u32>, String> {
    let mut file_types = HashMap::new();
    
    for entry in WalkDir::new(&path).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Some(ext) = entry.path().extension() {
                let ext_str = ext.to_string_lossy().to_lowercase();
                *file_types.entry(ext_str).or_insert(0) += 1;
            } else {
                *file_types.entry("no_extension".to_string()).or_insert(0) += 1;
            }
        }
    }
    
    Ok(file_types)
}

#[tauri::command]
pub async fn get_activity_timeline(path: String, days: Option<u32>) -> Result<serde_json::Value, String> {
    let days = days.unwrap_or(30);
    let cutoff = Utc::now() - chrono::Duration::days(days as i64);
    
    let mut timeline = HashMap::new();
    
    for entry in WalkDir::new(&path).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(modified) = metadata.modified() {
                    let modified_utc = DateTime::<Utc>::from(modified);
                    
                    if modified_utc > cutoff {
                        let date_key = modified_utc.format("%Y-%m-%d").to_string();
                        *timeline.entry(date_key).or_insert(0) += 1;
                    }
                }
            }
        }
    }
    
    Ok(serde_json::json!({
        "timeline": timeline,
        "period_days": days,
        "generated_at": Utc::now(),
    }))
}