use crate::models::User;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

pub struct DbState(pub Mutex<Connection>);

#[derive(Serialize)]
pub struct LoginResult {
    pub success: bool,
    pub user: Option<User>,
    pub error: Option<String>,
}

#[derive(Deserialize)]
pub struct LoginPayload {
    pub username: String,
    pub password: String,
}

#[tauri::command]
pub fn login(payload: LoginPayload, db: State<DbState>) -> LoginResult {
    let conn = db.0.lock().unwrap();
    let result = conn.query_row(
        "SELECT id, username, display_name, email, role, password_hash, active, created_at, last_login
         FROM users WHERE username = ?1 AND active = 1",
        params![payload.username],
        |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, String>(5)?,
                row.get::<_, bool>(6)?,
                row.get::<_, String>(7)?,
                row.get::<_, Option<String>>(8)?,
            ))
        },
    );

    match result {
        Ok((id, username, display_name, email, role, hash, active, created_at, last_login)) => {
            if bcrypt::verify(&payload.password, &hash).unwrap_or(false) {
                let now = chrono::Utc::now().to_rfc3339();
                let _ = conn.execute(
                    "UPDATE users SET last_login = ?1 WHERE id = ?2",
                    params![now, id],
                );
                LoginResult {
                    success: true,
                    user: Some(User {
                        id,
                        username,
                        display_name,
                        email,
                        role,
                        active,
                        created_at,
                        last_login: Some(now),
                    }),
                    error: None,
                }
            } else {
                LoginResult { success: false, user: None, error: Some("Nieprawidłowe hasło".into()) }
            }
        }
        Err(_) => LoginResult { success: false, user: None, error: Some("Użytkownik nie istnieje".into()) },
    }
}

#[tauri::command]
pub fn get_users(db: State<DbState>) -> Vec<User> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id, username, display_name, email, role, active, created_at, last_login FROM users ORDER BY created_at"
    ).unwrap();
    stmt.query_map([], |row| {
        Ok(User {
            id: row.get(0)?,
            username: row.get(1)?,
            display_name: row.get(2)?,
            email: row.get(3)?,
            role: row.get(4)?,
            active: row.get(5)?,
            created_at: row.get(6)?,
            last_login: row.get(7)?,
        })
    }).unwrap().filter_map(|r| r.ok()).collect()
}

#[derive(Deserialize)]
pub struct CreateUserPayload {
    pub username: String,
    pub display_name: String,
    pub email: String,
    pub role: String,
    pub password: String,
}

#[tauri::command]
pub fn create_user(payload: CreateUserPayload, db: State<DbState>) -> Result<User, String> {
    let conn = db.0.lock().unwrap();
    let id = uuid::Uuid::new_v4().to_string();
    let hash = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO users (id, username, display_name, email, role, password_hash, active, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,1,?7)",
        params![id, payload.username, payload.display_name, payload.email, payload.role, hash, now],
    ).map_err(|e| e.to_string())?;
    Ok(User { id, username: payload.username, display_name: payload.display_name, email: payload.email, role: payload.role, active: true, created_at: now, last_login: None })
}

#[derive(Deserialize)]
pub struct UpdateUserPayload {
    pub id: String,
    pub display_name: String,
    pub email: String,
    pub role: String,
    pub active: bool,
}

#[tauri::command]
pub fn update_user(payload: UpdateUserPayload, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE users SET display_name=?1, email=?2, role=?3, active=?4 WHERE id=?5",
        params![payload.display_name, payload.email, payload.role, payload.active, payload.id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn reset_password(user_id: String, new_password: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    let hash = bcrypt::hash(&new_password, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE users SET password_hash=?1 WHERE id=?2",
        params![hash, user_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
