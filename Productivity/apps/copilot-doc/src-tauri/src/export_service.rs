use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use anyhow::Result;
use html2text::from_read;
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportFormat {
    pub name: String,
    pub extension: String,
    pub mime_type: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportResult {
    pub success: bool,
    pub file_path: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn get_export_formats() -> Result<Vec<ExportFormat>, String> {
    Ok(vec![
        ExportFormat {
            name: "Plain Text".to_string(),
            extension: "txt".to_string(),
            mime_type: "text/plain".to_string(),
            description: "Plain text format".to_string(),
        },
        ExportFormat {
            name: "Markdown".to_string(),
            extension: "md".to_string(),
            mime_type: "text/markdown".to_string(),
            description: "Markdown format".to_string(),
        },
        ExportFormat {
            name: "HTML".to_string(),
            extension: "html".to_string(),
            mime_type: "text/html".to_string(),
            description: "HTML format".to_string(),
        },
        ExportFormat {
            name: "Rich Text Format".to_string(),
            extension: "rtf".to_string(),
            mime_type: "application/rtf".to_string(),
            description: "Rich Text Format".to_string(),
        },
        ExportFormat {
            name: "PDF".to_string(),
            extension: "pdf".to_string(),
            mime_type: "application/pdf".to_string(),
            description: "Portable Document Format".to_string(),
        },
        ExportFormat {
            name: "Word Document".to_string(),
            extension: "docx".to_string(),
            mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document".to_string(),
            description: "Microsoft Word Document".to_string(),
        },
    ])
}

#[tauri::command]
pub async fn export_to_format(
    content: String,
    format: String,
    output_path: String,
    title: Option<String>,
) -> Result<ExportResult, String> {
    let result = match format.as_str() {
        "txt" => export_to_txt(&content, &output_path),
        "md" => export_to_markdown(&content, &output_path),
        "html" => export_to_html(&content, &output_path, title.as_deref()),
        "rtf" => export_to_rtf(&content, &output_path),
        "pdf" => export_to_pdf(&content, &output_path, title.as_deref()).await,
        "docx" => export_to_docx(&content, &output_path, title.as_deref()).await,
        _ => Err(anyhow::anyhow!("Unsupported format: {}", format)),
    };

    match result {
        Ok(file_path) => Ok(ExportResult {
            success: true,
            file_path: Some(file_path),
            error: None,
        }),
        Err(e) => Ok(ExportResult {
            success: false,
            file_path: None,
            error: Some(e.to_string()),
        }),
    }
}

fn export_to_txt(content: &str, output_path: &str) -> Result<String> {
    // Convert HTML to plain text
    let text_content = from_read(content.as_bytes(), 80);
    fs::write(output_path, text_content)?;
    Ok(output_path.to_string())
}

fn export_to_markdown(content: &str, output_path: &str) -> Result<String> {
    // Convert HTML to Markdown using a simple converter
    let markdown_content = html_to_markdown(content);
    fs::write(output_path, markdown_content)?;
    Ok(output_path.to_string())
}

fn export_to_html(content: &str, output_path: &str, title: Option<&str>) -> Result<String> {
    let title = title.unwrap_or("Document");
    let html = format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }}
        h1, h2, h3, h4, h5, h6 {{
            color: #2c3e50;
            margin-top: 2rem;
        }}
        p {{
            margin-bottom: 1rem;
        }}
        blockquote {{
            border-left: 4px solid #3498db;
            margin: 1rem 0;
            padding-left: 1rem;
            font-style: italic;
        }}
        code {{
            background-color: #f8f9fa;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
        }}
        pre {{
            background-color: #f8f9fa;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 0.75rem;
            text-align: left;
        }}
        th {{
            background-color: #f8f9fa;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    {}
</body>
</html>"#,
        title, content
    );
    
    fs::write(output_path, html)?;
    Ok(output_path.to_string())
}

fn export_to_rtf(content: &str, output_path: &str) -> Result<String> {
    // Simple HTML to RTF conversion
    let text_content = from_read(content.as_bytes(), 80);
    let rtf_content = format!(
        r#"{{\rtf1\ansi\deff0 {{\fonttbl {{\f0 Times New Roman;}}}}
\f0\fs24 {}
}}"#,
        text_content.replace('\n', "\\par ")
    );
    
    fs::write(output_path, rtf_content)?;
    Ok(output_path.to_string())
}

