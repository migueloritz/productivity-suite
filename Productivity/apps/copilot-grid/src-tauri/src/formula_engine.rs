use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use tauri::command;
use evalexpr::*;
use regex::Regex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormulaResult {
    pub value: String,
    pub error: Option<String>,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub error: Option<String>,
    pub dependencies: Vec<String>,
}

#[command]
pub async fn evaluate_formula(
    formula: String,
    cells: HashMap<String, String>,
    cell_ref: String,
) -> Result<FormulaResult, String> {
    if !formula.starts_with('=') {
        return Ok(FormulaResult {
            value: formula,
            error: None,
            dependencies: vec![],
        });
    }
    
    let formula_content = &formula[1..]; // Remove the '=' prefix
    let dependencies = extract_cell_references(formula_content);
    
    // Check for circular references
    if dependencies.contains(&cell_ref) {
        return Ok(FormulaResult {
            value: "#CIRCULAR!".to_string(),
            error: Some("Circular reference detected".to_string()),
            dependencies,
        });
    }
    
    // Replace cell references with their values
    let mut processed_formula = formula_content.to_string();
    for dep in &dependencies {
        if let Some(cell_value) = cells.get(dep) {
            // Try to parse as number, otherwise treat as string
            let value = if let Ok(num) = cell_value.parse::<f64>() {
                num.to_string()
            } else {
                format!("\"{}\"", cell_value.replace('"', "\\\""))
            };
            processed_formula = processed_formula.replace(dep, &value);
        } else {
            // Cell reference not found, treat as 0
            processed_formula = processed_formula.replace(dep, "0");
        }
    }
    
    // Handle built-in functions
    processed_formula = handle_builtin_functions(&processed_formula, &cells)?;
    
    // Evaluate the expression
    match eval(&processed_formula) {
        Ok(value) => Ok(FormulaResult {
            value: format_value(value),
            error: None,
            dependencies,
        }),
        Err(e) => Ok(FormulaResult {
            value: "#ERROR!".to_string(),
            error: Some(e.to_string()),
            dependencies,
        }),
    }
}

#[command]
pub async fn validate_formula(formula: String) -> Result<ValidationResult, String> {
    if !formula.starts_with('=') {
        return Ok(ValidationResult {
            is_valid: true,
            error: None,
            dependencies: vec![],
        });
    }
    
    let formula_content = &formula[1..];
    let dependencies = extract_cell_references(formula_content);
    
    // Basic syntax validation
    let mut processed_formula = formula_content.to_string();
    
    // Replace cell references with dummy values for validation
    for dep in &dependencies {
        processed_formula = processed_formula.replace(dep, "1");
    }
    
    // Handle built-in functions for validation
    processed_formula = handle_builtin_functions(&processed_formula, &HashMap::new()).unwrap_or_else(|e| {
        return format!("Function error: {}", e);
    });
    
    match eval(&processed_formula) {
        Ok(_) => Ok(ValidationResult {
            is_valid: true,
            error: None,
            dependencies,
        }),
        Err(e) => Ok(ValidationResult {
            is_valid: false,
            error: Some(e.to_string()),
            dependencies,
        }),
    }
}

#[command]
pub async fn get_cell_dependencies(formula: String) -> Result<Vec<String>, String> {
    if !formula.starts_with('=') {
        return Ok(vec![]);
    }
    
    let formula_content = &formula[1..];
    Ok(extract_cell_references(formula_content))
}

#[command]
pub async fn recalculate_sheet(
    cells: HashMap<String, String>,
    formulas: HashMap<String, String>,
) -> Result<HashMap<String, String>, String> {
    let mut result = HashMap::new();
    let mut processed = HashSet::new();
    
    // Topological sort to handle dependencies
    let mut dependency_graph: HashMap<String, Vec<String>> = HashMap::new();
    
    for (cell_ref, formula) in &formulas {
        let deps = extract_cell_references(&formula[1..]);
        dependency_graph.insert(cell_ref.clone(), deps);
    }
    
    let sorted_cells = topological_sort(&dependency_graph)?;
    
    // Process cells in dependency order
    for cell_ref in sorted_cells {
        if let Some(formula) = formulas.get(&cell_ref) {
            let formula_result = evaluate_formula(
                formula.clone(),
                result.clone(),
                cell_ref.clone(),
            ).await?;
            
            result.insert(cell_ref.clone(), formula_result.value);
            processed.insert(cell_ref);
        }
    }
    
    // Add non-formula cells
    for (cell_ref, value) in &cells {
        if !processed.contains(cell_ref) {
            result.insert(cell_ref.clone(), value.clone());
        }
    }
    
    Ok(result)
}

