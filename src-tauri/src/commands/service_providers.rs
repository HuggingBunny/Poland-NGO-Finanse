use crate::commands::auth::DbState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceProvider {
    pub id: String,
    pub name: String,
    pub nip: Option<String>,
    pub krs: Option<String>,
    pub regon: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub bank_account: Option<String>,
    pub category: Option<String>,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpsertServiceProvider {
    pub id: Option<String>,
    pub name: String,
    pub nip: Option<String>,
    pub krs: Option<String>,
    pub regon: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub bank_account: Option<String>,
    pub category: Option<String>,
    pub notes: Option<String>,
}

fn row_to_provider(row: &rusqlite::Row) -> rusqlite::Result<ServiceProvider> {
    Ok(ServiceProvider {
        id: row.get(0)?,
        name: row.get(1)?,
        nip: row.get(2)?,
        krs: row.get(3)?,
        regon: row.get(4)?,
        address: row.get(5)?,
        city: row.get(6)?,
        postal_code: row.get(7)?,
        country: row.get(8)?,
        email: row.get(9)?,
        phone: row.get(10)?,
        bank_account: row.get(11)?,
        category: row.get(12)?,
        notes: row.get(13)?,
        created_at: row.get(14)?,
        updated_at: row.get(15)?,
    })
}

#[tauri::command]
pub fn get_service_providers(db: State<DbState>) -> Vec<ServiceProvider> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id,name,nip,krs,regon,address,city,postal_code,country,email,phone,bank_account,category,notes,created_at,updated_at
         FROM service_providers ORDER BY name ASC"
    ).unwrap();
    stmt.query_map([], row_to_provider)
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
}

#[tauri::command]
pub fn search_service_provider(name: String, db: State<DbState>) -> Vec<ServiceProvider> {
    let conn = db.0.lock().unwrap();
    let pattern = format!("%{}%", name);
    let mut stmt = conn.prepare(
        "SELECT id,name,nip,krs,regon,address,city,postal_code,country,email,phone,bank_account,category,notes,created_at,updated_at
         FROM service_providers WHERE name LIKE ?1 ORDER BY name ASC"
    ).unwrap();
    stmt.query_map(params![pattern], row_to_provider)
        .unwrap()
        .filter_map(|r| r.ok())
        .collect()
}

#[tauri::command]
pub fn upsert_service_provider(payload: UpsertServiceProvider, db: State<DbState>) -> Result<String, String> {
    let conn = db.0.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();
    let id = payload.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    conn.execute(
        "INSERT INTO service_providers
            (id,name,nip,krs,regon,address,city,postal_code,country,email,phone,bank_account,category,notes,created_at,updated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name, nip=excluded.nip, krs=excluded.krs, regon=excluded.regon,
           address=excluded.address, city=excluded.city, postal_code=excluded.postal_code,
           country=excluded.country, email=excluded.email, phone=excluded.phone,
           bank_account=excluded.bank_account, category=excluded.category,
           notes=excluded.notes, updated_at=excluded.updated_at",
        params![
            id, payload.name, payload.nip, payload.krs, payload.regon,
            payload.address, payload.city, payload.postal_code,
            payload.country.unwrap_or_else(|| "PL".to_string()),
            payload.email, payload.phone, payload.bank_account,
            payload.category, payload.notes, now, now
        ],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn delete_service_provider(id: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM service_providers WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