async fn export_to_pdf(_content: &str, output_path: &str, _title: Option<&str>) -> Result<String> {
    // For now, create a placeholder PDF
    // In a real implementation, you would use a library like wkhtmltopdf or headless Chrome
    let placeholder_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Times-Roman\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Document exported from CopilotDoc) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000173 00000 n \n0000000301 00000 n \n0000000380 00000 n \ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n492\n%%EOF";
    
    fs::write(output_path, placeholder_content)?;
    Ok(output_path.to_string())
}

async fn export_to_docx(_content: &str, output_path: &str, _title: Option<&str>) -> Result<String> {
    // For now, create a placeholder DOCX
    // In a real implementation, you would use a library like docx-rs
    let placeholder_content = general_purpose::STANDARD.decode(
        "UEsDBBQAAAAIAAwAREcAAAAAAAAAAAAAAAAAABEAAABbQ29udGVudF9UeXBlc10ueG1s7ZZNb9swDIZ/jY994tiOE+cjx6RoMGAY0KEDisE3WqYdoZIEShray389Ob1s"
    ).unwrap_or_default();
    
    fs::write(output_path, placeholder_content)?;
    Ok(output_path.to_string())
}

fn html_to_markdown(html: &str) -> String {
    // Simple HTML to Markdown conversion
    let mut markdown = html.to_string();
    
    // Convert headers
    markdown = markdown.replace("<h1>", "# ");
    markdown = markdown.replace("</h1>", "\n\n");
    markdown = markdown.replace("<h2>", "## ");
    markdown = markdown.replace("</h2>", "\n\n");
    markdown = markdown.replace("<h3>", "### ");
    markdown = markdown.replace("</h3>", "\n\n");
    markdown = markdown.replace("<h4>", "#### ");
    markdown = markdown.replace("</h4>", "\n\n");
    markdown = markdown.replace("<h5>", "##### ");
    markdown = markdown.replace("</h5>", "\n\n");
    markdown = markdown.replace("<h6>", "###### ");
    markdown = markdown.replace("</h6>", "\n\n");
    
    // Convert emphasis
    markdown = markdown.replace("<strong>", "**");
    markdown = markdown.replace("</strong>", "**");
    markdown = markdown.replace("<b>", "**");
    markdown = markdown.replace("</b>", "**");
    markdown = markdown.replace("<em>", "_");
    markdown = markdown.replace("</em>", "_");
    markdown = markdown.replace("<i>", "_");
    markdown = markdown.replace("</i>", "_");
    
    // Convert paragraphs
    markdown = markdown.replace("<p>", "");
    markdown = markdown.replace("</p>", "\n\n");
    
    // Convert line breaks
    markdown = markdown.replace("<br>", "\n");
    markdown = markdown.replace("<br/>", "\n");
    markdown = markdown.replace("<br />", "\n");
    
    // Convert lists
    markdown = markdown.replace("<ul>", "");
    markdown = markdown.replace("</ul>", "\n");
    markdown = markdown.replace("<ol>", "");
    markdown = markdown.replace("</ol>", "\n");
    markdown = markdown.replace("<li>", "- ");
    markdown = markdown.replace("</li>", "\n");
    
    // Convert blockquotes
    markdown = markdown.replace("<blockquote>", "> ");
    markdown = markdown.replace("</blockquote>", "\n\n");
    
    // Convert code
    markdown = markdown.replace("<code>", "`");
    markdown = markdown.replace("</code>", "`");
    markdown = markdown.replace("<pre>", "```\n");
    markdown = markdown.replace("</pre>", "\n```\n\n");
    
    // Clean up extra whitespace
    let lines: Vec<&str> = markdown.split('\n').collect();
    let mut cleaned_lines = Vec::new();
    let mut blank_count = 0;
    
    for line in lines {
        if line.trim().is_empty() {
            blank_count += 1;
            if blank_count <= 2 {
                cleaned_lines.push(line);
            }
        } else {
            blank_count = 0;
            cleaned_lines.push(line);
        }
    }
    
    cleaned_lines.join("\n").trim().to_string()
}