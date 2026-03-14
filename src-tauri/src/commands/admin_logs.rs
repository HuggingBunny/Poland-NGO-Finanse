use crate::commands::auth::DbState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdminLog {
    pub id: String,
    pub level: String,
    pub module: String,
    pub message: String,
    pub user_id: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct AddAdminLogPayload {
    pub level: Option<String>,
    pub module: String,
    pub message: String,
    pub user_id: Option<String>,
    pub metadata: Option<String>,
}

fn row_to_log(row: &rusqlite::Row) -> rusqlite::Result<AdminLog> {
    Ok(AdminLog {
        id: row.get(0)?,
        level: row.get(1)?,
        module: row.get(2)?,
        message: row.get(3)?,
        user_id: row.get(4)?,
        metadata: row.get(5)?,
        created_at: row.get(6)?,
    })
}

#[tauri::command]
pub fn get_admin_logs(
    limit: Option<i64>,
    level: Option<String>,
    db: State<DbState>,
) -> Vec<AdminLog> {
    let conn = db.0.lock().unwrap();
    let effective_limit = limit.unwrap_or(500);

    match level {
        Some(lvl) => {
            let mut stmt = conn
                .prepare(
                    "SELECT id,level,module,message,user_id,metadata,created_at
                     FROM admin_logs WHERE level=?1
                     ORDER BY created_at DESC LIMIT ?2",
                )
                .unwrap();
            stmt.query_map(params![lvl, effective_limit], row_to_log)
                .unwrap()
                .filter_map(|r| r.ok())
                .collect()
        }
        None => {
            let mut stmt = conn
                .prepare(
                    "SELECT id,level,module,message,user_id,metadata,created_at
                     FROM admin_logs ORDER BY created_at DESC LIMIT ?1",
                )
                .unwrap();
            stmt.query_map(params![effective_limit], row_to_log)
                .unwrap()
                .filter_map(|r| r.ok())
                .collect()
        }
    }
}

#[tauri::command]
pub fn add_admin_log(payload: AddAdminLogPayload, db: State<DbState>) -> Result<String, String> {
    let conn = db.0.lock().unwrap();
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let level = payload.level.unwrap_or_else(|| "info".to_string());
    conn.execute(
        "INSERT INTO admin_logs (id,level,module,message,user_id,metadata,created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7)",
        params![
            id,
            level,
            payload.module,
            payload.message,
            payload.user_id,
            payload.metadata,
            now
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn cleanup_old_logs(db: State<DbState>) -> Result<usize, String> {
    let conn = db.0.lock().unwrap();
    let cutoff = chrono::Utc::now()
        .checked_sub_signed(chrono::Duration::days(30))
        .map(|dt| dt.to_rfc3339())
        .unwrap_or_default();
    let count = conn
        .execute(
            "DELETE FROM admin_logs WHERE created_at < ?1",
            params![cutoff],
        )
        .map_err(|e| e.to_string())?;
    Ok(count)
}
