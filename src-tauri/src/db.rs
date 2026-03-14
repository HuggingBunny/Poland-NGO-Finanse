use rusqlite::{Connection, Result, params};
use std::path::PathBuf;

pub fn get_db_path(app_data_dir: &PathBuf) -> PathBuf {
    app_data_dir.join("krakow_ngo.db")
}

pub fn init_db(path: &PathBuf) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> Result<()> {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY
        );
    ")?;

    let version: i64 = conn.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM schema_version",
        [],
        |r| r.get(0),
    ).unwrap_or(0);

    if version < 1 {
        conn.execute_batch("
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                email TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin','ksiegowa','dyrektor','wolontariusz')),
                password_hash TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                last_login TEXT
            );

            CREATE TABLE IF NOT EXISTS organization (
                id INTEGER PRIMARY KEY DEFAULT 1,
                name TEXT NOT NULL DEFAULT '',
                nip TEXT NOT NULL DEFAULT '',
                krs TEXT NOT NULL DEFAULT '',
                regon TEXT NOT NULL DEFAULT '',
                address TEXT NOT NULL DEFAULT '',
                city TEXT NOT NULL DEFAULT '',
                postal_code TEXT NOT NULL DEFAULT '',
                country TEXT NOT NULL DEFAULT 'Polska',
                email TEXT NOT NULL DEFAULT '',
                phone TEXT NOT NULL DEFAULT '',
                bank_account TEXT NOT NULL DEFAULT '',
                bank_name TEXT NOT NULL DEFAULT ''
            );

            CREATE TABLE IF NOT EXISTS receipts (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                vendor TEXT NOT NULL,
                description TEXT NOT NULL,
                amount_gross REAL NOT NULL,
                amount_net REAL NOT NULL,
                vat_rate INTEGER NOT NULL,
                vat_amount REAL NOT NULL,
                category TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'oczekuje',
                vat_eligible INTEGER NOT NULL DEFAULT 1,
                file_name TEXT,
                ocr_text TEXT,
                ai_confidence REAL,
                ai_suggested_category TEXT,
                ai_suggested_vat_rate INTEGER,
                ai_vat_eligible INTEGER,
                ai_reasoning TEXT,
                ai_model TEXT,
                ai_processed_at TEXT,
                uploaded_by TEXT NOT NULL,
                uploaded_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS bills (
                id TEXT PRIMARY KEY,
                vendor TEXT NOT NULL,
                invoice_number TEXT NOT NULL,
                description TEXT NOT NULL,
                amount REAL NOT NULL,
                vat_amount REAL NOT NULL DEFAULT 0,
                issue_date TEXT NOT NULL,
                due_date TEXT NOT NULL,
                paid_date TEXT,
                status TEXT NOT NULL DEFAULT 'nieoplacona',
                category TEXT NOT NULL,
                notes TEXT
            );

            CREATE TABLE IF NOT EXISTS invoices (
                id TEXT PRIMARY KEY,
                number TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'szkic',
                issue_date TEXT NOT NULL,
                sale_date TEXT NOT NULL,
                due_date TEXT NOT NULL,
                paid_date TEXT,
                seller_name TEXT NOT NULL,
                seller_nip TEXT,
                seller_krs TEXT,
                seller_regon TEXT,
                seller_address TEXT NOT NULL,
                seller_city TEXT NOT NULL,
                seller_postal_code TEXT NOT NULL,
                seller_email TEXT,
                buyer_name TEXT NOT NULL,
                buyer_nip TEXT,
                buyer_krs TEXT,
                buyer_regon TEXT,
                buyer_address TEXT NOT NULL,
                buyer_city TEXT NOT NULL,
                buyer_postal_code TEXT NOT NULL,
                buyer_email TEXT,
                net_total REAL NOT NULL,
                vat_total REAL NOT NULL,
                gross_total REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'PLN',
                payment_method TEXT NOT NULL DEFAULT 'przelew',
                bank_account TEXT,
                notes TEXT
            );

            CREATE TABLE IF NOT EXISTS invoice_items (
                id TEXT PRIMARY KEY,
                invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
                description TEXT NOT NULL,
                quantity REAL NOT NULL,
                unit TEXT NOT NULL,
                unit_price_net REAL NOT NULL,
                vat_rate INTEGER NOT NULL,
                net_amount REAL NOT NULL,
                vat_amount REAL NOT NULL,
                gross_amount REAL NOT NULL,
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                pesel TEXT NOT NULL,
                position TEXT NOT NULL,
                department TEXT NOT NULL,
                contract_type TEXT NOT NULL,
                gross_salary REAL NOT NULL,
                start_date TEXT NOT NULL,
                email TEXT NOT NULL,
                bank_account TEXT NOT NULL,
                tax_office TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS payslips (
                id TEXT PRIMARY KEY,
                employee_id TEXT NOT NULL REFERENCES employees(id),
                month TEXT NOT NULL,
                gross_salary REAL NOT NULL,
                zus_emerytalne_pracownik REAL NOT NULL,
                zus_rentowe_pracownik REAL NOT NULL,
                zus_chorobowe_pracownik REAL NOT NULL,
                zus_zdrowotne REAL NOT NULL,
                zus_emerytalne_pracodawca REAL NOT NULL,
                zus_rentowe_pracodawca REAL NOT NULL,
                zus_wypadkowe REAL NOT NULL,
                zus_fp REAL NOT NULL,
                zus_fgsp REAL NOT NULL,
                tax_base REAL NOT NULL,
                pit_advance REAL NOT NULL,
                tax_relief REAL NOT NULL,
                net_salary REAL NOT NULL,
                total_employer_cost REAL NOT NULL,
                generated_at TEXT NOT NULL,
                UNIQUE(employee_id, month)
            );

            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS legal_updates_dismissed (
                change_id TEXT PRIMARY KEY,
                dismissed_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS service_providers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                nip TEXT, krs TEXT, regon TEXT,
                address TEXT, city TEXT, postal_code TEXT,
                country TEXT DEFAULT 'PL',
                email TEXT, phone TEXT, bank_account TEXT,
                category TEXT, notes TEXT,
                created_at TEXT NOT NULL, updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS email_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

            CREATE TABLE IF NOT EXISTS admin_logs (
                id TEXT PRIMARY KEY,
                level TEXT NOT NULL DEFAULT 'info',
                module TEXT NOT NULL,
                message TEXT NOT NULL,
                user_id TEXT, metadata TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS backup_configs (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                backup_type TEXT NOT NULL,
                path TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                last_backup_at TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS monthly_ledger (
                id TEXT PRIMARY KEY,
                month TEXT NOT NULL UNIQUE,
                file_path TEXT NOT NULL,
                generated_at TEXT NOT NULL,
                entry_count INTEGER DEFAULT 0
            );

            INSERT OR IGNORE INTO schema_version (version) VALUES (1);
        ")?;

        // Seed default org row
        conn.execute(
            "INSERT OR IGNORE INTO organization (id) VALUES (1)",
            [],
        )?;

        // Seed default admin user (password: admin)
        let admin_hash = bcrypt::hash("admin", bcrypt::DEFAULT_COST).unwrap_or_default();
        conn.execute(
            "INSERT OR IGNORE INTO users (id, username, display_name, email, role, password_hash, active, created_at)
             VALUES (?1, 'admin', 'Administrator Systemu', 'admin@fundacja.org.pl', 'admin', ?2, 1, datetime('now'))",
            params!["u1", admin_hash],
        )?;
    }

    Ok(())
}
