use crate::commands::auth::DbState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

/// Managed state holding the path to the SQLite database file.
pub struct DbPath(pub String);

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackupConfig {
    pub id: String,
    pub name: String,
    pub backup_type: String,
    pub path: String,
    pub enabled: bool,
    pub last_backup_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackupFile {
    pub file_name: String,
    pub file_path: String,
    pub size_bytes: u64,
    pub created_at: String,
    pub source: String,
}

#[derive(Debug, Deserialize)]
pub struct UpsertBackupConfigPayload {
    pub id: Option<String>,
    pub name: String,
    pub backup_type: String,
    pub path: String,
    pub enabled: Option<bool>,
}

fn row_to_config(row: &rusqlite::Row) -> rusqlite::Result<BackupConfig> {
    Ok(BackupConfig {
        id: row.get(0)?,
        name: row.get(1)?,
        backup_type: row.get(2)?,
        path: row.get(3)?,
        enabled: row.get::<_, i64>(4)? != 0,
        last_backup_at: row.get(5)?,
        created_at: row.get(6)?,
    })
}

#[tauri::command]
pub fn get_backup_configs(db: State<DbState>) -> Vec<BackupConfig> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id,name,backup_type,path,enabled,last_backup_at,created_at
             FROM backup_configs ORDER BY name ASC",
        )
        .unwrap();
    stmt.query_map([], row_to_config)
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
}

#[tauri::command]
pub fn upsert_backup_config(
    payload: UpsertBackupConfigPayload,
    db: State<DbState>,
) -> Result<String, String> {
    let conn = db.0.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();
    let id = payload.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let enabled = payload.enabled.unwrap_or(true);
    conn.execute(
        "INSERT INTO backup_configs (id,name,backup_type,path,enabled,created_at)
         VALUES (?1,?2,?3,?4,?5,?6)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name, backup_type=excluded.backup_type,
           path=excluded.path, enabled=excluded.enabled",
        params![id, payload.name, payload.backup_type, payload.path, enabled, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn delete_backup_config(id: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM backup_configs WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn run_backup(
    config_id: String,
    db: State<DbState>,
    db_path: State<DbPath>,
) -> Result<String, String> {
    // Fetch config details with lock, then release
    let (dest_path, config_name) = {
        let conn = db.0.lock().unwrap();
        let result = conn.query_row(
            "SELECT path, name FROM backup_configs WHERE id=?1",
            params![config_id],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        );
        match result {
            Ok(v) => v,
            Err(e) => return Err(format!("Config not found: {}", e)),
        }
    };

    let source_path = PathBuf::from(&db_path.0);
    let dest_dir = PathBuf::from(&dest_path);

    // Create destination directory if it doesn't exist
    std::fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("Failed to create destination directory: {}", e))?;

    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup_filename = format!("ngo-finanse-backup-{}.db", timestamp);
    let backup_dest = dest_dir.join(&backup_filename);

    std::fs::copy(&source_path, &backup_dest)
        .map_err(|e| format!("Backup copy failed: {}", e))?;

    let backup_path_str = backup_dest.to_string_lossy().to_string();

    // Update last_backup_at
    {
        let conn = db.0.lock().unwrap();
        let now = chrono::Utc::now().to_rfc3339();
        let _ = conn.execute(
            "UPDATE backup_configs SET last_backup_at=?1 WHERE id=?2",
            params![now, config_id],
        );
    }

    Ok(backup_path_str)
}

#[tauri::command]
pub fn list_backups(config_id: String, db: State<DbState>) -> Result<Vec<BackupFile>, String> {
    let dest_path = {
        let conn = db.0.lock().unwrap();
        conn.query_row(
            "SELECT path FROM backup_configs WHERE id=?1",
            params![config_id],
            |row| row.get::<_, String>(0),
        )
        .map_err(|e| format!("Config not found: {}", e))?
    };

    let dir = PathBuf::from(&dest_path);
    if !dir.exists() {
        return Ok(vec![]);
    }

    let entries = std::fs::read_dir(&dir).map_err(|e| format!("Cannot read directory: {}", e))?;

    let mut files: Vec<BackupFile> = Vec::new();
    for entry in entries.filter_map(|e| e.ok()) {
        let file_name = entry.file_name().to_string_lossy().to_string();
        if !file_name.starts_with("ngo-finanse-backup-") || !file_name.ends_with(".db") {
            continue;
        }
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let size_bytes = metadata.len();
        let created_at = metadata
            .created()
            .ok()
            .and_then(|t| {
                t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| {
                    chrono::DateTime::<chrono::Utc>::from(
                        std::time::UNIX_EPOCH + d,
                    )
                    .to_rfc3339()
                })
            })
            .unwrap_or_else(|| "unknown".to_string());

        files.push(BackupFile {
            file_name: file_name.clone(),
            file_path: entry.path().to_string_lossy().to_string(),
            size_bytes,
            created_at,
            source: dest_path.clone(),
        });
    }

    files.sort_by(|a, b| b.file_name.cmp(&a.file_name));
    Ok(files)
}

#[tauri::command]
pub fn restore_backup(
    backup_file_path: String,
    db: State<DbState>,
    db_path: State<DbPath>,
) -> Result<(), String> {
    let source_db = PathBuf::from(&db_path.0);
    let backup_source = PathBuf::from(&backup_file_path);

    if !backup_source.exists() {
        return Err("Backup file does not exist".to_string());
    }

    // Save current DB as a pre-restore backup first
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let pre_restore_name = source_db
        .parent()
        .unwrap_or(std::path::Path::new("."))
        .join(format!("krakow_ngo.pre-restore-{}.db", timestamp));

    std::fs::copy(&source_db, &pre_restore_name)
        .map_err(|e| format!("Failed to save pre-restore snapshot: {}", e))?;

    // Copy backup over the live DB
    // Note: this will take effect after Tauri restarts (connection will need to re-open)
    std::fs::copy(&backup_source, &source_db)
        .map_err(|e| format!("Failed to restore backup: {}", e))?;

    Ok(())
}
