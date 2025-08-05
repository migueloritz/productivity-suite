use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DebugSession {
    pub id: String,
    pub name: String,
    pub language: String,
    pub program: String,
    pub args: Vec<String>,
    pub env: HashMap<String, String>,
    pub cwd: String,
    pub state: DebugState,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum DebugState {
    NotStarted,
    Running,
    Paused,
    Stopped,
    Error(String),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Breakpoint {
    pub id: String,
    pub file: String,
    pub line: u32,
    pub column: Option<u32>,
    pub condition: Option<String>,
    pub hit_condition: Option<String>,
    pub log_message: Option<String>,
    pub enabled: bool,
    pub verified: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Variable {
    pub name: String,
    pub value: String,
    pub type_name: String,
    pub variables_reference: u32,
    pub named_variables: Option<u32>,
    pub indexed_variables: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StackFrame {
    pub id: u32,
    pub name: String,
    pub source: Option<String>,
    pub line: u32,
    pub column: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EvaluateResponse {
    pub result: String,
    pub type_name: String,
    pub variables_reference: u32,
}

// Global state for managing debug sessions
static mut DEBUG_SESSIONS: Option<HashMap<String, DebugSession>> = None;
static mut BREAKPOINTS: Option<HashMap<String, Vec<Breakpoint>>> = None;

fn get_debug_sessions() -> &'static mut HashMap<String, DebugSession> {
    unsafe {
        if DEBUG_SESSIONS.is_none() {
            DEBUG_SESSIONS = Some(HashMap::new());
        }
        DEBUG_SESSIONS.as_mut().unwrap()
    }
}

fn get_breakpoints() -> &'static mut HashMap<String, Vec<Breakpoint>> {
    unsafe {
        if BREAKPOINTS.is_none() {
            BREAKPOINTS = Some(HashMap::new());
        }
        BREAKPOINTS.as_mut().unwrap()
    }
}

#[command]
pub async fn start_debug_session(
    session_id: String,
    name: String,
    language: String,
    program: String,
    args: Vec<String>,
    env: HashMap<String, String>,
    cwd: String,
) -> Result<DebugSession, String> {
    let sessions = get_debug_sessions();
    
    // Check if session already exists
    if sessions.contains_key(&session_id) {
        return Err(format!("Debug session {} already exists", session_id));
    }

    let session = DebugSession {
        id: session_id.clone(),
        name,
        language: language.clone(),
        program: program.clone(),
        args,
        env,
        cwd,
        state: DebugState::Running,
    };

    // In a real implementation, this would start the actual debugger
    // For now, just simulate starting based on language
    match language.as_str() {
        "javascript" | "typescript" => {
            // Would start Node.js debugger
            log::info!("Starting Node.js debug session for {}", program);
        }
        "python" => {
            // Would start Python debugger (pdb/debugpy)
            log::info!("Starting Python debug session for {}", program);
        }
        "rust" => {
            // Would start GDB/LLDB for Rust
            log::info!("Starting Rust debug session for {}", program);
        }
        _ => {
            return Err(format!("Debugging not supported for language: {}", language));
        }
    }

    sessions.insert(session_id, session.clone());
    Ok(session)
}

#[command]
pub async fn stop_debug_session(session_id: String) -> Result<(), String> {
    let sessions = get_debug_sessions();
    
    if let Some(mut session) = sessions.remove(&session_id) {
        session.state = DebugState::Stopped;
        log::info!("Stopped debug session {}", session_id);
        Ok(())
    } else {
        Err(format!("Debug session {} not found", session_id))
    }
}

#[command]
pub async fn set_breakpoint(
    file: String,
    line: u32,
    column: Option<u32>,
    condition: Option<String>,
) -> Result<Breakpoint, String> {
    let breakpoints = get_breakpoints();
    
    let breakpoint = Breakpoint {
        id: uuid::Uuid::new_v4().to_string(),
        file: file.clone(),
        line,
        column,
        condition,
        hit_condition: None,
        log_message: None,
        enabled: true,
        verified: true, // Simplified - would verify with actual debugger
    };

    let file_breakpoints = breakpoints.entry(file).or_insert_with(Vec::new);
    file_breakpoints.push(breakpoint.clone());

    log::info!("Set breakpoint at {}:{}", breakpoint.file, breakpoint.line);
    Ok(breakpoint)
}

#[command]
pub async fn remove_breakpoint(breakpoint_id: String) -> Result<(), String> {
    let breakpoints = get_breakpoints();
    
    for (_, file_breakpoints) in breakpoints.iter_mut() {
        if let Some(pos) = file_breakpoints.iter().position(|bp| bp.id == breakpoint_id) {
            let removed = file_breakpoints.remove(pos);
            log::info!("Removed breakpoint at {}:{}", removed.file, removed.line);
            return Ok(());
        }
    }

    Err(format!("Breakpoint {} not found", breakpoint_id))
}

#[command]
pub async fn step_over(session_id: String) -> Result<(), String> {
    let sessions = get_debug_sessions();
    
    if let Some(session) = sessions.get_mut(&session_id) {
        match session.state {
            DebugState::Paused => {
                session.state = DebugState::Running;
                log::info!("Step over in session {}", session_id);
                
                // Simulate pausing after step
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                session.state = DebugState::Paused;
                
                Ok(())
            }
            _ => Err("Cannot step over: session not paused".to_string()),
        }
    } else {
        Err(format!("Debug session {} not found", session_id))
    }
}

#[command]
pub async fn step_into(session_id: String) -> Result<(), String> {
    let sessions = get_debug_sessions();
    
    if let Some(session) = sessions.get_mut(&session_id) {
        match session.state {
            DebugState::Paused => {
                session.state = DebugState::Running;
                log::info!("Step into in session {}", session_id);
                
                // Simulate pausing after step
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                session.state = DebugState::Paused;
                
                Ok(())
            }
            _ => Err("Cannot step into: session not paused".to_string()),
        }
    } else {
        Err(format!("Debug session {} not found", session_id))
    }
}

#[command]
pub async fn step_out(session_id: String) -> Result<(), String> {
    let sessions = get_debug_sessions();
    
    if let Some(session) = sessions.get_mut(&session_id) {
        match session.state {
            DebugState::Paused => {
                session.state = DebugState::Running;
                log::info!("Step out in session {}", session_id);
                
                // Simulate pausing after step
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                session.state = DebugState::Paused;
                
                Ok(())
            }
            _ => Err("Cannot step out: session not paused".to_string()),
        }
    } else {
        Err(format!("Debug session {} not found", session_id))
    }
}

#[command]
pub async fn continue_execution(session_id: String) -> Result<(), String> {
    let sessions = get_debug_sessions();
    
    if let Some(session) = sessions.get_mut(&session_id) {
        session.state = DebugState::Running;
        log::info!("Continue execution in session {}", session_id);
        Ok(())
    } else {
        Err(format!("Debug session {} not found", session_id))
    }
}

#[command]
pub async fn get_variables(session_id: String, frame_id: u32) -> Result<Vec<Variable>, String> {
    let sessions = get_debug_sessions();
    
    if let Some(session) = sessions.get(&session_id) {
        // Mock variables based on language
        let variables = match session.language.as_str() {
            "javascript" | "typescript" => vec![
                Variable {
                    name: "window".to_string(),
                    value: "Window {...}".to_string(),
                    type_name: "Window".to_string(),
                    variables_reference: 1,
                    named_variables: Some(10),
                    indexed_variables: None,
                },
                Variable {
                    name: "document".to_string(),
                    value: "Document {...}".to_string(),
                    type_name: "Document".to_string(),
                    variables_reference: 2,
                    named_variables: Some(20),
                    indexed_variables: None,
                },
            ],
            "python" => vec![
                Variable {
                    name: "__builtins__".to_string(),
                    value: "<module 'builtins' (built-in)>".to_string(),
                    type_name: "module".to_string(),
                    variables_reference: 1,
                    named_variables: Some(50),
                    indexed_variables: None,
                },
                Variable {
                    name: "__name__".to_string(),
                    value: "'__main__'".to_string(),
                    type_name: "str".to_string(),
                    variables_reference: 0,
                    named_variables: None,
                    indexed_variables: None,
                },
            ],
            "rust" => vec![
                Variable {
                    name: "argc".to_string(),
                    value: "1".to_string(),
                    type_name: "i32".to_string(),
                    variables_reference: 0,
                    named_variables: None,
                    indexed_variables: None,
                },
                Variable {
                    name: "argv".to_string(),
                    value: "*const *const u8".to_string(),
                    type_name: "*const *const u8".to_string(),
                    variables_reference: 3,
                    named_variables: None,
                    indexed_variables: Some(1),
                },
            ],
            _ => vec![],
        };

        Ok(variables)
    } else {
        Err(format!("Debug session {} not found", session_id))
    }
}

#[command]
pub async fn evaluate_expression(
    session_id: String,
    expression: String,
    frame_id: Option<u32>,
) -> Result<EvaluateResponse, String> {
    let sessions = get_debug_sessions();
    
    if let Some(session) = sessions.get(&session_id) {
        // Mock evaluation based on expression
        let (result, type_name) = match expression.as_str() {
            "1 + 1" => ("2".to_string(), "number".to_string()),
            "typeof window" => ("'object'".to_string(), "string".to_string()),
            "console" => ("Console {...}".to_string(), "Console".to_string()),
            _ => (format!("'{}'", expression), "unknown".to_string()),
        };

        Ok(EvaluateResponse {
            result,
            type_name,
            variables_reference: 0,
        })
    } else {
        Err(format!("Debug session {} not found", session_id))
    }
}