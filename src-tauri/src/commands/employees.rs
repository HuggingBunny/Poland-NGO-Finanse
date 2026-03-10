use crate::commands::auth::DbState;
use crate::models::Employee;
use rusqlite::params;
use serde::Deserialize;
use tauri::State;

fn row_to_employee(row: &rusqlite::Row) -> rusqlite::Result<Employee> {
    Ok(Employee {
        id: row.get(0)?, first_name: row.get(1)?, last_name: row.get(2)?,
        pesel: row.get(3)?, position: row.get(4)?, department: row.get(5)?,
        contract_type: row.get(6)?, gross_salary: row.get(7)?, start_date: row.get(8)?,
        email: row.get(9)?, bank_account: row.get(10)?, tax_office: row.get(11)?,
        active: row.get(12)?,
    })
}

#[tauri::command]
pub fn get_employees(db: State<DbState>) -> Vec<Employee> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT id,first_name,last_name,pesel,position,department,contract_type,gross_salary,
                start_date,email,bank_account,tax_office,active FROM employees ORDER BY last_name"
    ).unwrap();
    stmt.query_map([], row_to_employee).unwrap().filter_map(|r| r.ok()).collect()
}

#[derive(Deserialize)]
pub struct UpsertEmployee {
    pub id: Option<String>,
    pub first_name: String,
    pub last_name: String,
    pub pesel: String,
    pub position: String,
    pub department: String,
    pub contract_type: String,
    pub gross_salary: f64,
    pub start_date: String,
    pub email: String,
    pub bank_account: String,
    pub tax_office: String,
    pub active: bool,
}

#[tauri::command]
pub fn upsert_employee(payload: UpsertEmployee, db: State<DbState>) -> Result<String, String> {
    let conn = db.0.lock().unwrap();
    let id = payload.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    conn.execute(
        "INSERT INTO employees (id,first_name,last_name,pesel,position,department,contract_type,
                                gross_salary,start_date,email,bank_account,tax_office,active)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)
         ON CONFLICT(id) DO UPDATE SET
           first_name=excluded.first_name, last_name=excluded.last_name, position=excluded.position,
           department=excluded.department, contract_type=excluded.contract_type,
           gross_salary=excluded.gross_salary, email=excluded.email,
           bank_account=excluded.bank_account, tax_office=excluded.tax_office, active=excluded.active",
        params![id,payload.first_name,payload.last_name,payload.pesel,payload.position,payload.department,
                payload.contract_type,payload.gross_salary,payload.start_date,payload.email,
                payload.bank_account,payload.tax_office,payload.active],
    ).map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub fn delete_employee(id: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute("UPDATE employees SET active=0 WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
