// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod document_service;
mod export_service;

use document_service::*;
use export_service::*;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            create_document,
            save_document,
            load_document,
            delete_document,
            list_documents,
            get_document_info,
            search_documents,
            export_to_format,
            get_export_formats,
            get_word_count,
            get_reading_time,
            find_and_replace,
            create_backup,
            restore_backup,
            get_document_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}