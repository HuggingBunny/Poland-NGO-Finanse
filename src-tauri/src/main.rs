#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;

use commands::auth::DbState;
use std::sync::Mutex;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path_resolver()
                .app_data_dir()
                .expect("Failed to resolve app data dir");
            std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
            let db_path = db::get_db_path(&app_dir);
            let conn = db::init_db(&db_path).expect("Failed to initialise database");
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::login,
            commands::auth::get_users,
            commands::auth::create_user,
            commands::auth::update_user,
            commands::auth::reset_password,
            // Receipts
            commands::receipts::get_receipts,
            commands::receipts::upsert_receipt,
            commands::receipts::update_receipt_status,
            commands::receipts::delete_receipt,
            // Bills
            commands::bills::get_bills,
            commands::bills::upsert_bill,
            commands::bills::mark_bill_paid,
            commands::bills::delete_bill,
            // Invoices
            commands::invoices::get_invoices,
            commands::invoices::save_invoice,
            commands::invoices::mark_invoice_paid,
            commands::invoices::delete_invoice,
            // Employees
            commands::employees::get_employees,
            commands::employees::upsert_employee,
            commands::employees::delete_employee,
            // Payroll
            commands::payroll::get_payslips,
            commands::payroll::generate_payslip,
            // Settings
            commands::settings::get_organization,
            commands::settings::save_organization,
            commands::settings::get_setting,
            commands::settings::set_setting,
            // Legal
            commands::legal::get_legal_updates,
            commands::legal::dismiss_legal_update,
            commands::legal::apply_legal_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
