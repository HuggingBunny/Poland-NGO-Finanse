use crate::commands::auth::DbState;
use crate::models::Organization;
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn get_organization(db: State<DbState>) -> Organization {
    let conn = db.0.lock().unwrap();
    conn.query_row(
        "SELECT name,nip,krs,regon,address,city,postal_code,country,email,phone,bank_account,bank_name
         FROM organization WHERE id=1",
        [],
        |row| Ok(Organization {
            name: row.get(0)?, nip: row.get(1)?, krs: row.get(2)?, regon: row.get(3)?,
            address: row.get(4)?, city: row.get(5)?, postal_code: row.get(6)?, country: row.get(7)?,
            email: row.get(8)?, phone: row.get(9)?, bank_account: row.get(10)?, bank_name: row.get(11)?,
        })
    ).unwrap_or_else(|_| Organization {
        name: String::new(), nip: String::new(), krs: String::new(), regon: String::new(),
        address: String::new(), city: String::new(), postal_code: String::new(),
        country: "Polska".into(), email: String::new(), phone: String::new(),
        bank_account: String::new(), bank_name: String::new(),
    })
}

#[tauri::command]
pub fn save_organization(org: Organization, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE organization SET name=?1,nip=?2,krs=?3,regon=?4,address=?5,city=?6,
                 postal_code=?7,country=?8,email=?9,phone=?10,bank_account=?11,bank_name=?12 WHERE id=1",
        params![org.name,org.nip,org.krs,org.regon,org.address,org.city,
                org.postal_code,org.country,org.email,org.phone,org.bank_account,org.bank_name],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_setting(key: String, db: State<DbState>) -> Option<String> {
    let conn = db.0.lock().unwrap();
    conn.query_row(
        "SELECT value FROM app_settings WHERE key=?1",
        params![key],
        |r| r.get(0),
    ).ok()
}

#[tauri::command]
pub fn set_setting(key: String, value: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO app_settings (key,value) VALUES (?1,?2) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        params![key, value],
    ).map_err(|e| e.to_string())?;
    Ok(())
}
