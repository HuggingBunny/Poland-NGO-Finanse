use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub email: String,
    pub role: String,
    pub active: bool,
    pub created_at: String,
    pub last_login: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Organization {
    pub name: String,
    pub nip: String,
    pub krs: String,
    pub regon: String,
    pub address: String,
    pub city: String,
    pub postal_code: String,
    pub country: String,
    pub email: String,
    pub phone: String,
    pub bank_account: String,
    pub bank_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Receipt {
    pub id: String,
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
    pub ocr_text: Option<String>,
    pub ai_confidence: Option<f64>,
    pub ai_suggested_category: Option<String>,
    pub ai_suggested_vat_rate: Option<i64>,
    pub ai_vat_eligible: Option<bool>,
    pub ai_reasoning: Option<String>,
    pub ai_model: Option<String>,
    pub ai_processed_at: Option<String>,
    pub uploaded_by: String,
    pub uploaded_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Bill {
    pub id: String,
    pub vendor: String,
    pub invoice_number: String,
    pub description: String,
    pub amount: f64,
    pub vat_amount: f64,
    pub issue_date: String,
    pub due_date: String,
    pub paid_date: Option<String>,
    pub status: String,
    pub category: String,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InvoiceParty {
    pub name: String,
    pub nip: Option<String>,
    pub krs: Option<String>,
    pub regon: Option<String>,
    pub address: String,
    pub city: String,
    pub postal_code: String,
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InvoiceItem {
    pub id: String,
    pub invoice_id: String,
    pub description: String,
    pub quantity: f64,
    pub unit: String,
    pub unit_price_net: f64,
    pub vat_rate: i64,
    pub net_amount: f64,
    pub vat_amount: f64,
    pub gross_amount: f64,
    pub sort_order: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Invoice {
    pub id: String,
    pub number: String,
    pub status: String,
    pub issue_date: String,
    pub sale_date: String,
    pub due_date: String,
    pub paid_date: Option<String>,
    pub seller: InvoiceParty,
    pub buyer: InvoiceParty,
    pub items: Vec<InvoiceItem>,
    pub net_total: f64,
    pub vat_total: f64,
    pub gross_total: f64,
    pub currency: String,
    pub payment_method: String,
    pub bank_account: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Employee {
    pub id: String,
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ZusBreakdown {
    pub emerytalne_pracownik: f64,
    pub rentowe_pracownik: f64,
    pub chorobowe_pracownik: f64,
    pub zdrowotne: f64,
    pub emerytalne_pracodawca: f64,
    pub rentowe_pracodawca: f64,
    pub wypadkowe: f64,
    pub fp: f64,
    pub fgsp: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payslip {
    pub id: String,
    pub employee_id: String,
    pub employee: Option<Employee>,
    pub month: String,
    pub gross_salary: f64,
    pub zus: ZusBreakdown,
    pub tax_base: f64,
    pub pit_advance: f64,
    pub tax_relief: f64,
    pub net_salary: f64,
    pub total_employer_cost: f64,
    pub generated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LegalChange {
    pub id: String,
    pub title: String,
    pub description: String,
    pub effective_date: String,
    pub severity: String,
    pub affects: Vec<String>,
    pub app_version_required: Option<String>,
    pub update_available: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LegalFeed {
    pub last_updated: String,
    pub changes: Vec<LegalChange>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LegalChangeWithStatus {
    pub change: LegalChange,
    pub days_until: i64,
    pub dismissed: bool,
}
