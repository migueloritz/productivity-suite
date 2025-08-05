// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod email_service;
mod imap_client;
mod smtp_client;
mod parser;

use email_service::*;
use tauri::State;
use std::sync::Mutex;

pub struct AppState {
    pub email_service: Mutex<EmailService>,
}

#[tauri::command]
async fn connect_account(
    account: EmailAccountConfig,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.connect_account(account).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn disconnect_account(
    account_id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.disconnect_account(&account_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn sync_folders(
    account_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<EmailFolderData>, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.sync_folders(&account_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn fetch_emails(
    account_id: String,
    folder_id: String,
    limit: Option<usize>,
    offset: Option<usize>,
    state: State<'_, AppState>,
) -> Result<Vec<EmailData>, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.fetch_emails(&account_id, &folder_id, limit, offset).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn fetch_email_content(
    account_id: String,
    folder_id: String,
    message_id: String,
    state: State<'_, AppState>,
) -> Result<EmailData, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.fetch_email_content(&account_id, &folder_id, &message_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn send_email(
    account_id: String,
    email_data: ComposeEmailData,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.send_email(&account_id, email_data).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn mark_as_read(
    account_id: String,
    folder_id: String,
    message_id: String,
    read: bool,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.mark_as_read(&account_id, &folder_id, &message_id, read).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn mark_as_flagged(
    account_id: String,
    folder_id: String,
    message_id: String,
    flagged: bool,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.mark_as_flagged(&account_id, &folder_id, &message_id, flagged).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn move_email(
    account_id: String,
    from_folder_id: String,
    to_folder_id: String,
    message_id: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.move_email(&account_id, &from_folder_id, &to_folder_id, &message_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_email(
    account_id: String,
    folder_id: String,
    message_id: String,
    permanent: bool,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.delete_email(&account_id, &folder_id, &message_id, permanent).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn search_emails(
    account_id: String,
    query: SearchQueryData,
    state: State<'_, AppState>,
) -> Result<Vec<EmailData>, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.search_emails(&account_id, query).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn download_attachment(
    account_id: String,
    folder_id: String,
    message_id: String,
    attachment_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<u8>, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.download_attachment(&account_id, &folder_id, &message_id, &attachment_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_thread_emails(
    account_id: String,
    thread_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<EmailData>, String> {
    let mut service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.get_thread_emails(&account_id, &thread_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn test_connection(
    config: EmailAccountConfig,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let service = state.email_service.lock().map_err(|e| e.to_string())?;
    service.test_connection(config).await.map_err(|e| e.to_string())
}

fn main() {
    let email_service = EmailService::new();
    let app_state = AppState {
        email_service: Mutex::new(email_service),
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            connect_account,
            disconnect_account,
            sync_folders,
            fetch_emails,
            fetch_email_content,
            send_email,
            mark_as_read,
            mark_as_flagged,
            move_email,
            delete_email,
            search_emails,
            download_attachment,
            get_thread_emails,
            test_connection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}