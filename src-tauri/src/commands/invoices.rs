use crate::commands::auth::DbState;
use crate::models::{Invoice, InvoiceItem, InvoiceParty};
use rusqlite::params;
use serde::Deserialize;
use tauri::State;

fn fetch_invoice(conn: &rusqlite::Connection, id: &str) -> Option<Invoice> {
    let inv = conn.query_row(
        "SELECT id,number,status,issue_date,sale_date,due_date,paid_date,
                seller_name,seller_nip,seller_krs,seller_regon,seller_address,seller_city,seller_postal_code,seller_email,
                buyer_name,buyer_nip,buyer_krs,buyer_regon,buyer_address,buyer_city,buyer_postal_code,buyer_email,
                net_total,vat_total,gross_total,currency,payment_method,bank_account,notes
         FROM invoices WHERE id=?1",
        params![id],
        |row| Ok((
            row.get::<_,String>(0)?, row.get::<_,String>(1)?, row.get::<_,String>(2)?,
            row.get::<_,String>(3)?, row.get::<_,String>(4)?, row.get::<_,String>(5)?,
            row.get::<_,Option<String>>(6)?,
            row.get::<_,String>(7)?,row.get::<_,Option<String>>(8)?,row.get::<_,Option<String>>(9)?,
            row.get::<_,Option<String>>(10)?,row.get::<_,String>(11)?,row.get::<_,String>(12)?,row.get::<_,String>(13)?,row.get::<_,Option<String>>(14)?,
            row.get::<_,String>(15)?,row.get::<_,Option<String>>(16)?,row.get::<_,Option<String>>(17)?,
            row.get::<_,Option<String>>(18)?,row.get::<_,String>(19)?,row.get::<_,String>(20)?,row.get::<_,String>(21)?,row.get::<_,Option<String>>(22)?,
            row.get::<_,f64>(23)?,row.get::<_,f64>(24)?,row.get::<_,f64>(25)?,
            row.get::<_,String>(26)?,row.get::<_,String>(27)?,row.get::<_,Option<String>>(28)?,row.get::<_,Option<String>>(29)?,
        ))
    ).ok()?;

    let mut item_stmt = conn.prepare(
        "SELECT id,invoice_id,description,quantity,unit,unit_price_net,vat_rate,net_amount,vat_amount,gross_amount,sort_order
         FROM invoice_items WHERE invoice_id=?1 ORDER BY sort_order"
    ).ok()?;
    let items: Vec<InvoiceItem> = item_stmt.query_map(params![id], |row| Ok(InvoiceItem {
        id: row.get(0)?, invoice_id: row.get(1)?, description: row.get(2)?,
        quantity: row.get(3)?, unit: row.get(4)?, unit_price_net: row.get(5)?,
        vat_rate: row.get(6)?, net_amount: row.get(7)?, vat_amount: row.get(8)?,
        gross_amount: row.get(9)?, sort_order: row.get(10)?,
    })).ok()?.filter_map(|r| r.ok()).collect();

    Some(Invoice {
        id: inv.0, number: inv.1, status: inv.2,
        issue_date: inv.3, sale_date: inv.4, due_date: inv.5, paid_date: inv.6,
        seller: InvoiceParty { name: inv.7, nip: inv.8, krs: inv.9, regon: inv.10, address: inv.11, city: inv.12, postal_code: inv.13, email: inv.14 },
        buyer: InvoiceParty { name: inv.15, nip: inv.16, krs: inv.17, regon: inv.18, address: inv.19, city: inv.20, postal_code: inv.21, email: inv.22 },
        items,
        net_total: inv.23, vat_total: inv.24, gross_total: inv.25,
        currency: inv.26, payment_method: inv.27, bank_account: inv.28, notes: inv.29,
    })
}

#[tauri::command]
pub fn get_invoices(db: State<DbState>) -> Vec<Invoice> {
    let conn = db.0.lock().unwrap();
    let ids: Vec<String> = {
        let mut stmt = conn.prepare("SELECT id FROM invoices ORDER BY issue_date DESC").unwrap();
        stmt.query_map([], |r| r.get(0)).unwrap().filter_map(|r| r.ok()).collect()
    };
    ids.iter().filter_map(|id| fetch_invoice(&conn, id)).collect()
}

