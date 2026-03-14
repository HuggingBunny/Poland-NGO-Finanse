use crate::commands::auth::DbState;
use crate::commands::backup::DbPath;
use chrono::Datelike;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonthlyLedgerEntry {
    pub id: String,
    pub month: String,
    pub file_path: String,
    pub generated_at: String,
    pub entry_count: i64,
}

// CSV row struct (internal use only)
struct LedgerRow {
    date: String,
    row_type: String,
    number: String,
    vendor_client: String,
    description: String,
    amount_net: f64,
    vat_amount: f64,
    amount_gross: f64,
    vat_rate: String,
    category: String,
}

impl LedgerRow {
    fn to_csv_line(&self) -> String {
        format!(
            "{},{},{},{},{},{:.2},{:.2},{:.2},{},{}",
            csv_escape(&self.date),
            csv_escape(&self.row_type),
            csv_escape(&self.number),
            csv_escape(&self.vendor_client),
            csv_escape(&self.description),
            self.amount_net,
            self.vat_amount,
            self.amount_gross,
            csv_escape(&self.vat_rate),
            csv_escape(&self.category),
        )
    }
}

fn csv_escape(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}

#[tauri::command]
pub fn generate_monthly_ledger(
    month: String,
    db: State<DbState>,
    db_path: State<DbPath>,
) -> Result<String, String> {
    // Validate month format YYYY-MM
    if month.len() != 7 || !month.contains('-') {
        return Err("Month must be in YYYY-MM format".to_string());
    }

    let month_prefix = format!("{}%", month);
    let mut rows: Vec<LedgerRow> = Vec::new();

    {
        let conn = db.0.lock().unwrap();

        // Query receipts for the month
        let mut stmt = conn.prepare(
            "SELECT date, id, vendor, description, amount_net, vat_amount, amount_gross, vat_rate, category
             FROM receipts WHERE date LIKE ?1 AND status != 'odrzucony'
             ORDER BY date ASC"
        ).map_err(|e| e.to_string())?;

        let receipt_rows = stmt
            .query_map(params![month_prefix], |row| {
                Ok(LedgerRow {
                    date: row.get(0)?,
                    row_type: "Paragon".to_string(),
                    number: row.get(1)?,
                    vendor_client: row.get(2)?,
                    description: row.get(3)?,
                    amount_net: row.get(4)?,
                    vat_amount: row.get(5)?,
                    amount_gross: row.get(6)?,
                    vat_rate: format!("{}%", row.get::<_, i64>(7).unwrap_or(23)),
                    category: row.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for r in receipt_rows.filter_map(|r| r.ok()) {
            rows.push(r);
        }

        // Query bills for the month
        let mut stmt2 = conn.prepare(
            "SELECT issue_date, invoice_number, vendor, description,
                    (amount - vat_amount), vat_amount, amount, category
             FROM bills WHERE issue_date LIKE ?1
             ORDER BY issue_date ASC"
        ).map_err(|e| e.to_string())?;

        let bill_rows = stmt2
            .query_map(params![month_prefix], |row| {
                Ok(LedgerRow {
                    date: row.get(0)?,
                    row_type: "Faktura kosztowa".to_string(),
                    number: row.get(1)?,
                    vendor_client: row.get(2)?,
                    description: row.get(3)?,
                    amount_net: row.get(4)?,
                    vat_amount: row.get(5)?,
                    amount_gross: row.get(6)?,
                    vat_rate: String::new(),
                    category: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?;

        for r in bill_rows.filter_map(|r| r.ok()) {
            rows.push(r);
        }
    }

    let entry_count = rows.len() as i64;

    // Build CSV
    let header = "Date,Type,Number,Vendor/Client,Description,Net Amount,VAT Amount,Gross Amount,VAT Rate,Category";
    let mut csv_lines: Vec<String> = vec![header.to_string()];
    for row in &rows {
        csv_lines.push(row.to_csv_line());
    }
    let csv_content = csv_lines.join("\n");

    // Determine output directory (next to DB file)
    let source_db = PathBuf::from(&db_path.0);
    let ledger_dir = source_db
        .parent()
        .unwrap_or(std::path::Path::new("."))
        .join("ledgers");
    std::fs::create_dir_all(&ledger_dir)
        .map_err(|e| format!("Failed to create ledgers directory: {}", e))?;

    let file_name = format!("ledger-{}.csv", month);
    let file_path = ledger_dir.join(&file_name);
    std::fs::write(&file_path, csv_content)
        .map_err(|e| format!("Failed to write CSV file: {}", e))?;

    let file_path_str = file_path.to_string_lossy().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let id = uuid::Uuid::new_v4().to_string();

    {
        let conn = db.0.lock().unwrap();
        conn.execute(
            "INSERT INTO monthly_ledger (id,month,file_path,generated_at,entry_count)
             VALUES (?1,?2,?3,?4,?5)
             ON CONFLICT(month) DO UPDATE SET
               file_path=excluded.file_path, generated_at=excluded.generated_at,
               entry_count=excluded.entry_count",
            params![id, month, file_path_str, now, entry_count],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(file_path_str)
}

#[tauri::command]
pub fn get_monthly_ledgers(db: State<DbState>) -> Vec<MonthlyLedgerEntry> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn
        .prepare(
            "SELECT id,month,file_path,generated_at,entry_count
             FROM monthly_ledger ORDER BY month DESC",
        )
        .unwrap();
    stmt.query_map([], |row| {
        Ok(MonthlyLedgerEntry {
            id: row.get(0)?,
            month: row.get(1)?,
            file_path: row.get(2)?,
            generated_at: row.get(3)?,
            entry_count: row.get(4)?,
        })
    })
    .unwrap()
    .filter_map(|r| r.ok())
    .collect()
}

#[tauri::command]
pub fn check_monthly_rollover(db: State<DbState>) -> Option<String> {
    let now = chrono::Utc::now();
    let day = now.format("%d").to_string().parse::<u32>().unwrap_or(99);
    if day != 1 {
        return None;
    }

    // Compute the previous month
    let prev = if now.month() == 1 {
        format!("{}-12", now.year() - 1)
    } else {
        format!("{}-{:02}", now.year(), now.month() - 1)
    };

    let conn = db.0.lock().unwrap();
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM monthly_ledger WHERE month=?1",
            params![prev],
            |r| r.get::<_, i64>(0),
        )
        .unwrap_or(0)
        > 0;

    if exists {
        None
    } else {
        Some(prev)
    }
}
