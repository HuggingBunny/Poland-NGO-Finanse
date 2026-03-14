use crate::commands::auth::DbState;
use crate::models::{LegalChange, LegalChangeWithStatus, LegalFeed};
use chrono::{NaiveDate, Utc};
use rusqlite::params;
use tauri::State;

const FEED_URL: &str = "https://raw.githubusercontent.com/HuggingBunny/Poland-NGO-Finanse/main/legal-updates.json";

#[tauri::command]
pub fn get_legal_updates(db: State<DbState>) -> Vec<LegalChangeWithStatus> {
    let conn = db.0.lock().unwrap();

    // Try fetching from remote, fall back to cached/bundled
    let feed: Option<LegalFeed> = reqwest::blocking::get(FEED_URL)
        .ok()
        .and_then(|r| r.json().ok());

    let changes = match feed {
        Some(f) => {
            // Cache the raw JSON in settings
            if let Ok(raw) = serde_json::to_string(&f) {
                let _ = conn.execute(
                    "INSERT INTO app_settings (key,value) VALUES ('legal_feed_cache',?1)
                     ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                    params![raw],
                );
            }
            f.changes
        }
        None => {
            // Try cached
            conn.query_row(
                "SELECT value FROM app_settings WHERE key='legal_feed_cache'",
                [],
                |r| r.get::<_, String>(0),
            )
            .ok()
            .and_then(|raw| serde_json::from_str::<LegalFeed>(&raw).ok())
            .map(|f| f.changes)
            .unwrap_or_default()
        }
    };

    let today = Utc::now().date_naive();
    let dismissed_ids: Vec<String> = {
        let mut stmt = conn.prepare("SELECT change_id FROM legal_updates_dismissed").unwrap();
        stmt.query_map([], |r| r.get(0)).unwrap().filter_map(|r| r.ok()).collect()
    };

    changes.into_iter().map(|c| {
        let days_until = NaiveDate::parse_from_str(&c.effective_date, "%Y-%m-%d")
            .map(|d| (d - today).num_days())
            .unwrap_or(9999);
        let dismissed = dismissed_ids.contains(&c.id);
        LegalChangeWithStatus { change: c, days_until, dismissed }
    }).collect()
}

#[tauri::command]
pub fn dismiss_legal_update(change_id: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR REPLACE INTO legal_updates_dismissed (change_id, dismissed_at) VALUES (?1,?2)",
        params![change_id, now],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn apply_legal_update(change_id: String, db: State<DbState>) -> Result<(), String> {
    // In pre-beta: mark as applied via a settings key
    // In future: fetch rates JSON and update ZUS/PIT tables
    let conn = db.0.lock().unwrap();
    let key = format!("legal_applied_{}", change_id);
    let now = Utc::now().to_rfc3339();
    conn.execute(
        "INSERT OR REPLACE INTO app_settings (key,value) VALUES (?1,?2)",
        params![key, now],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
