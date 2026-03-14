#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;

use commands::auth::DbState;
use commands::backup::DbPath;
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
            let db_path_str = db_path.to_string_lossy().to_string();
            let conn = db::init_db(&db_path).expect("Failed to initialise database");
            app.manage(DbState(Mutex::new(conn)));
            app.manage(DbPath(db_path_str));
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
            // Dashboard
            commands::dashboard::get_dashboard_data,
            // Service Providers
            commands::service_providers::get_service_providers,
            commands::service_providers::search_service_provider,
            commands::service_providers::upsert_service_provider,
            commands::service_providers::delete_service_provider,
            // Ollama
            commands::ollama::process_receipt_with_ollama,
            commands::ollama::test_ollama_connection,
            // Admin Logs
            commands::admin_logs::get_admin_logs,
            commands::admin_logs::add_admin_log,
            commands::admin_logs::cleanup_old_logs,
            // Backup
            commands::backup::get_backup_configs,
            commands::backup::upsert_backup_config,
            commands::backup::delete_backup_config,
            commands::backup::run_backup,
            commands::backup::list_backups,
            commands::backup::restore_backup,
            // Email
            commands::email::get_email_settings,
            commands::email::save_email_settings,
            // Ledger
            commands::ledger::generate_monthly_ledger,
            commands::ledger::get_monthly_ledgers,
            commands::ledger::check_monthly_rollover,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
