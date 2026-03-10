// ─── Auth & Users ───────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'ksiegowa' | 'dyrektor' | 'wolontariusz';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthToken {
  token: string;
  user: User;
  expiresAt: string;
}

// ─── Organization ───────────────────────────────────────────────────────────

export interface Organization {
  name: string;
  nip: string;
  krs: string;
  regon: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  bankAccount: string;
  bankName: string;
}

// ─── Receipts ───────────────────────────────────────────────────────────────

export type ReceiptStatus = 'oczekuje' | 'zaklasyfikowany' | 'zatwierdzony' | 'odrzucony';
export type VATRate = 23 | 8 | 5 | 0;
export type ExpenseCategory = 'Biuro' | 'Podróże' | 'Catering' | 'Sprzęt' | 'Usługi' | 'Inne';

export interface Receipt {
  id: string;
  date: string;
  vendor: string;
  description: string;
  amountGross: number;
  amountNet: number;
  vatRate: VATRate;
  vatAmount: number;
  category: ExpenseCategory;
  status: ReceiptStatus;
  vatEligible: boolean;
  fileName?: string;
  ocrText?: string;
  aiClassification?: AIClassification;
  uploadedBy: string;
  uploadedAt: string;
}

export interface AIClassification {
  confidence: number;
  suggestedCategory: ExpenseCategory;
  suggestedVatRate: VATRate;
  vatEligible: boolean;
  reasoning: string;
  model: string;
  processedAt: string;
}

// ─── Bills ──────────────────────────────────────────────────────────────────

export type BillStatus = 'nieoplacona' | 'oplacona' | 'przeterminowana';

export interface Bill {
  id: string;
  vendor: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  vatAmount: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  status: BillStatus;
  category: ExpenseCategory;
  notes?: string;
}

// ─── Invoicing ──────────────────────────────────────────────────────────────

export type InvoiceStatus = 'szkic' | 'wystawiona' | 'oplacona' | 'anulowana';

export interface InvoiceParty {
  name: string;
  nip?: string;
  krs?: string;
  regon?: string;
  address: string;
  city: string;
  postalCode: string;
  email?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceNet: number;
  vatRate: VATRate;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  issueDate: string;
  saleDate: string;
  dueDate: string;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  lineItems: InvoiceLineItem[];
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
  currency: string;
  paymentMethod: string;
  bankAccount?: string;
  notes?: string;
  paidDate?: string;
}

// ─── Payroll ────────────────────────────────────────────────────────────────

export type ContractType = 'umowa_o_prace' | 'umowa_zlecenie' | 'umowa_o_dzielo' | 'b2b';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  pesel: string;
  position: string;
  department: string;
  contractType: ContractType;
  grossSalary: number;
  startDate: string;
  email: string;
  bankAccount: string;
  taxOffice: string;
  active: boolean;
}

export interface ZUSBreakdown {
  // Employee contributions (from gross)
  emerytalne_pracownik: number;
  rentowe_pracownik: number;
  chorobowe_pracownik: number;
  zdrowotne: number;
  // Employer contributions (additional cost)
  emerytalne_pracodawca: number;
  rentowe_pracodawca: number;
  wypadkowe: number;
  fp: number;
  fgsp: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employee: Employee;
  month: string; // YYYY-MM
  grossSalary: number;
  zus: ZUSBreakdown;
  taxBase: number;
  pitAdvance: number;
  taxRelief: number;
  netSalary: number;
  totalEmployerCost: number;
  generatedAt: string;
}

// ─── Reports ────────────────────────────────────────────────────────────────

export type ReportType =
  | 'bilans'
  | 'rachunek_wynikow'
  | 'przeplywy_pieniezne'
  | 'deklaracja_vat'
  | 'sprawozdanie_roczne'
  | 'zestawienie_kosztow';

export interface ReportDefinition {
  id: ReportType;
  nameKey: string;
  descriptionKey: string;
  legalBasis?: string;
  icon: string;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface SummaryCard {
  id: string;
  titleKey: string;
  value: number;
  currency: string;
  changePercent: number;
  changeDirection: 'up' | 'down' | 'neutral';
  icon: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface ExpensePieData {
  name: string;
  value: number;
  color: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  vendor: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  status: string;
}

// ─── Settings ───────────────────────────────────────────────────────────────

export interface OllamaSettings {
  url: string;
  model: string;
  connectionStatus: 'connected' | 'disconnected' | 'testing' | 'unknown';
}

export interface AppSettings {
  organization: Organization;
  ollama: OllamaSettings;
  defaultCurrency: string;
  fiscalYearStart: string;
  language: 'pl' | 'en';
  theme: 'light' | 'dark' | 'system';
}

// ─── Legal Updates ────────────────────────────────────────────────────────────

export interface LegalChange {
  id: string;
  title: string;
  description: string;
  effective_date: string;
  severity: 'info' | 'warning' | 'critical';
  affects: string[];
  app_version_required: string | null;
  update_available: boolean;
}

export interface LegalChangeWithStatus {
  change: LegalChange;
  days_until: number;
  dismissed: boolean;
}
