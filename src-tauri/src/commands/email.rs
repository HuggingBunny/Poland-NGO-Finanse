use crate::commands::auth::DbState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmailSettings {
    pub smtp_host: String,
    pub smtp_port: String,
    pub smtp_user: String,
    pub smtp_pass: String,
    pub from_address: String,
    pub from_name: String,
    pub enabled: bool,
}

impl Default for EmailSettings {
    fn default() -> Self {
        EmailSettings {
            smtp_host: String::new(),
            smtp_port: "587".to_string(),
            smtp_user: String::new(),
            smtp_pass: String::new(),
            from_address: String::new(),
            from_name: String::new(),
            enabled: false,
        }
    }
}

fn read_key(conn: &rusqlite::Connection, key: &str) -> String {
    conn.query_row(
        "SELECT value FROM email_settings WHERE key=?1",
        params![key],
        |r| r.get::<_, String>(0),
    )
    .unwrap_or_default()
}

#[tauri::command]
pub fn get_email_settings(db: State<DbState>) -> EmailSettings {
    let conn = db.0.lock().unwrap();
    let enabled_str = read_key(&conn, "enabled");
    EmailSettings {
        smtp_host: read_key(&conn, "smtp_host"),
        smtp_port: {
            let p = read_key(&conn, "smtp_port");
            if p.is_empty() { "587".to_string() } else { p }
        },
        smtp_user: read_key(&conn, "smtp_user"),
        smtp_pass: read_key(&conn, "smtp_pass"),
        from_address: read_key(&conn, "from_address"),
        from_name: read_key(&conn, "from_name"),
        enabled: enabled_str == "true" || enabled_str == "1",
    }
}

#[tauri::command]
pub fn save_email_settings(settings: EmailSettings, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    let pairs = [
        ("smtp_host", settings.smtp_host.as_str()),
        ("smtp_port", settings.smtp_port.as_str()),
        ("smtp_user", settings.smtp_user.as_str()),
        ("smtp_pass", settings.smtp_pass.as_str()),
        ("from_address", settings.from_address.as_str()),
        ("from_name", settings.from_name.as_str()),
        ("enabled", if settings.enabled { "true" } else { "false" }),
    ];
    for (key, value) in &pairs {
        conn.execute(
            "INSERT INTO email_settings (key,value) VALUES (?1,?2)
             ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            params![key, value],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}
