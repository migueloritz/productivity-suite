// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod spreadsheet_service;
mod formula_engine;
mod data_analyzer;

use spreadsheet_service::*;
use formula_engine::*;
use data_analyzer::*;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Spreadsheet operations
            create_spreadsheet,
            save_spreadsheet,
            load_spreadsheet,
            export_to_csv,
            export_to_excel,
            import_from_csv,
            import_from_excel,
            
            // Formula engine
            evaluate_formula,
            validate_formula,
            get_cell_dependencies,
            recalculate_sheet,
            
            // Data analysis
            analyze_data_range,
            generate_chart_data,
            detect_data_patterns,
            suggest_formulas,
            calculate_statistics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}