#[derive(Deserialize)]
pub struct SaveInvoice {
    pub id: Option<String>,
    pub number: String,
    pub status: String,
    pub issue_date: String,
    pub sale_date: String,
    pub due_date: String,
    pub seller: InvoicePartyInput,
    pub buyer: InvoicePartyInput,
    pub items: Vec<InvoiceItemInput>,
    pub net_total: f64,
    pub vat_total: f64,
    pub gross_total: f64,
    pub currency: String,
    pub payment_method: String,
    pub bank_account: Option<String>,
    pub notes: Option<String>,
}

#[derive(Deserialize)]
pub struct InvoicePartyInput {
    pub name: String,
    pub nip: Option<String>,
    pub krs: Option<String>,
    pub regon: Option<String>,
    pub address: String,
    pub city: String,
    pub postal_code: String,
    pub email: Option<String>,
}

#[derive(Deserialize)]
pub struct InvoiceItemInput {
    pub id: Option<String>,
    pub description: String,
    pub quantity: f64,
    pub unit: String,
    pub unit_price_net: f64,
    pub vat_rate: i64,
    pub net_amount: f64,
    pub vat_amount: f64,
    pub gross_amount: f64,
}

#[tauri::command]
pub fn save_invoice(payload: SaveInvoice, db: State<DbState>) -> Result<String, String> {
    let conn = db.0.lock().unwrap();
    let id = payload.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    conn.execute(
        "INSERT INTO invoices (id,number,status,issue_date,sale_date,due_date,
                               seller_name,seller_nip,seller_krs,seller_regon,seller_address,seller_city,seller_postal_code,seller_email,
                               buyer_name,buyer_nip,buyer_krs,buyer_regon,buyer_address,buyer_city,buyer_postal_code,buyer_email,
                               net_total,vat_total,gross_total,currency,payment_method,bank_account,notes)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24,?25,?26,?27,?28,?29)
         ON CONFLICT(id) DO UPDATE SET
           number=excluded.number,status=excluded.status,issue_date=excluded.issue_date,sale_date=excluded.sale_date,
           due_date=excluded.due_date,seller_name=excluded.seller_name,seller_nip=excluded.seller_nip,
           seller_address=excluded.seller_address,seller_city=excluded.seller_city,seller_postal_code=excluded.seller_postal_code,
           buyer_name=excluded.buyer_name,buyer_nip=excluded.buyer_nip,buyer_address=excluded.buyer_address,
           buyer_city=excluded.buyer_city,buyer_postal_code=excluded.buyer_postal_code,
           net_total=excluded.net_total,vat_total=excluded.vat_total,gross_total=excluded.gross_total,
           currency=excluded.currency,payment_method=excluded.payment_method,bank_account=excluded.bank_account,notes=excluded.notes",
        params![id,payload.number,payload.status,payload.issue_date,payload.sale_date,payload.due_date,
                payload.seller.name,payload.seller.nip,payload.seller.krs,payload.seller.regon,
                payload.seller.address,payload.seller.city,payload.seller.postal_code,payload.seller.email,
                payload.buyer.name,payload.buyer.nip,payload.buyer.krs,payload.buyer.regon,
                payload.buyer.address,payload.buyer.city,payload.buyer.postal_code,payload.buyer.email,
                payload.net_total,payload.vat_total,payload.gross_total,
                payload.currency,payload.payment_method,payload.bank_account,payload.notes],
    ).map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM invoice_items WHERE invoice_id=?1", params![id])
        .map_err(|e| e.to_string())?;
    for (i, item) in payload.items.iter().enumerate() {
        let item_id = item.id.clone().unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        conn.execute(
            "INSERT INTO invoice_items (id,invoice_id,description,quantity,unit,unit_price_net,vat_rate,net_amount,vat_amount,gross_amount,sort_order)
             VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![item_id,id,item.description,item.quantity,item.unit,item.unit_price_net,
                    item.vat_rate,item.net_amount,item.vat_amount,item.gross_amount,i as i64],
        ).map_err(|e| e.to_string())?;
    }
    Ok(id)
}

#[tauri::command]
pub fn mark_invoice_paid(id: String, paid_date: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "UPDATE invoices SET status='oplacona', paid_date=?1 WHERE id=?2",
        params![paid_date, id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_invoice(id: String, db: State<DbState>) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM invoices WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
