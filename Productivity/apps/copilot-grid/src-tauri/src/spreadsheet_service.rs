use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use tauri::command;
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Cell {
    pub value: String,
    pub formula: Option<String>,
    pub format: CellFormat,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CellFormat {
    pub font_family: Option<String>,
    pub font_size: Option<f32>,
    pub bold: bool,
    pub italic: bool,
    pub underline: bool,
    pub color: Option<String>,
    pub background_color: Option<String>,
    pub border: Option<BorderStyle>,
    pub alignment: Option<String>,
    pub number_format: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BorderStyle {
    pub top: Option<String>,
    pub right: Option<String>,
    pub bottom: Option<String>,
    pub left: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sheet {
    pub id: String,
    pub name: String,
    pub cells: HashMap<String, Cell>,
    pub row_heights: HashMap<u32, f32>,
    pub column_widths: HashMap<u32, f32>,
    pub frozen_rows: u32,
    pub frozen_columns: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Spreadsheet {
    pub id: String,
    pub name: String,
    pub sheets: Vec<Sheet>,
    pub active_sheet: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub modified_at: chrono::DateTime<chrono::Utc>,
}

impl Default for CellFormat {
    fn default() -> Self {
        Self {
            font_family: Some("Arial".to_string()),
            font_size: Some(11.0),
            bold: false,
            italic: false,
            underline: false,
            color: Some("#000000".to_string()),
            background_color: Some("#FFFFFF".to_string()),
            border: None,
            alignment: Some("left".to_string()),
            number_format: Some("General".to_string()),
        }
    }
}

impl Default for Cell {
    fn default() -> Self {
        Self {
            value: String::new(),
            formula: None,
            format: CellFormat::default(),
        }
    }
}

#[command]
pub async fn create_spreadsheet(name: String) -> Result<Spreadsheet, String> {
    let now = chrono::Utc::now();
    let id = uuid::Uuid::new_v4().to_string();
    let sheet_id = uuid::Uuid::new_v4().to_string();
    
    let sheet = Sheet {
        id: sheet_id.clone(),
        name: "Sheet1".to_string(),
        cells: HashMap::new(),
        row_heights: HashMap::new(),
        column_widths: HashMap::new(),
        frozen_rows: 0,
        frozen_columns: 0,
    };
    
    let spreadsheet = Spreadsheet {
        id,
        name,
        sheets: vec![sheet],
        active_sheet: sheet_id,
        created_at: now,
        modified_at: now,
    };
    
    Ok(spreadsheet)
}

#[command]
pub async fn save_spreadsheet(spreadsheet: Spreadsheet, file_path: String) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&spreadsheet)
        .map_err(|e| format!("Failed to serialize spreadsheet: {}", e))?;
    
    fs::write(&file_path, json)
        .map_err(|e| format!("Failed to save file: {}", e))?;
    
    Ok(())
}

#[command]
pub async fn load_spreadsheet(file_path: String) -> Result<Spreadsheet, String> {
    if !Path::new(&file_path).exists() {
        return Err("File does not exist".to_string());
    }
    
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let spreadsheet: Spreadsheet = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse spreadsheet: {}", e))?;
    
    Ok(spreadsheet)
}

#[command]
pub async fn export_to_csv(spreadsheet: Spreadsheet, sheet_id: String, file_path: String) -> Result<(), String> {
    let sheet = spreadsheet.sheets.iter()
        .find(|s| s.id == sheet_id)
        .ok_or("Sheet not found")?;
    
    let mut writer = csv::Writer::from_path(&file_path)
        .map_err(|e| format!("Failed to create CSV writer: {}", e))?;
    
    // Find the maximum row and column indices
    let mut max_row = 0u32;
    let mut max_col = 0u32;
    
    for cell_ref in sheet.cells.keys() {
        let (row, col) = parse_cell_reference(cell_ref)?;
        max_row = max_row.max(row);
        max_col = max_col.max(col);
    }
    
    // Write CSV data
    for row in 0..=max_row {
        let mut record = Vec::new();
        for col in 0..=max_col {
            let cell_ref = format_cell_reference(row, col);
            let value = sheet.cells.get(&cell_ref)
                .map(|cell| cell.value.clone())
                .unwrap_or_default();
            record.push(value);
        }
        writer.write_record(&record)
            .map_err(|e| format!("Failed to write CSV record: {}", e))?;
    }
    
    writer.flush()
        .map_err(|e| format!("Failed to flush CSV writer: {}", e))?;
    
    Ok(())
}

#[command]
pub async fn export_to_excel(spreadsheet: Spreadsheet, file_path: String) -> Result<(), String> {
    // This would use a library like xlsxwriter or rust_xlsxwriter
    // For now, we'll return a placeholder implementation
    Err("Excel export not yet implemented".to_string())
}

#[command]
pub async fn import_from_csv(file_path: String) -> Result<Spreadsheet, String> {
    let mut reader = csv::Reader::from_path(&file_path)
        .map_err(|e| format!("Failed to read CSV file: {}", e))?;
    
    let mut cells = HashMap::new();
    let mut row = 0u32;
    
    for result in reader.records() {
        let record = result.map_err(|e| format!("Failed to read CSV record: {}", e))?;
        
        for (col, field) in record.iter().enumerate() {
            if !field.is_empty() {
                let cell_ref = format_cell_reference(row, col as u32);
                cells.insert(cell_ref, Cell {
                    value: field.to_string(),
                    formula: None,
                    format: CellFormat::default(),
                });
            }
        }
        row += 1;
    }
    
    let now = chrono::Utc::now();
    let id = uuid::Uuid::new_v4().to_string();
    let sheet_id = uuid::Uuid::new_v4().to_string();
    
    let sheet = Sheet {
        id: sheet_id.clone(),
        name: "Imported Data".to_string(),
        cells,
        row_heights: HashMap::new(),
        column_widths: HashMap::new(),
        frozen_rows: 0,
        frozen_columns: 0,
    };
    
    let spreadsheet = Spreadsheet {
        id,
        name: "Imported Spreadsheet".to_string(),
        sheets: vec![sheet],
        active_sheet: sheet_id,
        created_at: now,
        modified_at: now,
    };
    
    Ok(spreadsheet)
}

#[command]
pub async fn import_from_excel(file_path: String) -> Result<Spreadsheet, String> {
    // This would use a library like calamine
    // For now, we'll return a placeholder implementation
    Err("Excel import not yet implemented".to_string())
}

fn parse_cell_reference(cell_ref: &str) -> Result<(u32, u32), String> {
    // Parse cell reference like "A1", "B2", "AA10"
    let mut chars = cell_ref.chars();
    let mut col_str = String::new();
    let mut row_str = String::new();
    
    // Extract column letters
    for c in chars.by_ref() {
        if c.is_ascii_alphabetic() {
            col_str.push(c.to_ascii_uppercase());
        } else {
            row_str.push(c);
            break;
        }
    }
    
    // Extract remaining row digits
    for c in chars {
        if c.is_ascii_digit() {
            row_str.push(c);
        }
    }
    
    // Convert column letters to number (A=0, B=1, ..., Z=25, AA=26, etc.)
    let mut col = 0u32;
    for c in col_str.chars() {
        col = col * 26 + (c as u32 - 'A' as u32);
    }
    
    // Convert row string to number (1-based to 0-based)
    let row = row_str.parse::<u32>()
        .map_err(|_| "Invalid row number")?
        .saturating_sub(1);
    
    Ok((row, col))
}

fn format_cell_reference(row: u32, col: u32) -> String {
    let mut col_str = String::new();
    let mut col_num = col;
    
    loop {
        col_str.insert(0, ('A' as u8 + (col_num % 26) as u8) as char);
        if col_num < 26 {
            break;
        }
        col_num = col_num / 26 - 1;
    }
    
    format!("{}{}", col_str, row + 1)
}

// Add uuid dependency to Cargo.toml
extern crate uuid;