// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod file_service;
mod project_service;
mod lsp_client;
mod debugger;
mod terminal;

use file_service::*;
use project_service::*;
use lsp_client::*;
use debugger::*;
use terminal::*;

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // File operations
            read_file_content,
            write_file_content,
            create_file,
            delete_file,
            rename_file,
            copy_file,
            read_directory,
            create_directory,
            delete_directory,
            watch_directory,
            get_file_metadata,
            search_in_files,
            // Project operations
            open_project,
            close_project,
            get_project_files,
            get_project_structure,
            get_recent_projects,
            add_recent_project,
            get_project_settings,
            save_project_settings,
            // LSP operations
            start_language_server,
            stop_language_server,
            send_lsp_request,
            get_completions,
            get_hover_info,
            get_diagnostics,
            format_document,
            // Debugging operations
            start_debug_session,
            stop_debug_session,
            set_breakpoint,
            remove_breakpoint,
            step_over,
            step_into,
            step_out,
            continue_execution,
            get_variables,
            evaluate_expression,
            // Terminal operations
            create_terminal,
            destroy_terminal,
            send_terminal_input,
            resize_terminal,
            get_terminal_output
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}