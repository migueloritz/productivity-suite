use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{command, AppHandle, State};
use walkdir::WalkDir;
use notify::{Watcher, RecursiveMode, Event};
use std::sync::mpsc;
use std::time::SystemTime;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileMetadata {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub size: u64,
    pub modified: u64,
    pub created: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub file_path: String,
    pub line_number: usize,
    pub line_content: String,
    pub match_start: usize,
    pub match_end: usize,
}

#[command]
pub async fn read_file_content(path: String) -> Result<String, String> {
    match fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file {}: {}", path, e)),
    }
}

#[command]
pub async fn write_file_content(path: String, content: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }
    }

    match fs::write(&path, content) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to write file {}: {}", path, e)),
    }
}

#[command]
pub async fn create_file(path: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }
    }

    match fs::File::create(&path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to create file {}: {}", path, e)),
    }
}

#[command]
pub async fn delete_file(path: String) -> Result<(), String> {
    match fs::remove_file(&path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to delete file {}: {}", path, e)),
    }
}

#[command]
pub async fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    match fs::rename(&old_path, &new_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to rename file {} to {}: {}", old_path, new_path, e)),
    }
}

#[command]
pub async fn copy_file(source: String, destination: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = Path::new(&destination).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        }
    }

    match fs::copy(&source, &destination) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to copy file {} to {}: {}", source, destination, e)),
    }
}

#[command]
pub async fn read_directory(path: String) -> Result<Vec<FileMetadata>, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err(format!("{} is not a directory", path));
    }

    let mut files = Vec::new();
    
    match fs::read_dir(dir) {
        Ok(entries) => {
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        let path = entry.path();
                        let metadata = match entry.metadata() {
                            Ok(meta) => meta,
                            Err(_) => continue,
                        };

                        let file_meta = FileMetadata {
                            name: path.file_name()
                                .unwrap_or_default()
                                .to_string_lossy()
                                .to_string(),
                            path: path.to_string_lossy().to_string(),
                            is_directory: metadata.is_dir(),
                            size: metadata.len(),
                            modified: metadata.modified()
                                .unwrap_or(SystemTime::UNIX_EPOCH)
                                .duration_since(SystemTime::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs(),
                            created: metadata.created()
                                .unwrap_or(SystemTime::UNIX_EPOCH)
                                .duration_since(SystemTime::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_secs(),
                        };
                        files.push(file_meta);
                    }
                    Err(_) => continue,
                }
            }
        }
        Err(e) => return Err(format!("Failed to read directory {}: {}", path, e)),
    }

    // Sort: directories first, then files
    files.sort_by(|a, b| {
        if a.is_directory && !b.is_directory {
            std::cmp::Ordering::Less
        } else if !a.is_directory && b.is_directory {
            std::cmp::Ordering::Greater
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(files)
}

#[command]
pub async fn create_directory(path: String) -> Result<(), String> {
    match fs::create_dir_all(&path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to create directory {}: {}", path, e)),
    }
}

#[command]
pub async fn delete_directory(path: String) -> Result<(), String> {
    match fs::remove_dir_all(&path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to delete directory {}: {}", path, e)),
    }
}

#[command]
pub async fn watch_directory(path: String) -> Result<(), String> {
    // This is a simplified implementation
    // In a real implementation, you would set up file system watching
    // and emit events to the frontend
    Ok(())
}

#[command]
pub async fn get_file_metadata(path: String) -> Result<FileMetadata, String> {
    let path_buf = PathBuf::from(&path);
    
    match fs::metadata(&path_buf) {
        Ok(metadata) => {
            let file_meta = FileMetadata {
                name: path_buf.file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string(),
                path: path.clone(),
                is_directory: metadata.is_dir(),
                size: metadata.len(),
                modified: metadata.modified()
                    .unwrap_or(SystemTime::UNIX_EPOCH)
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
                created: metadata.created()
                    .unwrap_or(SystemTime::UNIX_EPOCH)
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
            };
            Ok(file_meta)
        }
        Err(e) => Err(format!("Failed to get metadata for {}: {}", path, e)),
    }
}

#[command]
pub async fn search_in_files(
    directory: String,
    pattern: String,
    file_extensions: Vec<String>,
    case_sensitive: bool,
    use_regex: bool,
) -> Result<Vec<SearchResult>, String> {
    let mut results = Vec::new();
    
    let regex_pattern = if use_regex {
        match regex::RegexBuilder::new(&pattern)
            .case_insensitive(!case_sensitive)
            .build() {
            Ok(re) => Some(re),
            Err(e) => return Err(format!("Invalid regex pattern: {}", e)),
        }
    } else {
        None
    };

    for entry in WalkDir::new(&directory).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let path = entry.path();
            
            // Check file extension
            if !file_extensions.is_empty() {
                if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if !file_extensions.iter().any(|e| e.to_lowercase() == ext_str) {
                        continue;
                    }
                } else {
                    continue;
                }
            }

            // Read file content
            match fs::read_to_string(path) {
                Ok(content) => {
                    for (line_num, line) in content.lines().enumerate() {
                        let matches = if use_regex {
                            if let Some(ref re) = regex_pattern {
                                re.find_iter(line).collect::<Vec<_>>()
                            } else {
                                continue;
                            }
                        } else {
                            let search_text = if case_sensitive { line } else { &line.to_lowercase() };
                            let search_pattern = if case_sensitive { &pattern } else { &pattern.to_lowercase() };
                            
                            let mut matches = Vec::new();
                            let mut start = 0;
                            while let Some(pos) = search_text[start..].find(search_pattern) {
                                let match_start = start + pos;
                                let match_end = match_start + pattern.len();
                                matches.push((match_start, match_end));
                                start = match_end;
                            }
                            matches.into_iter().map(|(s, e)| MockMatch { start: s, end: e }).collect()
                        };

                        for m in matches {
                            results.push(SearchResult {
                                file_path: path.to_string_lossy().to_string(),
                                line_number: line_num + 1,
                                line_content: line.to_string(),
                                match_start: m.start(),
                                match_end: m.end(),
                            });
                        }
                    }
                }
                Err(_) => continue, // Skip files that can't be read as text
            }
        }
    }

    Ok(results)
}

// Helper struct for non-regex matches
struct MockMatch {
    start: usize,
    end: usize,
}

impl MockMatch {
    fn start(&self) -> usize {
        self.start
    }
    
    fn end(&self) -> usize {
        self.end
    }
}