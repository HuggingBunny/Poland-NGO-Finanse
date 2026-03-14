use crate::commands::auth::DbState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tauri::State;

const SYSTEM_PROMPT: &str = r#"You are an expert Polish NGO accounting assistant. Extract structured data from the receipt/invoice image or text provided. Return ONLY valid JSON with these fields:
{"vendor_name":"string","date":"YYYY-MM-DD","amount_gross":number,"amount_net":number,"vat_rate":number,"vat_amount":number,"category":"biuro|podróże|catering|sprzęt|usługi|inne","description":"string","invoice_number":"string or null","nip":"string or null","confidence":number,"reasoning":"string"}
Do not include any explanation outside the JSON."#;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaReceiptResult {
    pub vendor_name: String,
    pub date: String,
    pub amount_gross: f64,
    pub amount_net: f64,
    pub vat_rate: f64,
    pub vat_amount: f64,
    pub category: String,
    pub description: String,
    pub invoice_number: Option<String>,
    pub nip: Option<String>,
    pub confidence: f64,
    pub reasoning: String,
    pub raw_response: String,
    pub model_used: String,
}

#[derive(Serialize)]
struct OllamaGenerateRequest {
    model: String,
    prompt: String,
    system: String,
    stream: bool,
}

#[derive(Deserialize)]
struct OllamaGenerateResponse {
    response: String,
}

/// Strips markdown code fences from a string if present.
fn extract_json(raw: &str) -> String {
    let trimmed = raw.trim();
    // Remove ```json ... ``` or ``` ... ``` fences
    if trimmed.starts_with("```") {
        let without_open = trimmed
            .trim_start_matches("```json")
            .trim_start_matches("```")
            .trim_start_matches('\n');
        if let Some(close) = without_open.rfind("```") {
            return without_open[..close].trim().to_string();
        }
        return without_open.trim().to_string();
    }
    trimmed.to_string()
}

#[tauri::command]
pub async fn process_receipt_with_ollama(
    file_path: String,
    db: State<'_, DbState>,
) -> Result<OllamaReceiptResult, String> {
    // Read settings with mutex held, then drop lock before any .await
    let (ollama_url, ollama_model) = {
        let conn = db.0.lock().unwrap();
        let url = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key='ollama_url'",
                [],
                |r| r.get::<_, String>(0),
            )
            .unwrap_or_else(|_| "http://127.0.0.1:11434".to_string());
        let model = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key='ollama_model'",
                [],
                |r| r.get::<_, String>(0),
            )
            .unwrap_or_else(|_| "llama3".to_string());
        (url, model)
    };
    // Mutex is released here — safe to .await below

    // Read the file
    let file_content = tokio::fs::read(&file_path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // For text-like files, decode as UTF-8; for binary, base64 encode
    let prompt_content = match std::str::from_utf8(&file_content) {
        Ok(text) => format!("Analyze this receipt/invoice text:\n\n{}", text),
        Err(_) => {
            use std::fmt::Write as _;
            let mut hex = String::with_capacity(file_content.len() * 2);
            for b in &file_content[..file_content.len().min(4096)] {
                let _ = write!(hex, "{:02x}", b);
            }
            format!("Analyze this receipt/invoice (binary file, first 4KB hex):\n{}", hex)
        }
    };

    let request_body = OllamaGenerateRequest {
        model: ollama_model.clone(),
        prompt: prompt_content,
        system: SYSTEM_PROMPT.to_string(),
        stream: false,
    };

    let generate_url = format!("{}/api/generate", ollama_url.trim_end_matches('/'));

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    let response = client
        .post(&generate_url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Ollama returned HTTP {}", response.status()));
    }

    let ollama_resp: OllamaGenerateResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    let raw_response = ollama_resp.response.clone();
    let json_str = extract_json(&raw_response);

    // Parse the JSON
    let parsed: serde_json::Value =
        serde_json::from_str(&json_str).map_err(|e| format!("Failed to parse AI JSON: {} — raw: {}", e, json_str))?;

    let result = OllamaReceiptResult {
        vendor_name: parsed["vendor_name"]
            .as_str()
            .unwrap_or("Unknown")
            .to_string(),
        date: parsed["date"]
            .as_str()
            .unwrap_or("2024-01-01")
            .to_string(),
        amount_gross: parsed["amount_gross"].as_f64().unwrap_or(0.0),
        amount_net: parsed["amount_net"].as_f64().unwrap_or(0.0),
        vat_rate: parsed["vat_rate"].as_f64().unwrap_or(23.0),
        vat_amount: parsed["vat_amount"].as_f64().unwrap_or(0.0),
        category: parsed["category"]
            .as_str()
            .unwrap_or("inne")
            .to_string(),
        description: parsed["description"]
            .as_str()
            .unwrap_or("")
            .to_string(),
        invoice_number: parsed["invoice_number"].as_str().map(|s| s.to_string()),
        nip: parsed["nip"].as_str().map(|s| s.to_string()),
        confidence: parsed["confidence"].as_f64().unwrap_or(0.5),
        reasoning: parsed["reasoning"].as_str().unwrap_or("").to_string(),
        raw_response,
        model_used: ollama_model,
    };

    Ok(result)
}

#[tauri::command]
pub async fn test_ollama_connection(db: State<'_, DbState>) -> Result<bool, String> {
    // Read URL with mutex held, then drop before .await
    let ollama_url = {
        let conn = db.0.lock().unwrap();
        conn.query_row(
            "SELECT value FROM app_settings WHERE key='ollama_url'",
            [],
            |r| r.get::<_, String>(0),
        )
        .unwrap_or_else(|_| "http://127.0.0.1:11434".to_string())
    };

    let tags_url = format!("{}/api/tags", ollama_url.trim_end_matches('/'));

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    match client.get(&tags_url).send().await {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}
