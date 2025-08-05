use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::command;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectInfo {
    pub name: String,
    pub path: String,
    pub last_opened: u64,
    pub project_type: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectStructure {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub children: Vec<ProjectStructure>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectSettings {
    pub tab_size: u32,
    pub insert_spaces: bool,
    pub trim_trailing_whitespace: bool,
    pub insert_final_newline: bool,
    pub font_family: String,
    pub font_size: u32,
    pub theme: String,
    pub auto_save: bool,
    pub auto_save_delay: u32,
    pub format_on_save: bool,
    pub word_wrap: bool,
    pub show_line_numbers: bool,
    pub show_minimap: bool,
    pub enable_bracket_matching: bool,
    pub enable_auto_closing: bool,
    pub language_specific: HashMap<String, serde_json::Value>,
}

impl Default for ProjectSettings {
    fn default() -> Self {
        Self {
            tab_size: 4,
            insert_spaces: true,
            trim_trailing_whitespace: true,
            insert_final_newline: true,
            font_family: "Monaco, 'Cascadia Code', 'Roboto Mono', monospace".to_string(),
            font_size: 14,
            theme: "vs-dark".to_string(),
            auto_save: true,
            auto_save_delay: 1000,
            format_on_save: false,
            word_wrap: false,
            show_line_numbers: true,
            show_minimap: true,
            enable_bracket_matching: true,
            enable_auto_closing: true,
            language_specific: HashMap::new(),
        }
    }
}

#[command]
pub async fn open_project(path: String) -> Result<ProjectInfo, String> {
    let project_path = Path::new(&path);
    
    if !project_path.exists() {
        return Err(format!("Project path does not exist: {}", path));
    }

    if !project_path.is_dir() {
        return Err(format!("Project path is not a directory: {}", path));
    }

    let project_name = project_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    // Detect project type
    let project_type = detect_project_type(project_path);

    let project_info = ProjectInfo {
        name: project_name,
        path: path.clone(),
        last_opened: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        project_type,
        description: None,
    };

    // Add to recent projects
    add_recent_project(project_info.clone()).await?;

    Ok(project_info)
}

#[command]
pub async fn close_project() -> Result<(), String> {
    // Clean up any project-specific resources
    Ok(())
}

#[command]
pub async fn get_project_files(path: String, extensions: Vec<String>) -> Result<Vec<String>, String> {
    let mut files = Vec::new();
    
    for entry in WalkDir::new(&path).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let file_path = entry.path();
            
            // Filter by extensions if provided
            if !extensions.is_empty() {
                if let Some(ext) = file_path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if !extensions.iter().any(|e| e.to_lowercase() == ext_str) {
                        continue;
                    }
                } else {
                    continue;
                }
            }

            files.push(file_path.to_string_lossy().to_string());
        }
    }

    Ok(files)
}

#[command]
pub async fn get_project_structure(path: String) -> Result<ProjectStructure, String> {
    let root_path = Path::new(&path);
    
    if !root_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    build_project_structure(root_path, 3) // Max depth of 3 levels initially
}

fn build_project_structure(path: &Path, max_depth: u32) -> Result<ProjectStructure, String> {
    let name = path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let mut structure = ProjectStructure {
        name,
        path: path.to_string_lossy().to_string(),
        is_directory: path.is_dir(),
        children: Vec::new(),
    };

    if path.is_dir() && max_depth > 0 {
        match fs::read_dir(path) {
            Ok(entries) => {
                let mut children = Vec::new();
                
                for entry in entries {
                    match entry {
                        Ok(entry) => {
                            let entry_path = entry.path();
                            
                            // Skip hidden files and common build/cache directories
                            if let Some(name) = entry_path.file_name() {
                                let name_str = name.to_string_lossy();
                                if name_str.starts_with('.') 
                                    || name_str == "node_modules"
                                    || name_str == "target"
                                    || name_str == "build"
                                    || name_str == "dist"
                                    || name_str == "__pycache__"
                                {
                                    continue;
                                }
                            }

                            match build_project_structure(&entry_path, max_depth - 1) {
                                Ok(child) => children.push(child),
                                Err(_) => continue,
                            }
                        }
                        Err(_) => continue,
                    }
                }

                // Sort: directories first, then files
                children.sort_by(|a, b| {
                    if a.is_directory && !b.is_directory {
                        std::cmp::Ordering::Less
                    } else if !a.is_directory && b.is_directory {
                        std::cmp::Ordering::Greater
                    } else {
                        a.name.to_lowercase().cmp(&b.name.to_lowercase())
                    }
                });

                structure.children = children;
            }
            Err(e) => return Err(format!("Failed to read directory: {}", e)),
        }
    }

    Ok(structure)
}

#[command]
pub async fn get_recent_projects() -> Result<Vec<ProjectInfo>, String> {
    // In a real implementation, this would read from a config file or database
    // For now, return empty list
    Ok(Vec::new())
}

#[command]
pub async fn add_recent_project(project: ProjectInfo) -> Result<(), String> {
    // In a real implementation, this would save to a config file or database
    // For now, just return success
    Ok(())
}

#[command]
pub async fn get_project_settings(project_path: String) -> Result<ProjectSettings, String> {
    let settings_path = Path::new(&project_path).join(".vscode").join("settings.json");
    
    if settings_path.exists() {
        match fs::read_to_string(&settings_path) {
            Ok(content) => {
                match serde_json::from_str::<ProjectSettings>(&content) {
                    Ok(settings) => Ok(settings),
                    Err(_) => Ok(ProjectSettings::default()),
                }
            }
            Err(_) => Ok(ProjectSettings::default()),
        }
    } else {
        Ok(ProjectSettings::default())
    }
}

#[command]
pub async fn save_project_settings(
    project_path: String, 
    settings: ProjectSettings
) -> Result<(), String> {
    let vscode_dir = Path::new(&project_path).join(".vscode");
    if !vscode_dir.exists() {
        fs::create_dir_all(&vscode_dir)
            .map_err(|e| format!("Failed to create .vscode directory: {}", e))?;
    }

    let settings_path = vscode_dir.join("settings.json");
    let settings_json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, settings_json)
        .map_err(|e| format!("Failed to save settings: {}", e))?;

    Ok(())
}

fn detect_project_type(path: &Path) -> String {
    // Check for common project files to determine type
    let files = ["package.json", "Cargo.toml", "pyproject.toml", "requirements.txt", "pom.xml", "build.gradle"];
    
    for file in &files {
        if path.join(file).exists() {
            return match *file {
                "package.json" => "JavaScript/TypeScript".to_string(),
                "Cargo.toml" => "Rust".to_string(),
                "pyproject.toml" | "requirements.txt" => "Python".to_string(),
                "pom.xml" | "build.gradle" => "Java".to_string(),
                _ => "Unknown".to_string(),
            };
        }
    }

    // Check for common directories
    if path.join("src").exists() || path.join("lib").exists() {
        "Code Project".to_string()
    } else {
        "General".to_string()
    }
}