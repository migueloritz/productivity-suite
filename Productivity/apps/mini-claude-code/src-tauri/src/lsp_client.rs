use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::{Command, Stdio};
use tauri::command;
use tower_lsp::lsp_types::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct LSPServer {
    pub language: String,
    pub command: String,
    pub args: Vec<String>,
    pub initialized: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompletionResponse {
    pub items: Vec<CompletionItem>,
    pub is_incomplete: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HoverResponse {
    pub contents: String,
    pub range: Option<Range>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DiagnosticResponse {
    pub uri: String,
    pub diagnostics: Vec<Diagnostic>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FormatResponse {
    pub text: String,
}

// Global state for managing LSP servers
static mut LSP_SERVERS: Option<HashMap<String, LSPServer>> = None;

fn get_lsp_servers() -> &'static mut HashMap<String, LSPServer> {
    unsafe {
        if LSP_SERVERS.is_none() {
            LSP_SERVERS = Some(HashMap::new());
        }
        LSP_SERVERS.as_mut().unwrap()
    }
}

#[command]
pub async fn start_language_server(language: String) -> Result<bool, String> {
    let servers = get_lsp_servers();
    
    // Check if server is already running
    if let Some(server) = servers.get(&language) {
        if server.initialized {
            return Ok(true);
        }
    }

    // Define LSP server configurations
    let (command, args) = match language.as_str() {
        "typescript" | "javascript" => {
            ("typescript-language-server".to_string(), vec!["--stdio".to_string()])
        }
        "python" => {
            ("pylsp".to_string(), vec![])
        }
        "rust" => {
            ("rust-analyzer".to_string(), vec![])
        }
        "json" => {
            ("vscode-json-languageserver".to_string(), vec!["--stdio".to_string()])
        }
        "html" => {
            ("vscode-html-languageserver".to_string(), vec!["--stdio".to_string()])
        }
        "css" => {
            ("vscode-css-languageserver".to_string(), vec!["--stdio".to_string()])
        }
        _ => {
            return Err(format!("No LSP server configured for language: {}", language));
        }
    };

    // Try to start the server (simplified - in reality you'd manage the process)
    let server = LSPServer {
        language: language.clone(),
        command: command.clone(),
        args: args.clone(),
        initialized: true, // Simplified for demo
    };

    servers.insert(language, server);
    Ok(true)
}

#[command]
pub async fn stop_language_server(language: String) -> Result<(), String> {
    let servers = get_lsp_servers();
    
    if servers.remove(&language).is_some() {
        Ok(())
    } else {
        Err(format!("No LSP server running for language: {}", language))
    }
}

#[command]
pub async fn send_lsp_request(
    language: String,
    method: String,
    params: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let servers = get_lsp_servers();
    
    if let Some(server) = servers.get(&language) {
        if !server.initialized {
            return Err(format!("LSP server not initialized for language: {}", language));
        }
        
        // In a real implementation, this would send the actual LSP request
        // For now, return a mock response
        Ok(serde_json::json!({
            "result": "Mock LSP response",
            "method": method,
            "params": params
        }))
    } else {
        Err(format!("No LSP server running for language: {}", language))
    }
}

#[command]
pub async fn get_completions(
    language: String,
    uri: String,
    position: Position,
    trigger_character: Option<String>,
) -> Result<CompletionResponse, String> {
    let servers = get_lsp_servers();
    
    if let Some(server) = servers.get(&language) {
        if !server.initialized {
            return Err(format!("LSP server not initialized for language: {}", language));
        }

        // Mock completion items based on language
        let items = match language.as_str() {
            "typescript" | "javascript" => vec![
                CompletionItem {
                    label: "console.log".to_string(),
                    kind: Some(CompletionItemKind::FUNCTION),
                    detail: Some("(method) Console.log(...data: any[]): void".to_string()),
                    documentation: Some(Documentation::String("Outputs a message to the console.".to_string())),
                    insert_text: Some("console.log($1)".to_string()),
                    insert_text_format: Some(InsertTextFormat::SNIPPET),
                    ..Default::default()
                },
                CompletionItem {
                    label: "function".to_string(),
                    kind: Some(CompletionItemKind::KEYWORD),
                    detail: Some("Function declaration".to_string()),
                    insert_text: Some("function $1($2) {\n\t$3\n}".to_string()),
                    insert_text_format: Some(InsertTextFormat::SNIPPET),
                    ..Default::default()
                },
            ],
            "python" => vec![
                CompletionItem {
                    label: "print".to_string(),
                    kind: Some(CompletionItemKind::FUNCTION),
                    detail: Some("print(*values, sep=' ', end='\\n', file=sys.stdout, flush=False)".to_string()),
                    documentation: Some(Documentation::String("Print objects to the text stream file.".to_string())),
                    insert_text: Some("print($1)".to_string()),
                    insert_text_format: Some(InsertTextFormat::SNIPPET),
                    ..Default::default()
                },
                CompletionItem {
                    label: "def".to_string(),
                    kind: Some(CompletionItemKind::KEYWORD),
                    detail: Some("Function definition".to_string()),
                    insert_text: Some("def $1($2):\n\t$3".to_string()),
                    insert_text_format: Some(InsertTextFormat::SNIPPET),
                    ..Default::default()
                },
            ],
            "rust" => vec![
                CompletionItem {
                    label: "println!".to_string(),
                    kind: Some(CompletionItemKind::FUNCTION),
                    detail: Some("macro println!".to_string()),
                    documentation: Some(Documentation::String("Prints to the standard output, with a newline.".to_string())),
                    insert_text: Some("println!(\"$1\")".to_string()),
                    insert_text_format: Some(InsertTextFormat::SNIPPET),
                    ..Default::default()
                },
                CompletionItem {
                    label: "fn".to_string(),
                    kind: Some(CompletionItemKind::KEYWORD),
                    detail: Some("Function definition".to_string()),
                    insert_text: Some("fn $1($2) -> $3 {\n\t$4\n}".to_string()),
                    insert_text_format: Some(InsertTextFormat::SNIPPET),
                    ..Default::default()
                },
            ],
            _ => vec![],
        };

        Ok(CompletionResponse {
            items,
            is_incomplete: false,
        })
    } else {
        Err(format!("No LSP server running for language: {}", language))
    }
}

#[command]
pub async fn get_hover_info(
    language: String,
    uri: String,
    position: Position,
) -> Result<Option<HoverResponse>, String> {
    let servers = get_lsp_servers();
    
    if let Some(server) = servers.get(&language) {
        if !server.initialized {
            return Err(format!("LSP server not initialized for language: {}", language));
        }

        // Mock hover response
        Ok(Some(HoverResponse {
            contents: format!("Hover information for {} at line {}, character {}", 
                language, position.line, position.character),
            range: Some(Range {
                start: position,
                end: Position {
                    line: position.line,
                    character: position.character + 5,
                },
            }),
        }))
    } else {
        Err(format!("No LSP server running for language: {}", language))
    }
}

#[command]
pub async fn get_diagnostics(
    language: String,
    uri: String,
) -> Result<Vec<Diagnostic>, String> {
    let servers = get_lsp_servers();
    
    if let Some(server) = servers.get(&language) {
        if !server.initialized {
            return Err(format!("LSP server not initialized for language: {}", language));
        }

        // Mock diagnostics
        Ok(vec![
            Diagnostic {
                range: Range {
                    start: Position { line: 0, character: 0 },
                    end: Position { line: 0, character: 10 },
                },
                severity: Some(DiagnosticSeverity::WARNING),
                code: Some(NumberOrString::String("unused-variable".to_string())),
                source: Some("Language Server".to_string()),
                message: "Unused variable".to_string(),
                related_information: None,
                tags: None,
                code_description: None,
                data: None,
            }
        ])
    } else {
        Err(format!("No LSP server running for language: {}", language))
    }
}

#[command]
pub async fn format_document(
    language: String,
    uri: String,
    content: String,
) -> Result<String, String> {
    let servers = get_lsp_servers();
    
    if let Some(server) = servers.get(&language) {
        if !server.initialized {
            return Err(format!("LSP server not initialized for language: {}", language));
        }

        // Simple formatting based on language
        let formatted = match language.as_str() {
            "javascript" | "typescript" => {
                // Basic JavaScript/TypeScript formatting
                content
                    .lines()
                    .map(|line| line.trim())
                    .collect::<Vec<_>>()
                    .join("\n")
            }
            "python" => {
                // Basic Python formatting
                content
                    .lines()
                    .map(|line| {
                        if line.trim().is_empty() {
                            line.to_string()
                        } else {
                            line.trim().to_string()
                        }
                    })
                    .collect::<Vec<_>>()
                    .join("\n")
            }
            _ => content, // Return unchanged for unsupported languages
        };

        Ok(formatted)
    } else {
        Err(format!("No LSP server running for language: {}", language))
    }
}