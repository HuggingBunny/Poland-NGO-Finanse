use crate::commands::auth::DbState;
use crate::models::Bill;
use rusqlite::params;
use serde::Deserialize;
use tauri::State;

fn row_to_bill(row: &rusqlite::Row) -> rusqlite::Result<Bill> {
    Ok(Bill {
        id: row.get(0)?,
        vendor: row.get(1)?,
        invoice_number: row.get(2)?,
        description: row.get(3)?,
        amount: row.get(4)?,
        vat_amount: row.get(5)?,
        issue_date: row.get(6)?,
        due_date: row.get(7)?,
        paid_date: row.get(8)?,
        status: row.get(9)?,
        category: row.get(10)?,
        notes: row.get(11)?,
    })
}

#[tauri::command]
pub fn get_bills(db: State<DbState>) -> Vec<Bill> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id,vendor,invoice_number,description,amount,vat_amount,issue_date,due_date,
                paid_date,status,category,notes FROM bills ORDER BY due_date ASC"
    ).unwrap();
    stmt.query_map([], row_to_bill).unwrap().filter_map(|r| r.ok()).collect()
}

#[derive(Deserialize)]
pub struct UpsertBill {
    pub id: Option<String>,
    pub vendor: String,
    pub invoice_number: String,
    pub description: String,
    pub amount: f64,
    pub vat_amount: f64,
    pub issue_date: String,
    pub due_date: String,
    pub category: String,
    pub notes: Option<String>,
}

#[tauri::command]
pub fn upsert_bill(payload: UpsertBill, db: State<DbState>) -> Result<String, String> {
    let conn = db.0.lock().unwrap();
    let id = payload.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    conn.execute(
        "INSERT INTO bills (id,vendor,invoice_number,description,amount,vat_amount,issue_date,due_date,status,category,notes)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,'nieoplacona',?9,?10)
         ON CONFLICT(id) DO UPDATE SET
           vendor=excluded.vendor, invoice_number=excluded.invoice_number,
           description=excluded.description, amount=excluded.amount, vat_amount=excluded.vat_amount,
           issue_date=excluded.issue_date, due_date=excluded.due_date, category=excluded.category, notes=excluded.notes",
        params![id,payload.vendor,payload.invoice_number,payload.description,payload.amount,
                payload.vat_amount,payload.issue_date,payload.due_date,payload.category,payload.notes],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn mark_bill_paid(id: String, paid_date: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE bills SET status='oplacona', paid_date=?1 WHERE id=?2",
        params![paid_date, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_bill(id: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM bills WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
