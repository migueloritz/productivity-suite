use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataAnalysis {
    pub statistics: Statistics,
    pub patterns: Vec<DataPattern>,
    pub suggestions: Vec<FormulaSuggestion>,
    pub chart_recommendations: Vec<ChartRecommendation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Statistics {
    pub count: usize,
    pub sum: f64,
    pub average: f64,
    pub median: f64,
    pub min: f64,
    pub max: f64,
    pub std_dev: f64,
    pub variance: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataPattern {
    pub pattern_type: String,
    pub description: String,
    pub confidence: f64,
    pub cells: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormulaSuggestion {
    pub formula: String,
    pub description: String,
    pub cell: String,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartRecommendation {
    pub chart_type: String,
    pub title: String,
    pub data_range: String,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartData {
    pub chart_type: String,
    pub title: String,
    pub labels: Vec<String>,
    pub datasets: Vec<Dataset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dataset {
    pub label: String,
    pub data: Vec<f64>,
    pub background_color: Vec<String>,
    pub border_color: Vec<String>,
}

#[command]
pub async fn analyze_data_range(
    cells: HashMap<String, String>,
    range: String,
) -> Result<DataAnalysis, String> {
    let cell_refs = parse_range(&range)?;
    let mut values = Vec::new();
    
    // Extract numeric values from the range
    for cell_ref in &cell_refs {
        if let Some(cell_value) = cells.get(cell_ref) {
            if let Ok(num) = cell_value.parse::<f64>() {
                values.push(num);
            }
        }
    }
    
    if values.is_empty() {
        return Err("No numeric data found in the specified range".to_string());
    }
    
    let statistics = calculate_statistics(&values);
    let patterns = detect_patterns(&cell_refs, &cells);
    let suggestions = generate_formula_suggestions(&cell_refs, &cells);
    let chart_recommendations = recommend_charts(&cell_refs, &cells);
    
    Ok(DataAnalysis {
        statistics,
        patterns,
        suggestions,
        chart_recommendations,
    })
}

#[command]
pub async fn generate_chart_data(
    cells: HashMap<String, String>,
    chart_type: String,
    data_range: String,
    labels_range: Option<String>,
) -> Result<ChartData, String> {
    let data_refs = parse_range(&data_range)?;
    let label_refs = if let Some(labels) = labels_range {
        parse_range(&labels)?
    } else {
        Vec::new()
    };
    
    let mut data_values = Vec::new();
    let mut labels = Vec::new();
    
    // Extract data values
    for cell_ref in &data_refs {
        if let Some(cell_value) = cells.get(cell_ref) {
            if let Ok(num) = cell_value.parse::<f64>() {
                data_values.push(num);
            } else {
                data_values.push(0.0);
            }
        } else {
            data_values.push(0.0);
        }
    }
    
    // Extract labels
    for (i, cell_ref) in label_refs.iter().enumerate() {
        if let Some(cell_value) = cells.get(cell_ref) {
            labels.push(cell_value.clone());
        } else {
            labels.push(format!("Item {}", i + 1));
        }
    }
    
    // Generate default labels if none provided
    if labels.is_empty() {
        for i in 0..data_values.len() {
            labels.push(format!("Series {}", i + 1));
        }
    }
    
    // Generate colors
    let colors = generate_colors(data_values.len());
    
    let dataset = Dataset {
        label: "Data".to_string(),
        data: data_values,
        background_color: colors.clone(),
        border_color: colors,
    };
    
    Ok(ChartData {
        chart_type: chart_type.clone(),
        title: format!("{} Chart", chart_type),
        labels,
        datasets: vec![dataset],
    })
}

#[command]
pub async fn detect_data_patterns(
    cells: HashMap<String, String>,
    range: String,
) -> Result<Vec<DataPattern>, String> {
    let cell_refs = parse_range(&range)?;
    Ok(detect_patterns(&cell_refs, &cells))
}

#[command]
pub async fn suggest_formulas(
    cells: HashMap<String, String>,
    range: String,
) -> Result<Vec<FormulaSuggestion>, String> {
    let cell_refs = parse_range(&range)?;
    Ok(generate_formula_suggestions(&cell_refs, &cells))
}

#[command]
pub async fn calculate_statistics(
    cells: HashMap<String, String>,
    range: String,
) -> Result<Statistics, String> {
    let cell_refs = parse_range(&range)?;
    let mut values = Vec::new();
    
    for cell_ref in &cell_refs {
        if let Some(cell_value) = cells.get(cell_ref) {
            if let Ok(num) = cell_value.parse::<f64>() {
                values.push(num);
            }
        }
    }
    
    if values.is_empty() {
        return Err("No numeric data found in the specified range".to_string());
    }
    
    Ok(calculate_statistics(&values))
}

fn calculate_statistics(values: &[f64]) -> Statistics {
    let count = values.len();
    let sum: f64 = values.iter().sum();
    let average = sum / count as f64;
    
    let mut sorted_values = values.to_vec();
    sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap());
    
    let median = if count % 2 == 0 {
        (sorted_values[count / 2 - 1] + sorted_values[count / 2]) / 2.0
    } else {
        sorted_values[count / 2]
    };
    
    let min = sorted_values[0];
    let max = sorted_values[count - 1];
    
    let variance = values.iter()
        .map(|x| (x - average).powi(2))
        .sum::<f64>() / count as f64;
    
    let std_dev = variance.sqrt();
    
    Statistics {
        count,
        sum,
        average,
        median,
        min,
        max,
        std_dev,
        variance,
    }
}

fn detect_patterns(cell_refs: &[String], cells: &HashMap<String, String>) -> Vec<DataPattern> {
    let mut patterns = Vec::new();
    
    // Detect arithmetic progression
    if let Some(pattern) = detect_arithmetic_progression(cell_refs, cells) {
        patterns.push(pattern);
    }
    
    // Detect geometric progression
    if let Some(pattern) = detect_geometric_progression(cell_refs, cells) {
        patterns.push(pattern);
    }
    
    // Detect repeating values
    if let Some(pattern) = detect_repeating_values(cell_refs, cells) {
        patterns.push(pattern);
    }
    
    // Detect increasing/decreasing trends
    if let Some(pattern) = detect_trend_pattern(cell_refs, cells) {
        patterns.push(pattern);
    }
    
    patterns
}

fn detect_arithmetic_progression(cell_refs: &[String], cells: &HashMap<String, String>) -> Option<DataPattern> {
    if cell_refs.len() < 3 {
        return None;
    }
    
    let mut values = Vec::new();
    for cell_ref in cell_refs {
        if let Some(cell_value) = cells.get(cell_ref) {
            if let Ok(num) = cell_value.parse::<f64>() {
                values.push(num);
            } else {
                return None;
            }
        } else {
            return None;
        }
    }
    
    let diff = values[1] - values[0];
    let mut is_arithmetic = true;
    
    for i in 2..values.len() {
        if (values[i] - values[i - 1] - diff).abs() > 1e-6 {
            is_arithmetic = false;
            break;
        }
    }
    
    if is_arithmetic {
        Some(DataPattern {
            pattern_type: "arithmetic_progression".to_string(),
            description: format!("Arithmetic progression with difference {}", diff),
            confidence: 0.9,
            cells: cell_refs.to_vec(),
        })
    } else {
        None
    }
}

fn detect_geometric_progression(cell_refs: &[String], cells: &HashMap<String, String>) -> Option<DataPattern> {
    if cell_refs.len() < 3 {
        return None;
    }
    
    let mut values = Vec::new();
    for cell_ref in cell_refs {
        if let Some(cell_value) = cells.get(cell_ref) {
            if let Ok(num) = cell_value.parse::<f64>() {
                if num != 0.0 {
                    values.push(num);
                } else {
                    return None;
                }
            } else {
                return None;
            }
        } else {
            return None;
        }
    }
    
    let ratio = values[1] / values[0];
    let mut is_geometric = true;
    
    for i in 2..values.len() {
        if (values[i] / values[i - 1] - ratio).abs() > 1e-6 {
            is_geometric = false;
            break;
        }
    }
    
    if is_geometric {
        Some(DataPattern {
            pattern_type: "geometric_progression".to_string(),
            description: format!("Geometric progression with ratio {}", ratio),
            confidence: 0.9,
            cells: cell_refs.to_vec(),
        })
    } else {
        None
    }
}

fn detect_repeating_values(cell_refs: &[String], cells: &HashMap<String, String>) -> Option<DataPattern> {
    if cell_refs.len() < 2 {
        return None;
    }
    
    let mut value_counts = HashMap::new();
    for cell_ref in cell_refs {
        if let Some(cell_value) = cells.get(cell_ref) {
            *value_counts.entry(cell_value.clone()).or_insert(0) += 1;
        }
    }
    
    let max_count = value_counts.values().max().unwrap_or(&0);
    if *max_count >= 2 {
        let most_common = value_counts.iter()
            .find(|(_, &count)| count == *max_count)
            .map(|(value, _)| value.clone())
            .unwrap_or_default();
        
        Some(DataPattern {
            pattern_type: "repeating_values".to_string(),
            description: format!("Value '{}' repeats {} times", most_common, max_count),
            confidence: 0.7,
            cells: cell_refs.to_vec(),
        })
    } else {
        None
    }
}

fn detect_trend_pattern(cell_refs: &[String], cells: &HashMap<String, String>) -> Option<DataPattern> {
    if cell_refs.len() < 3 {
        return None;
    }
    
    let mut values = Vec::new();
    for cell_ref in cell_refs {
        if let Some(cell_value) = cells.get(cell_ref) {
            if let Ok(num) = cell_value.parse::<f64>() {
                values.push(num);
            } else {
                return None;
            }
        } else {
            return None;
        }
    }
    
    let mut increasing = 0;
    let mut decreasing = 0;
    
    for i in 1..values.len() {
        if values[i] > values[i - 1] {
            increasing += 1;
        } else if values[i] < values[i - 1] {
            decreasing += 1;
        }
    }
    
    let total = values.len() - 1;
    if increasing as f64 / total as f64 > 0.8 {
        Some(DataPattern {
            pattern_type: "increasing_trend".to_string(),
            description: "Values show an increasing trend".to_string(),
            confidence: increasing as f64 / total as f64,
            cells: cell_refs.to_vec(),
        })
    } else if decreasing as f64 / total as f64 > 0.8 {
        Some(DataPattern {
            pattern_type: "decreasing_trend".to_string(),
            description: "Values show a decreasing trend".to_string(),
            confidence: decreasing as f64 / total as f64,
            cells: cell_refs.to_vec(),
        })
    } else {
        None
    }
}

fn generate_formula_suggestions(cell_refs: &[String], cells: &HashMap<String, String>) -> Vec<FormulaSuggestion> {
    let mut suggestions = Vec::new();
    
    // Suggest SUM formula
    if cell_refs.len() >= 2 {
        let range_str = format!("{}:{}", cell_refs[0], cell_refs[cell_refs.len() - 1]);
        suggestions.push(FormulaSuggestion {
            formula: format!("=SUM({})", range_str),
            description: "Calculate the sum of the selected range".to_string(),
            cell: format!("Next available cell"),
            confidence: 0.8,
        });
        
        // Suggest AVERAGE formula
        suggestions.push(FormulaSuggestion {
            formula: format!("=AVERAGE({})", range_str),
            description: "Calculate the average of the selected range".to_string(),
            cell: format!("Next available cell"),
            confidence: 0.8,
        });
        
        // Suggest COUNT formula
        suggestions.push(FormulaSuggestion {
            formula: format!("=COUNT({})", range_str),
            description: "Count numeric values in the selected range".to_string(),
            cell: format!("Next available cell"),
            confidence: 0.7,
        });
    }
    
    suggestions
}

fn recommend_charts(cell_refs: &[String], cells: &HashMap<String, String>) -> Vec<ChartRecommendation> {
    let mut recommendations = Vec::new();
    
    if cell_refs.len() < 2 {
        return recommendations;
    }
    
    let range_str = format!("{}:{}", cell_refs[0], cell_refs[cell_refs.len() - 1]);
    
    // Recommend bar chart for categorical data
    recommendations.push(ChartRecommendation {
        chart_type: "bar".to_string(),
        title: "Bar Chart".to_string(),
        data_range: range_str.clone(),
        confidence: 0.7,
    });
    
    // Recommend line chart for time series or sequential data
    recommendations.push(ChartRecommendation {
        chart_type: "line".to_string(),
        title: "Line Chart".to_string(),
        data_range: range_str.clone(),
        confidence: 0.6,
    });
    
    // Recommend pie chart for proportional data
    if cell_refs.len() <= 10 {
        recommendations.push(ChartRecommendation {
            chart_type: "pie".to_string(),
            title: "Pie Chart".to_string(),
            data_range: range_str,
            confidence: 0.5,
        });
    }
    
    recommendations
}

fn parse_range(range: &str) -> Result<Vec<String>, String> {
    if range.contains(':') {
        // Range format like "A1:B3"
        let parts: Vec<&str> = range.split(':').collect();
        if parts.len() != 2 {
            return Err("Invalid range format".to_string());
        }
        
        let start_cell = parts[0].trim();
        let end_cell = parts[1].trim();
        
        // For simplicity, assume single row or column ranges
        // In a full implementation, this would handle 2D ranges
        Ok(vec![start_cell.to_string(), end_cell.to_string()])
    } else {
        // Individual cells separated by commas
        Ok(range.split(',').map(|s| s.trim().to_string()).collect())
    }
}

fn generate_colors(count: usize) -> Vec<String> {
    let base_colors = vec![
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
        "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF",
    ];
    
    let mut colors = Vec::new();
    for i in 0..count {
        colors.push(base_colors[i % base_colors.len()].to_string());
    }
    colors
}