fn extract_cell_references(formula: &str) -> Vec<String> {
    let re = Regex::new(r"\b[A-Z]+[0-9]+\b").unwrap();
    re.find_iter(formula)
        .map(|m| m.as_str().to_string())
        .collect()
}

fn handle_builtin_functions(formula: &str, cells: &HashMap<String, String>) -> Result<String, String> {
    let mut processed = formula.to_string();
    
    // Handle SUM function
    let sum_re = Regex::new(r"SUM\(([^)]+)\)").unwrap();
    for cap in sum_re.captures_iter(formula) {
        let range = &cap[1];
        let sum_value = calculate_sum(range, cells)?;
        processed = processed.replace(&cap[0], &sum_value.to_string());
    }
    
    // Handle AVERAGE function
    let avg_re = Regex::new(r"AVERAGE\(([^)]+)\)").unwrap();
    for cap in avg_re.captures_iter(formula) {
        let range = &cap[1];
        let avg_value = calculate_average(range, cells)?;
        processed = processed.replace(&cap[0], &avg_value.to_string());
    }
    
    // Handle COUNT function
    let count_re = Regex::new(r"COUNT\(([^)]+)\)").unwrap();
    for cap in count_re.captures_iter(formula) {
        let range = &cap[1];
        let count_value = calculate_count(range, cells)?;
        processed = processed.replace(&cap[0], &count_value.to_string());
    }
    
    // Handle MAX function
    let max_re = Regex::new(r"MAX\(([^)]+)\)").unwrap();
    for cap in max_re.captures_iter(formula) {
        let range = &cap[1];
        let max_value = calculate_max(range, cells)?;
        processed = processed.replace(&cap[0], &max_value.to_string());
    }
    
    // Handle MIN function
    let min_re = Regex::new(r"MIN\(([^)]+)\)").unwrap();
    for cap in min_re.captures_iter(formula) {
        let range = &cap[1];
        let min_value = calculate_min(range, cells)?;
        processed = processed.replace(&cap[0], &min_value.to_string());
    }
    
    Ok(processed)
}

fn calculate_sum(range: &str, cells: &HashMap<String, String>) -> Result<f64, String> {
    let cell_refs = parse_range(range)?;
    let mut sum = 0.0;
    
    for cell_ref in cell_refs {
        if let Some(value) = cells.get(&cell_ref) {
            if let Ok(num) = value.parse::<f64>() {
                sum += num;
            }
        }
    }
    
    Ok(sum)
}

fn calculate_average(range: &str, cells: &HashMap<String, String>) -> Result<f64, String> {
    let cell_refs = parse_range(range)?;
    let mut sum = 0.0;
    let mut count = 0;
    
    for cell_ref in cell_refs {
        if let Some(value) = cells.get(&cell_ref) {
            if let Ok(num) = value.parse::<f64>() {
                sum += num;
                count += 1;
            }
        }
    }
    
    if count == 0 {
        Ok(0.0)
    } else {
        Ok(sum / count as f64)
    }
}

fn calculate_count(range: &str, cells: &HashMap<String, String>) -> Result<f64, String> {
    let cell_refs = parse_range(range)?;
    let mut count = 0;
    
    for cell_ref in cell_refs {
        if let Some(value) = cells.get(&cell_ref) {
            if value.parse::<f64>().is_ok() {
                count += 1;
            }
        }
    }
    
    Ok(count as f64)
}

fn calculate_max(range: &str, cells: &HashMap<String, String>) -> Result<f64, String> {
    let cell_refs = parse_range(range)?;
    let mut max_val = f64::NEG_INFINITY;
    let mut found_number = false;
    
    for cell_ref in cell_refs {
        if let Some(value) = cells.get(&cell_ref) {
            if let Ok(num) = value.parse::<f64>() {
                max_val = max_val.max(num);
                found_number = true;
            }
        }
    }
    
    if found_number {
        Ok(max_val)
    } else {
        Ok(0.0)
    }
}

