use std::collections::HashMap;
use std::path::Path;
use serde::{Deserialize, Serialize};
use tauri::State;
use tantivy::{
    collector::TopDocs,
    query::{QueryParser, BooleanQuery, TermQuery, RangeQuery, FuzzyTermQuery, Occur},
    schema::{Field, IndexRecordOption},
    Index, IndexReader, Searcher, Term, Order,
    DateTime as TantivyDateTime,
};
use chrono::{DateTime, Utc, TimeZone};
use anyhow::{Result, Context};
use regex::Regex;

use crate::{AppState, indexer::IndexFields};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchQuery {
    pub text: String,
    pub filters: SearchFilters,
    pub sort_by: Option<SortBy>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchFilters {
    pub file_types: Option<Vec<String>>,
    pub mime_types: Option<Vec<String>>,
    pub size_range: Option<SizeRange>,
    pub date_range: Option<DateRange>,
    pub paths: Option<Vec<String>>,
    pub exclude_paths: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SizeRange {
    pub min: Option<u64>,
    pub max: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateRange {
    pub start: Option<DateTime<Utc>>,
    pub end: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SortBy {
    Relevance,
    ModifiedDate,
    Size,
    Name,
    FileType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub path: String,
    pub title: String,
    pub snippet: String,
    pub file_type: String,
    pub mime_type: String,
    pub size: u64,
    pub modified_at: DateTime<Utc>,
    pub score: f32,
    pub highlights: Vec<Highlight>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Highlight {
    pub field: String,
    pub text: String,
    pub start_offset: usize,
    pub end_offset: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchSuggestion {
    pub text: String,
    pub category: String,
    pub frequency: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResults {
    pub results: Vec<SearchResult>,
    pub total_hits: usize,
    pub query_time_ms: u64,
    pub suggestions: Vec<SearchSuggestion>,
}

pub struct SearchEngine {
    index: Index,
    reader: IndexReader,
    query_parser: QueryParser,
    fields: SearchFields,
}

struct SearchFields {
    id: Field,
    path: Field,
    title: Field,
    content: Field,
    file_type: Field,
    mime_type: Field,
    size: Field,
    modified_at: Field,
    indexed_at: Field,
    hash: Field,
}

impl SearchEngine {
    pub fn new<P: AsRef<Path>>(data_dir: P) -> Result<Self> {
        let index_dir = data_dir.as_ref().join("index");
        
        // Open existing index
        let index = Index::open_in_dir(&index_dir)
            .with_context(|| format!("Failed to open search index: {:?}", index_dir))?;
        
        let reader = index.reader_builder()
            .reload_policy(tantivy::ReloadPolicy::OnCommit)
            .try_into()
            .context("Failed to create search index reader")?;
        
        let schema = index.schema();
        
        // Get fields from schema
        let fields = SearchFields {
            id: schema.get_field("id").context("Missing 'id' field in index")?,
            path: schema.get_field("path").context("Missing 'path' field in index")?,
            title: schema.get_field("title").context("Missing 'title' field in index")?,
            content: schema.get_field("content").context("Missing 'content' field in index")?,
            file_type: schema.get_field("file_type").context("Missing 'file_type' field in index")?,
            mime_type: schema.get_field("mime_type").context("Missing 'mime_type' field in index")?,
            size: schema.get_field("size").context("Missing 'size' field in index")?,
            modified_at: schema.get_field("modified_at").context("Missing 'modified_at' field in index")?,
            indexed_at: schema.get_field("indexed_at").context("Missing 'indexed_at' field in index")?,
            hash: schema.get_field("hash").context("Missing 'hash' field in index")?,
        };
        
        // Create query parser for full-text search
        let mut query_parser = QueryParser::for_index(&index, vec![fields.title, fields.content]);
        query_parser.set_conjunction_by_default();
        
        Ok(SearchEngine {
            index,
            reader,
            query_parser,
            fields,
        })
    }
    
    pub fn search(&self, search_query: &SearchQuery) -> Result<SearchResults> {
        let start_time = std::time::Instant::now();
        let searcher = self.reader.searcher();
        
        // Build query
        let query = self.build_query(search_query)?;
        
        // Set up collector
        let limit = search_query.limit.unwrap_or(50);
        let offset = search_query.offset.unwrap_or(0);
        
        let collector = match &search_query.sort_by {
            Some(SortBy::ModifiedDate) => {
                TopDocs::with_limit(limit + offset)
                    .order_by_u64_field(self.fields.modified_at)
            }
            Some(SortBy::Size) => {
                TopDocs::with_limit(limit + offset)
                    .order_by_u64_field(self.fields.size)
            }
            Some(SortBy::Name) => {
                TopDocs::with_limit(limit + offset)
                    .order_by_field(self.fields.title, Order::Asc)
            }
            _ => TopDocs::with_limit(limit + offset), // Default to relevance
        };
        
        // Execute search
        let top_docs = searcher.search(&query, &collector)
            .context("Failed to execute search query")?;
        
        let total_hits = top_docs.len();
        
        // Process results
        let mut results = Vec::new();
        for (score, doc_address) in top_docs.into_iter().skip(offset).take(limit) {
            let doc = searcher.doc(doc_address)
                .context("Failed to retrieve document")?;
            
            let result = self.doc_to_search_result(&doc, score, &search_query.text)?;
            results.push(result);
        }
        
        let query_time_ms = start_time.elapsed().as_millis() as u64;
        
        // Generate suggestions (simplified)
        let suggestions = self.generate_suggestions(&search_query.text, &searcher)?;
        
        Ok(SearchResults {
            results,
            total_hits,
            query_time_ms,
            suggestions,
        })
    }
    
    fn build_query(&self, search_query: &SearchQuery) -> Result<Box<dyn tantivy::query::Query>> {
        let mut subqueries = Vec::new();
        
        // Main text query
        if !search_query.text.trim().is_empty() {
            let text_query = self.query_parser.parse_query(&search_query.text)
                .context("Failed to parse search query")?;
            subqueries.push((Occur::Must, text_query));
        }
        
        // File type filters
        if let Some(file_types) = &search_query.filters.file_types {
            let mut file_type_queries = Vec::new();
            for file_type in file_types {
                let term = Term::from_field_text(self.fields.file_type, file_type);
                let term_query = TermQuery::new(term, IndexRecordOption::Basic);
                file_type_queries.push((Occur::Should, Box::new(term_query) as Box<dyn tantivy::query::Query>));
            }
            if !file_type_queries.is_empty() {
                let bool_query = BooleanQuery::new(file_type_queries);
                subqueries.push((Occur::Must, Box::new(bool_query)));
            }
        }
        
        // MIME type filters
        if let Some(mime_types) = &search_query.filters.mime_types {
            let mut mime_type_queries = Vec::new();
            for mime_type in mime_types {
                let term = Term::from_field_text(self.fields.mime_type, mime_type);
                let term_query = TermQuery::new(term, IndexRecordOption::Basic);
                mime_type_queries.push((Occur::Should, Box::new(term_query) as Box<dyn tantivy::query::Query>));
            }
            if !mime_type_queries.is_empty() {
                let bool_query = BooleanQuery::new(mime_type_queries);
                subqueries.push((Occur::Must, Box::new(bool_query)));
            }
        }
        
        // Size range filter
        if let Some(size_range) = &search_query.filters.size_range {
            let min = size_range.min.unwrap_or(0);
            let max = size_range.max.unwrap_or(u64::MAX);
            
            let range_query = RangeQuery::new_u64_bounds(
                self.fields.size,
                tantivy::query::Bound::Included(min),
                tantivy::query::Bound::Included(max),
            );
            subqueries.push((Occur::Must, Box::new(range_query)));
        }
        
        // Date range filter
        if let Some(date_range) = &search_query.filters.date_range {
            if let (Some(start), Some(end)) = (date_range.start, date_range.end) {
                let start_dt = TantivyDateTime::from_timestamp_secs(start.timestamp());
                let end_dt = TantivyDateTime::from_timestamp_secs(end.timestamp());
                
                let range_query = RangeQuery::new_date_bounds(
                    self.fields.modified_at,
                    tantivy::query::Bound::Included(start_dt),
                    tantivy::query::Bound::Included(end_dt),
                );
                subqueries.push((Occur::Must, Box::new(range_query)));
            }
        }
        
        // Path filters
        if let Some(paths) = &search_query.filters.paths {
            let mut path_queries = Vec::new();
            for path in paths {
                // Use fuzzy matching for paths to handle partial matches
                let term = Term::from_field_text(self.fields.path, path);
                let fuzzy_query = FuzzyTermQuery::new(term, 2, true);
                path_queries.push((Occur::Should, Box::new(fuzzy_query) as Box<dyn tantivy::query::Query>));
            }
            if !path_queries.is_empty() {
                let bool_query = BooleanQuery::new(path_queries);
                subqueries.push((Occur::Must, Box::new(bool_query)));
            }
        }
        
        // Exclude paths
        if let Some(exclude_paths) = &search_query.filters.exclude_paths {
            for path in exclude_paths {
                let term = Term::from_field_text(self.fields.path, path);
                let term_query = TermQuery::new(term, IndexRecordOption::Basic);
                subqueries.push((Occur::MustNot, Box::new(term_query)));
            }
        }
        
        // Combine all queries
        if subqueries.is_empty() {
            // If no queries, return all documents
            Ok(Box::new(tantivy::query::AllQuery))
        } else if subqueries.len() == 1 {
            Ok(subqueries.into_iter().next().unwrap().1)
        } else {
            Ok(Box::new(BooleanQuery::new(subqueries)))
        }
    }
    
    fn doc_to_search_result(
        &self,
        doc: &tantivy::Document,
        score: f32,
        query_text: &str,
    ) -> Result<SearchResult> {
        let id = doc.get_first(self.fields.id)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string();
        
        let path = doc.get_first(self.fields.path)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string();
        
        let title = doc.get_first(self.fields.title)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string();
        
        let content = doc.get_first(self.fields.content)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string();
        
        let file_type = doc.get_first(self.fields.file_type)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string();
        
        let mime_type = doc.get_first(self.fields.mime_type)
            .and_then(|v| v.as_text())
            .unwrap_or("")
            .to_string();
        
        let size = doc.get_first(self.fields.size)
            .and_then(|v| v.as_u64())
            .unwrap_or(0);
        
        let modified_timestamp = doc.get_first(self.fields.modified_at)
            .and_then(|v| v.as_date())
            .map(|dt| dt.into_timestamp_secs())
            .unwrap_or(0);
        
        let modified_at = Utc.timestamp_opt(modified_timestamp, 0)
            .single()
            .unwrap_or_default();
        
        // Generate snippet from content
        let snippet = self.generate_snippet(&content, query_text, 200);
        
        // Generate highlights (simplified)
        let highlights = self.generate_highlights(&content, query_text);
        
        Ok(SearchResult {
            id,
            path,
            title,
            snippet,
            file_type,
            mime_type,
            size,
            modified_at,
            score,
            highlights,
        })
    }
    
    fn generate_snippet(&self, content: &str, query: &str, max_length: usize) -> String {
        if content.len() <= max_length {
            return content.to_string();
        }
        
        // Simple snippet generation - find first occurrence of query terms
        let query_words: Vec<&str> = query.split_whitespace().collect();
        
        for word in &query_words {
            if let Some(pos) = content.to_lowercase().find(&word.to_lowercase()) {
                let start = pos.saturating_sub(max_length / 4);
                let end = (pos + word.len() + max_length * 3 / 4).min(content.len());
                
                let mut snippet = content[start..end].to_string();
                
                if start > 0 {
                    snippet = format!("...{}", snippet);
                }
                if end < content.len() {
                    snippet = format!("{}...", snippet);
                }
                
                return snippet;
            }
        }
        
        // If no query words found, return beginning of content
        let end = max_length.min(content.len());
        let mut snippet = content[..end].to_string();
        if end < content.len() {
            snippet = format!("{}...", snippet);
        }
        snippet
    }
    
    fn generate_highlights(&self, content: &str, query: &str) -> Vec<Highlight> {
        let mut highlights = Vec::new();
        let query_words: Vec<&str> = query.split_whitespace().collect();
        
        for word in query_words {
            if let Ok(regex) = Regex::new(&format!(r"(?i)\b{}\b", regex::escape(word))) {
                for mat in regex.find_iter(content) {
                    highlights.push(Highlight {
                        field: "content".to_string(),
                        text: mat.as_str().to_string(),
                        start_offset: mat.start(),
                        end_offset: mat.end(),
                    });
                }
            }
        }
        
        highlights
    }
    
    fn generate_suggestions(&self, query: &str, searcher: &Searcher) -> Result<Vec<SearchSuggestion>> {
        // Simplified suggestion generation
        let mut suggestions = Vec::new();
        
        // Add some common file type suggestions
        let common_types = ["pdf", "txt", "md", "doc", "docx", "jpg", "png"];
        for file_type in &common_types {
            if file_type.contains(&query.to_lowercase()) {
                suggestions.push(SearchSuggestion {
                    text: format!("filetype:{}", file_type),
                    category: "File Type".to_string(),
                    frequency: 1, // Simplified
                });
            }
        }
        
        // Limit suggestions
        suggestions.truncate(5);
        
        Ok(suggestions)
    }
    
    pub fn shutdown(self) -> Result<()> {
        // Index reader will be dropped automatically
        Ok(())
    }
}

// Default implementations
impl Default for SearchFilters {
    fn default() -> Self {
        SearchFilters {
            file_types: None,
            mime_types: None,
            size_range: None,
            date_range: None,
            paths: None,
            exclude_paths: None,
        }
    }
}

impl Default for SearchQuery {
    fn default() -> Self {
        SearchQuery {
            text: String::new(),
            filters: SearchFilters::default(),
            sort_by: Some(SortBy::Relevance),
            limit: Some(50),
            offset: Some(0),
        }
    }
}

// Tauri commands
#[tauri::command]
pub async fn search_files(
    query: SearchQuery,
    state: State<'_, AppState>,
) -> Result<SearchResults, String> {
    let search_engine_guard = state.search_engine.lock();
    if let Some(search_engine) = search_engine_guard.as_ref() {
        search_engine.search(&query)
            .map_err(|e| e.to_string())
    } else {
        Err("Search engine not initialized".to_string())
    }
}

#[tauri::command]
pub async fn search_content(
    text: String,
    limit: Option<usize>,
    state: State<'_, AppState>,
) -> Result<SearchResults, String> {
    let query = SearchQuery {
        text,
        filters: SearchFilters::default(),
        sort_by: Some(SortBy::Relevance),
        limit,
        offset: Some(0),
    };
    
    search_files(query, state).await
}

#[tauri::command]
pub async fn get_search_suggestions(
    query: String,
    state: State<'_, AppState>,
) -> Result<Vec<SearchSuggestion>, String> {
    let search_engine_guard = state.search_engine.lock();
    if let Some(search_engine) = search_engine_guard.as_ref() {
        let searcher = search_engine.reader.searcher();
        search_engine.generate_suggestions(&query, &searcher)
            .map_err(|e| e.to_string())
    } else {
        Err("Search engine not initialized".to_string())
    }
}

#[tauri::command]
pub async fn advanced_search(
    text: String,
    file_types: Option<Vec<String>>,
    size_min: Option<u64>,
    size_max: Option<u64>,
    date_start: Option<String>,
    date_end: Option<String>,
    paths: Option<Vec<String>>,
    state: State<'_, AppState>,
) -> Result<SearchResults, String> {
    // Parse date strings
    let date_range = if let (Some(start_str), Some(end_str)) = (date_start, date_end) {
        let start = DateTime::parse_from_rfc3339(&start_str)
            .map_err(|e| format!("Invalid start date: {}", e))?
            .with_timezone(&Utc);
        let end = DateTime::parse_from_rfc3339(&end_str)
            .map_err(|e| format!("Invalid end date: {}", e))?
            .with_timezone(&Utc);
        Some(DateRange { start: Some(start), end: Some(end) })
    } else {
        None
    };
    
    let size_range = if size_min.is_some() || size_max.is_some() {
        Some(SizeRange { min: size_min, max: size_max })
    } else {
        None
    };
    
    let query = SearchQuery {
        text,
        filters: SearchFilters {
            file_types,
            mime_types: None,
            size_range,
            date_range,
            paths,
            exclude_paths: None,
        },
        sort_by: Some(SortBy::Relevance),
        limit: Some(50),
        offset: Some(0),
    };
    
    search_files(query, state).await
}