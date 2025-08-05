use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::{Command, Stdio};
use tauri::command;
use tokio::process::Child;

#[derive(Debug, Serialize, Deserialize)]
pub struct Terminal {
    pub id: String,
    pub name: String,
    pub shell: String,
    pub cwd: String,
    pub env: HashMap<String, String>,
    pub size: TerminalSize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TerminalSize {
    pub cols: u16,
    pub rows: u16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TerminalOutput {
    pub terminal_id: String,
    pub data: String,
    pub timestamp: u64,
}

// Global state for managing terminals
static mut TERMINALS: Option<HashMap<String, Terminal>> = None;

fn get_terminals() -> &'static mut HashMap<String, Terminal> {
    unsafe {
        if TERMINALS.is_none() {
            TERMINALS = Some(HashMap::new());
        }
        TERMINALS.as_mut().unwrap()
    }
}

#[command]
pub async fn create_terminal(
    terminal_id: String,
    name: String,
    shell: Option<String>,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
) -> Result<Terminal, String> {
    let terminals = get_terminals();
    
    // Check if terminal already exists
    if terminals.contains_key(&terminal_id) {
        return Err(format!("Terminal {} already exists", terminal_id));
    }

    let default_shell = if cfg!(windows) {
        "cmd.exe".to_string()
    } else {
        "/bin/bash".to_string()
    };

    let default_cwd = std::env::current_dir()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let terminal = Terminal {
        id: terminal_id.clone(),
        name,
        shell: shell.unwrap_or(default_shell),
        cwd: cwd.unwrap_or(default_cwd),
        env: env.unwrap_or_default(),
        size: TerminalSize { cols: 80, rows: 24 },
    };

    // In a real implementation, this would spawn the actual terminal process
    log::info!("Created terminal {} with shell {}", terminal_id, terminal.shell);

    terminals.insert(terminal_id, terminal.clone());
    Ok(terminal)
}

#[command]
pub async fn destroy_terminal(terminal_id: String) -> Result<(), String> {
    let terminals = get_terminals();
    
    if terminals.remove(&terminal_id).is_some() {
        log::info!("Destroyed terminal {}", terminal_id);
        Ok(())
    } else {
        Err(format!("Terminal {} not found", terminal_id))
    }
}

#[command]
pub async fn send_terminal_input(
    terminal_id: String,
    input: String,
) -> Result<(), String> {
    let terminals = get_terminals();
    
    if let Some(terminal) = terminals.get(&terminal_id) {
        log::info!("Sending input to terminal {}: {}", terminal_id, input);
        
        // In a real implementation, this would send input to the terminal process
        // For now, just log the input
        
        Ok(())
    } else {
        Err(format!("Terminal {} not found", terminal_id))
    }
}

#[command]
pub async fn resize_terminal(
    terminal_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let terminals = get_terminals();
    
    if let Some(terminal) = terminals.get_mut(&terminal_id) {
        terminal.size = TerminalSize { cols, rows };
        log::info!("Resized terminal {} to {}x{}", terminal_id, cols, rows);
        Ok(())
    } else {
        Err(format!("Terminal {} not found", terminal_id))
    }
}

#[command]
pub async fn get_terminal_output(terminal_id: String) -> Result<Vec<TerminalOutput>, String> {
    let terminals = get_terminals();
    
    if let Some(_terminal) = terminals.get(&terminal_id) {
        // In a real implementation, this would return the actual terminal output
        // For now, return mock output
        let mock_output = vec![
            TerminalOutput {
                terminal_id: terminal_id.clone(),
                data: "Welcome to Mini Claude Code Terminal\r\n".to_string(),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
            },
            TerminalOutput {
                terminal_id: terminal_id.clone(),
                data: format!("$ "),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs(),
            },
        ];
        
        Ok(mock_output)
    } else {
        Err(format!("Terminal {} not found", terminal_id))
    }
}

// Helper functions for command execution
#[command]
pub async fn execute_command(
    command: String,
    args: Vec<String>,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
) -> Result<String, String> {
    let mut cmd = Command::new(command);
    cmd.args(args);
    
    if let Some(cwd) = cwd {
        cmd.current_dir(cwd);
    }
    
    if let Some(env) = env {
        cmd.envs(env);
    }
    
    cmd.stdout(Stdio::piped())
       .stderr(Stdio::piped());
    
    match cmd.output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            
            if output.status.success() {
                Ok(stdout.to_string())
            } else {
                Err(format!("Command failed: {}", stderr))
            }
        }
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}

#[command]
pub async fn get_shell_completions(
    terminal_id: String,
    partial_command: String,
) -> Result<Vec<String>, String> {
    let terminals = get_terminals();
    
    if let Some(_terminal) = terminals.get(&terminal_id) {
        // Mock shell completions
        let completions = if partial_command.starts_with("npm") {
            vec![
                "npm install".to_string(),
                "npm start".to_string(),
                "npm run".to_string(),
                "npm test".to_string(),
                "npm build".to_string(),
            ]
        } else if partial_command.starts_with("git") {
            vec![
                "git add".to_string(),
                "git commit".to_string(),
                "git push".to_string(),
                "git pull".to_string(),
                "git status".to_string(),
                "git log".to_string(),
            ]
        } else if partial_command.starts_with("cargo") {
            vec![
                "cargo build".to_string(),
                "cargo run".to_string(),
                "cargo test".to_string(),
                "cargo check".to_string(),
                "cargo clean".to_string(),
            ]
        } else {
            vec![
                "ls".to_string(),
                "cd".to_string(),
                "pwd".to_string(),
                "mkdir".to_string(),
                "rm".to_string(),
                "cp".to_string(),
                "mv".to_string(),
            ]
        };
        
        // Filter completions based on partial command
        let filtered: Vec<String> = completions
            .into_iter()
            .filter(|c| c.starts_with(&partial_command))
            .collect();
            
        Ok(filtered)
    } else {
        Err(format!("Terminal {} not found", terminal_id))
    }
}

#[command]
pub async fn get_command_history(terminal_id: String) -> Result<Vec<String>, String> {
    let terminals = get_terminals();
    
    if let Some(_terminal) = terminals.get(&terminal_id) {
        // Mock command history
        let history = vec![
            "npm install".to_string(),
            "npm start".to_string(),
            "git status".to_string(),
            "git add .".to_string(),
            "git commit -m \"Initial commit\"".to_string(),
            "code .".to_string(),
        ];
        
        Ok(history)
    } else {
        Err(format!("Terminal {} not found", terminal_id))
    }
}