fn calculate_min(range: &str, cells: &HashMap<String, String>) -> Result<f64, String> {
    let cell_refs = parse_range(range)?;
    let mut min_val = f64::INFINITY;
    let mut found_number = false;
    
    for cell_ref in cell_refs {
        if let Some(value) = cells.get(&cell_ref) {
            if let Ok(num) = value.parse::<f64>() {
                min_val = min_val.min(num);
                found_number = true;
            }
        }
    }
    
    if found_number {
        Ok(min_val)
    } else {
        Ok(0.0)
    }
}

fn parse_range(range: &str) -> Result<Vec<String>, String> {
    // Handle ranges like "A1:B3" or individual cells like "A1,B2,C3"
    if range.contains(':') {
        // Range format like "A1:B3"
        let parts: Vec<&str> = range.split(':').collect();
        if parts.len() != 2 {
            return Err("Invalid range format".to_string());
        }
        
        let start_cell = parts[0].trim();
        let end_cell = parts[1].trim();
        
        // Parse cell coordinates
        let (start_row, start_col) = parse_cell_ref(start_cell)?;
        let (end_row, end_col) = parse_cell_ref(end_cell)?;
        
        let mut cells = Vec::new();
        for row in start_row..=end_row {
            for col in start_col..=end_col {
                cells.push(format_cell_ref(row, col));
            }
        }
        
        Ok(cells)
    } else {
        // Individual cells separated by commas
        Ok(range.split(',').map(|s| s.trim().to_string()).collect())
    }
}

fn parse_cell_ref(cell_ref: &str) -> Result<(u32, u32), String> {
    let re = Regex::new(r"^([A-Z]+)([0-9]+)$").unwrap();
    if let Some(captures) = re.captures(cell_ref) {
        let col_str = &captures[1];
        let row_str = &captures[2];
        
        let mut col = 0u32;
        for c in col_str.chars() {
            col = col * 26 + (c as u32 - 'A' as u32 + 1);
        }
        col -= 1; // Convert to 0-based
        
        let row = row_str.parse::<u32>().map_err(|_| "Invalid row number")? - 1; // Convert to 0-based
        
        Ok((row, col))
    } else {
        Err("Invalid cell reference format".to_string())
    }
}

fn format_cell_ref(row: u32, col: u32) -> String {
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

fn topological_sort(graph: &HashMap<String, Vec<String>>) -> Result<Vec<String>, String> {
    let mut result = Vec::new();
    let mut visited = HashSet::new();
    let mut rec_stack = HashSet::new();
    
    for node in graph.keys() {
        if !visited.contains(node) {
            if !dfs_visit(node, graph, &mut visited, &mut rec_stack, &mut result) {
                return Err("Circular dependency detected".to_string());
            }
        }
    }
    
    result.reverse();
    Ok(result)
}

fn dfs_visit(
    node: &str,
    graph: &HashMap<String, Vec<String>>,
    visited: &mut HashSet<String>,
    rec_stack: &mut HashSet<String>,
    result: &mut Vec<String>,
) -> bool {
    visited.insert(node.to_string());
    rec_stack.insert(node.to_string());
    
    if let Some(neighbors) = graph.get(node) {
        for neighbor in neighbors {
            if !visited.contains(neighbor) {
                if !dfs_visit(neighbor, graph, visited, rec_stack, result) {
                    return false;
                }
            } else if rec_stack.contains(neighbor) {
                return false; // Circular dependency
            }
        }
    }
    
    rec_stack.remove(node);
    result.push(node.to_string());
    true
}

fn format_value(value: Value) -> String {
    match value {
        Value::Int(i) => i.to_string(),
        Value::Float(f) => {
            if f.fract() == 0.0 {
                format!("{:.0}", f)
            } else {
                f.to_string()
            }
        }
        Value::String(s) => s,
        Value::Boolean(b) => if b { "TRUE".to_string() } else { "FALSE".to_string() },
        _ => value.to_string(),
    }
}