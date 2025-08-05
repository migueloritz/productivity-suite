// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use tauri::{Manager, State, SystemTray, SystemTrayMenu, SystemTrayMenuItem, CustomMenuItem};
use parking_lot::Mutex;
use log::info;

mod file_service;
mod indexer;
mod search;

use file_service::*;
use indexer::*;
use search::*;

// Application state
#[derive(Default)]
pub struct AppState {
    pub indexer: Arc<Mutex<Option<FileIndexer>>>,
    pub search_engine: Arc<Mutex<Option<SearchEngine>>>,
}

#[tauri::command]
async fn initialize_app(
    data_dir: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    info!("Initializing CopilotNest with data directory: {}", data_dir);
    
    // Initialize the file indexer
    let indexer = FileIndexer::new(&data_dir)
        .map_err(|e| format!("Failed to create indexer: {}", e))?;
    
    // Initialize the search engine
    let search_engine = SearchEngine::new(&data_dir)
        .map_err(|e| format!("Failed to create search engine: {}", e))?;
    
    // Store in application state
    *state.indexer.lock() = Some(indexer);
    *state.search_engine.lock() = Some(search_engine);
    
    info!("CopilotNest initialized successfully");
    Ok(())
}

#[tauri::command]
async fn shutdown_app(state: State<'_, AppState>) -> Result<(), String> {
    info!("Shutting down CopilotNest");
    
    // Clean shutdown of indexer
    if let Some(indexer) = state.indexer.lock().take() {
        indexer.shutdown().await
            .map_err(|e| format!("Failed to shutdown indexer: {}", e))?;
    }
    
    // Clean shutdown of search engine
    if let Some(search_engine) = state.search_engine.lock().take() {
        search_engine.shutdown()
            .map_err(|e| format!("Failed to shutdown search engine: {}", e))?;
    }
    
    info!("CopilotNest shutdown complete");
    Ok(())
}

fn main() {
    // Initialize logging
    env_logger::init();
    
    info!("Starting CopilotNest application");

    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            // App lifecycle
            initialize_app,
            shutdown_app,
            
            // File operations
            read_directory,
            get_file_info,
            read_file_content,
            watch_directory,
            unwatch_directory,
            get_recent_files,
            
            // Indexing operations
            index_directory,
            index_file,
            get_indexing_status,
            rebuild_index,
            
            // Search operations
            search_files,
            search_content,
            get_search_suggestions,
            advanced_search,
            
            // Analytics operations
            get_folder_analytics,
            get_file_type_distribution,
            get_activity_timeline,
        ])
        .setup(|app| {
            info!("CopilotNest setup complete");
            
            // Setup system tray if available
            #[cfg(desktop)]
            {
                let quit = CustomMenuItem::new("quit".to_string(), "Quit");
                let show = CustomMenuItem::new("show".to_string(), "Show");
                let tray_menu = SystemTrayMenu::new()
                    .add_item(show)
                    .add_native_item(SystemTrayMenuItem::Separator)
                    .add_item(quit);
                
                let _system_tray = SystemTray::new().with_menu(tray_menu);
            }
            
            Ok(())
        })
        .on_system_tray_event(|app, event| {
            use tauri::SystemTrayEvent;
            
            match event {
                SystemTrayEvent::LeftClick { .. } => {
                    let window = app.get_window("main").unwrap();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "show" => {
                            let window = app.get_window("main").unwrap();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // Hide the window instead of closing it
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}