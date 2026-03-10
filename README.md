# KrakowNGO Finanse

A comprehensive non-functional UI mockup of a cross-platform desktop accounting application built for a Polish non-profit organization (Fundacja Pomocna Dłoń) in Kraków.

**This is a UI mockup only.** No real backend, no real OCR, no real LLM calls. Everything runs in the browser with mock data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | Tauri v1 (config stub only, no Rust backend) |
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 (dark mode: class) |
| i18n | i18next + react-i18next (Polish + English) |
| Icons | lucide-react |
| Charts | recharts |
| State | React useState/useContext |

---

## Quick Start (Web Dev Mode)

```bash
cd krakow-ngo-accounting
npm install
npm run dev
```

Open http://localhost:1420 in your browser.

---

## Demo Accounts

| Username | Password | Role | Access |
|---|---|---|---|
| `admin` | `admin` | Administrator | Full access to all modules |
| `ksiegowa` | `pass` | Księgowość | Receipts, Bills, Invoicing, Payroll, Reports |
| `dyrektor` | `pass` | Zarząd / Management | Reports only |
| `wolontariusz` | `pass` | Użytkownik | Submit receipts only |

Click any demo account row on the login page to auto-fill credentials.

---

## Features

### Dashboard
- 4 summary KPI cards (Income, Expenses, Balance, Pending Invoices)
- Monthly cash flow line chart (recharts) - full year 2025 data
- Expense breakdown pie chart by category
- Recent 10 transactions table

### Receipts (Paragony)
- Visual drag-and-drop upload zone (no actual upload)
- Receipt list with search and status filter
- Side panel showing OCR text (mock) and AI classification result
- Mock DeepSeek-R1 classification with confidence bar, category suggestion, and Polish VAT reasoning
- Approve / Reject workflow
- VAT deductible tracking

### Bills (Faktury kosztowe)
- Bills list with overdue highlighting (red rows)
- "Mark as Paid" action per bill
- Add Bill modal form
- Cash flow summary cards
- ZUS and PIT obligations shown as bills

### Invoicing (Fakturowanie)
- Invoice list with status filter
- Full invoice detail modal with Polish VAT invoice format
- NIP, KRS, REGON fields for both seller and buyer
- Line items with VAT breakdown (23%, 8%, 5%, ZW)
- Invoice number format: FV/YYYY/MM/NNN
- "Eksport KSeF" button (grayed with tooltip: coming 2026)
- Mark as Paid workflow

### Payroll (Kadry i płace)
- Employee list with contract type badges
- Live calculation of ZUS + PIT for selected month using 2026 Polish rates:
  - Employee ZUS: 9.76% emerytalne, 1.5% rentowe, 2.45% chorobowe, 9% zdrowotne
  - Employer ZUS: 9.76% emerytalne, 6.5% rentowe, 1.67% wypadkowe, 2.45% FP, 0.1% FGŚP
  - PIT: 12% to 120k PLN/year, tax relief 300 PLN/month
- Payslip modal with full breakdown
- Month selector
- Generate payslips button

### Reports (Raporty)
- 6 report types: Bilans, Rachunek Wyników, Przepływy Pieniężne, Deklaracja VAT, Sprawozdanie Roczne, Zestawienie Kosztów
- Date range selector
- Mock report preview with realistic Polish accounting data
- Export PDF / Excel buttons (visual only)
- Legal basis noted for each report (UoRach, UoDPPioW, etc.)

### Settings (Ustawienia) — Admin only
- User management: add, edit, delete users
- Role assignment
- "Resetuj hasło" per user (resets to 'password' in mock)
- Organization details form (NIP, KRS, REGON, address, bank account)
- Ollama/AI connection settings with test connection button
- Full system prompt shown for receipt classification

---

## Internationalization

All UI strings available in Polish (`pl`) and English (`en`). Toggle via the globe icon in the header or login page. Language preference saved to localStorage.

---

## Dark Mode

Tailwind CSS `class` strategy. Toggle via moon/sun icon. System preference detected on first load. Saved to localStorage.

---

## Project Structure

```
src/
  App.tsx                    — Root with providers
  main.tsx                   — Entry point
  index.css                  — Tailwind directives + scrollbar styles
  i18n/
    index.ts                 — i18next init
    locales/pl.json          — Polish translations
    locales/en.json          — English translations
  contexts/
    AuthContext.tsx           — Mock JWT auth, roles, user state
    ThemeContext.tsx          — Light/dark toggle with system detection
  components/
    Auth/LoginPage.tsx        — Login form with demo account quick-fill
    Layout/
      AppShell.tsx            — Main layout shell
      Sidebar.tsx             — Collapsible sidebar nav
      Header.tsx              — Top bar with user menu, toggles
    modules/
      Dashboard/DashboardModule.tsx
      Receipts/ReceiptsModule.tsx
      Bills/BillsModule.tsx
      Invoicing/InvoicingModule.tsx
      Payroll/PayrollModule.tsx
      Reports/ReportsModule.tsx
      Settings/SettingsModule.tsx
  types/index.ts              — All TypeScript interfaces
  data/mockData.ts            — Realistic Polish mock data + payroll calc

src-tauri/
  tauri.conf.json             — Tauri config stub
  Cargo.toml                  — Rust package stub
```

---

## Tauri Desktop Build (when ready)

To build as a real desktop app, you'd need:
1. Install Rust: https://rustup.rs
2. Install Tauri CLI: `cargo install tauri-cli`
3. Add `src-tauri/src/main.rs` with Tauri boilerplate
4. Run: `cargo tauri dev` or `cargo tauri build`

The `src-tauri/tauri.conf.json` and `Cargo.toml` are valid stubs ready to be extended.

---

## Mock Data Details

All mock data in `src/data/mockData.ts`:
- **Organization**: Fundacja Pomocna Dłoń, NIP: 6761234567, KRS: 0000123456, ul. Floriańska 15/3, Kraków
- **Employees**: 6 employees, Polish names, salaries 4800–11500 PLN gross
- **Receipts**: Polish vendors (Empik, PKP Intercity, Biedronka, Media Expert, OVH)
- **Bills**: Tauron, MPK Kraków, ZUS, US, law firm, etc.
- **Invoices**: Gmina Kraków, MOPS, MCK SOKÓŁ as buyers
- **Transactions**: PLN amounts, Jan–Mar 2026

---

*Built as a demo mockup. Not for production use.*
