use crate::commands::auth::DbState;
use crate::models::Receipt;
use rusqlite::params;
use serde::Deserialize;
use tauri::State;

fn row_to_receipt(row: &rusqlite::Row) -> rusqlite::Result<Receipt> {
    Ok(Receipt {
        id: row.get(0)?,
        date: row.get(1)?,
        vendor: row.get(2)?,
        description: row.get(3)?,
        amount_gross: row.get(4)?,
        amount_net: row.get(5)?,
        vat_rate: row.get(6)?,
        vat_amount: row.get(7)?,
        category: row.get(8)?,
        status: row.get(9)?,
        vat_eligible: row.get(10)?,
        file_name: row.get(11)?,
        ocr_text: row.get(12)?,
        ai_confidence: row.get(13)?,
        ai_suggested_category: row.get(14)?,
        ai_suggested_vat_rate: row.get(15)?,
        ai_vat_eligible: row.get(16)?,
        ai_reasoning: row.get(17)?,
        ai_model: row.get(18)?,
        ai_processed_at: row.get(19)?,
        uploaded_by: row.get(20)?,
        uploaded_at: row.get(21)?,
    })
}

#[tauri::command]
pub fn get_receipts(db: State<DbState>) -> Vec<Receipt> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id,date,vendor,description,amount_gross,amount_net,vat_rate,vat_amount,
                category,status,vat_eligible,file_name,ocr_text,
                ai_confidence,ai_suggested_category,ai_suggested_vat_rate,ai_vat_eligible,
                ai_reasoning,ai_model,ai_processed_at,uploaded_by,uploaded_at
         FROM receipts ORDER BY uploaded_at DESC"
    ).unwrap();
    stmt.query_map([], row_to_receipt).unwrap().filter_map(|r| r.ok()).collect()
}

#[derive(Deserialize)]
pub struct UpsertReceipt {
    pub id: Option<String>,
    pub date: String,
    pub vendor: String,
    pub description: String,
    pub amount_gross: f64,
    pub amount_net: f64,
    pub vat_rate: i64,
    pub vat_amount: f64,
    pub category: String,
    pub status: String,
    pub vat_eligible: bool,
    pub file_name: Option<String>,
    pub uploaded_by: String,
}

#[tauri::command]
pub fn upsert_receipt(payload: UpsertReceipt, db: State<DbState>) -> Result<String, String> {
    let conn = db.0.lock().unwrap();
    let id = payload.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO receipts (id,date,vendor,description,amount_gross,amount_net,vat_rate,vat_amount,
                               category,status,vat_eligible,file_name,uploaded_by,uploaded_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)
         ON CONFLICT(id) DO UPDATE SET
           date=excluded.date, vendor=excluded.vendor, description=excluded.description,
           amount_gross=excluded.amount_gross, amount_net=excluded.amount_net,
           vat_rate=excluded.vat_rate, vat_amount=excluded.vat_amount,
           category=excluded.category, status=excluded.status, vat_eligible=excluded.vat_eligible",
        params![id,payload.date,payload.vendor,payload.description,payload.amount_gross,payload.amount_net,
                payload.vat_rate,payload.vat_amount,payload.category,payload.status,payload.vat_eligible,
                payload.file_name,payload.uploaded_by,now],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn update_receipt_status(id: String, status: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute("UPDATE receipts SET status=?1 WHERE id=?2", params![status, id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_receipt(id: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM receipts WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
