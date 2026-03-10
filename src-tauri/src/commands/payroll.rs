use crate::commands::auth::DbState;
use crate::models::{Employee, Payslip, ZusBreakdown};
use rusqlite::params;
use tauri::State;

const EMERYTALNE_P: f64 = 0.0976;
const RENTOWE_P: f64 = 0.0150;
const CHOROBOWE: f64 = 0.0245;
const ZDROWOTNE: f64 = 0.09;
const EMERYTALNE_PR: f64 = 0.0976;
const RENTOWE_PR: f64 = 0.065;
const WYPADKOWE: f64 = 0.0167;
const FP: f64 = 0.0245;
const FGSP: f64 = 0.001;
const KOSZTY_UZYSKANIA: f64 = 250.0;
const ULGA_PODATKOWA: f64 = 300.0;
const PIT_RATE: f64 = 0.12;

fn calc_payslip(employee: &Employee, month: &str) -> Payslip {
    let gross = employee.gross_salary;
    let zus_base_employee = gross * (EMERYTALNE_P + RENTOWE_P + CHOROBOWE);
    let zus = ZusBreakdown {
        emerytalne_pracownik: gross * EMERYTALNE_P,
        rentowe_pracownik: gross * RENTOWE_P,
        chorobowe_pracownik: gross * CHOROBOWE,
        zdrowotne: (gross - zus_base_employee) * ZDROWOTNE,
        emerytalne_pracodawca: gross * EMERYTALNE_PR,
        rentowe_pracodawca: gross * RENTOWE_PR,
        wypadkowe: gross * WYPADKOWE,
        fp: gross * FP,
        fgsp: gross * FGSP,
    };
    let tax_base = ((gross - zus_base_employee - KOSZTY_UZYSKANIA) * 100.0).round() / 100.0;
    let pit_before = (tax_base * PIT_RATE * 100.0).round() / 100.0;
    let pit_advance = (pit_before - ULGA_PODATKOWA).max(0.0);
    let net_salary = ((gross - zus_base_employee - zus.zdrowotne - pit_advance) * 100.0).round() / 100.0;
    let total_employer_cost = ((gross + zus.emerytalne_pracodawca + zus.rentowe_pracodawca + zus.wypadkowe + zus.fp + zus.fgsp) * 100.0).round() / 100.0;
    Payslip {
        id: format!("ps_{}_{}", employee.id, month),
        employee_id: employee.id.clone(),
        employee: Some(employee.clone()),
        month: month.to_string(),
        gross_salary: gross,
        zus,
        tax_base,
        pit_advance,
        tax_relief: ULGA_PODATKOWA,
        net_salary,
        total_employer_cost,
        generated_at: chrono::Utc::now().to_rfc3339(),
    }
}

#[tauri::command]
pub fn get_payslips(month: String, db: State<DbState>) -> Vec<Payslip> {
    let conn = db.0.lock().unwrap();
    let employees: Vec<Employee> = {
        let mut stmt = conn.prepare(
            "SELECT id,first_name,last_name,pesel,position,department,contract_type,gross_salary,
                    start_date,email,bank_account,tax_office,active FROM employees WHERE active=1"
        ).unwrap();
        stmt.query_map([], |row| Ok(Employee {
            id: row.get(0)?, first_name: row.get(1)?, last_name: row.get(2)?,
            pesel: row.get(3)?, position: row.get(4)?, department: row.get(5)?,
            contract_type: row.get(6)?, gross_salary: row.get(7)?, start_date: row.get(8)?,
            email: row.get(9)?, bank_account: row.get(10)?, tax_office: row.get(11)?,
            active: row.get(12)?,
        })).unwrap().filter_map(|r| r.ok()).collect()
    };
    employees.iter().map(|e| calc_payslip(e, &month)).collect()
}

#[tauri::command]
pub fn generate_payslip(employee_id: String, month: String, db: State<DbState>) -> Result<Payslip, String> {
    let conn = db.0.lock().unwrap();
    let employee = conn.query_row(
        "SELECT id,first_name,last_name,pesel,position,department,contract_type,gross_salary,
                start_date,email,bank_account,tax_office,active FROM employees WHERE id=?1",
        params![employee_id],
        |row| Ok(Employee {
            id: row.get(0)?, first_name: row.get(1)?, last_name: row.get(2)?,
            pesel: row.get(3)?, position: row.get(4)?, department: row.get(5)?,
            contract_type: row.get(6)?, gross_salary: row.get(7)?, start_date: row.get(8)?,
            email: row.get(9)?, bank_account: row.get(10)?, tax_office: row.get(11)?,
            active: row.get(12)?,
        })
    ).map_err(|e| e.to_string())?;
    let ps = calc_payslip(&employee, &month);
    conn.execute(
        "INSERT OR REPLACE INTO payslips (id,employee_id,month,gross_salary,
         zus_emerytalne_pracownik,zus_rentowe_pracownik,zus_chorobowe_pracownik,zus_zdrowotne,
         zus_emerytalne_pracodawca,zus_rentowe_pracodawca,zus_wypadkowe,zus_fp,zus_fgsp,
         tax_base,pit_advance,tax_relief,net_salary,total_employer_cost,generated_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19)",
        params![ps.id,ps.employee_id,ps.month,ps.gross_salary,
                ps.zus.emerytalne_pracownik,ps.zus.rentowe_pracownik,ps.zus.chorobowe_pracownik,ps.zus.zdrowotne,
                ps.zus.emerytalne_pracodawca,ps.zus.rentowe_pracodawca,ps.zus.wypadkowe,ps.zus.fp,ps.zus.fgsp,
                ps.tax_base,ps.pit_advance,ps.tax_relief,ps.net_salary,ps.total_employer_cost,ps.generated_at],
    ).map_err(|e| e.to_string())?;
    Ok(ps)
}
