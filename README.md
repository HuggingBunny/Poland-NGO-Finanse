# KrakowNGO Finanse

> Cross-platform desktop accounting application for Polish non-profit organizations. Built on Tauri (Rust + SQLite backend) + React/TypeScript frontend. Designed specifically for the accounting and legal compliance requirements of Polish NGOs (*fundacje* and *stowarzyszenia*).

**Status: v0.4.0 — pre-beta.** Full Rust/SQLite backend written and registered. All frontend modules wired to `invoke()`. Browser dev mode runs with full in-memory mock fallback (`npm run dev`). Desktop mode requires Rust toolchain (see [Running as a Desktop App](#running-as-a-desktop-app)).

---

## Features

### Modules

| Module | Polish Name | Status |
|--------|-------------|--------|
| Dashboard | Panel główny | ✅ Live — KPI cards, charts, transactions |
| Receipts | Paragony | ✅ Live — Ollama AI processing, new vendor detection, approve/reject |
| Bills | Faktury kosztowe | ✅ Live — overdue tracking, mark paid, add bills |
| Invoicing | Fakturowanie | ✅ Live — Polish VAT format, NIP/KRS/REGON, KSeF-ready |
| Payroll | Kadry i płace | ✅ Live — 2026 ZUS+PIT rates, payslip generator |
| Reports | Raporty | ✅ Live — 6 report types, CSV export, PDF via print dialog |
| Service Providers | Dostawcy | ✅ Live — vendor address book, CRUD, auto-match on receipt import |
| Settings | Ustawienia | ✅ Live — user CRUD, org details, Ollama config, Email, Backups, Logs |
| Legal Compliance | Zgodność Prawna | ✅ Live — change feed, urgency badges, dismiss/apply |

### What works right now (browser dev mode)

- **Full interactive UI** — every form, modal, and button functional
- **Role-based access control** — 4 roles: Admin, Księgowość, Zarząd, Wolontariusz
- **Live payroll calculation** — 2026 ZUS/PIT rates applied per employee
- **Legal change warning system** — polls a GitHub-hosted feed, shows badge counts and urgency timelines
- **Real CSV export** — generates downloadable `.csv` with UTF-8 BOM (Excel-compatible, Polish diacritics preserved)
- **PDF export** — `window.print()` → OS print dialog (Save as PDF on macOS/Windows)
- **User management** — create, edit, soft-delete users; reset passwords
- **Dark mode** + **PL/EN i18n** — system default detection, persistent

### What requires the Rust backend (desktop mode only)

- SQLite persistence across sessions
- Real bcrypt password auth
- File system access (receipt uploads, log files)
- Tesseract OCR pipeline *(planned)*
- Ollama AI classification *(planned)*

---
### Near Future Plans:
---

- 🟡 v0.5.x — UI/UX Gaps (4 items)
#	Item	What it involves
1	Legal compliance dashboard banner	When there are active legal warnings, show an alert card on the Dashboard (not just the Header bell icon). Links to Settings → Zgodność Prawna. Visible to admin + ksiegowa.
2	Employee management clarity	Employees are buried in Payroll. Either a dedicated sidebar nav item ("Pracownicy") or a prominent entry point in the Payroll module header. Add/edit/deactivate forms need to be obvious.
3	Category management UI	Categories are hardcoded enums right now. Need a Settings tab for CRUD on receipt/payment categories — new DB table, Tauri commands, receipt/bill forms load categories dynamically.
4	Expenses by employee report	New report type: gross salary + employer ZUS + attributed receipts per employee for a date range. Table + CSV export. New Tauri command get_expenses_by_employee.

🟠 v0.6.x — IT Admin Role + Logging (3 items)
#	Item	What it involves
5	IT Admin role	New it_admin role — same data access as admin, plus access to the Logs module. Added to auth, sidebar, role colors everywhere.
6	Application log viewer	Daily JSON log files in {app_data}/logs/app/, 30-day rotation. Log viewer UI: date picker, level filter, search. Admin + IT Admin only.
7	Audit log	Separate daily files in {app_data}/logs/audit/, 90-day rotation. Records who/what/when per action. Viewer with filters by user, action type, date range. Admin + IT Admin only.

🟠 v0.7.x — Dockerize it ??
---

## Screenshots

| | |
|---|---|
| ![Dashboard](screenshots/01-dashboard.png) | ![Receipts](screenshots/02-receipts.png) |
| **Dashboard** — KPI cards, cash flow chart, transactions | **Receipts** — drag-drop upload, OCR panel, AI classification |
| ![Bills](screenshots/03-bills.png) | ![Invoicing](screenshots/04-invoicing.png) |
| **Bills** — overdue tracking, mark paid, cash flow summary | **Invoicing** — Polish VAT format, NIP/KRS/REGON, KSeF-ready |
| ![Payroll](screenshots/05-payroll.png) | ![Reports](screenshots/06-reports.png) |
| **Payroll** — 2026 ZUS+PIT rates, payslip generator | **Reports** — 6 report types, CSV export, PDF print |
| ![Settings](screenshots/07-settings.png) | |
| **Settings** — user CRUD, roles, org details, Ollama config | |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop framework | Tauri v1 (Rust) |
| Database | SQLite via `rusqlite` (bundled — no external install) |
| Auth | bcrypt password hashing |
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS v3 (dark mode: `class`) |
| i18n | i18next + react-i18next (Polish + English) |
| Charts | Recharts |
| Icons | Lucide React |
| HTTP (legal feed) | reqwest (blocking) |
| AI (planned) | Ollama + DeepSeek-R1 (local, offline) |

---

## Quick Start (Browser / Dev Mode)

No Rust required. Runs entirely in-browser with mock data.

```bash
git clone https://github.com/HuggingBunny/Poland-NGO-Finanse
cd krakow-ngo-accounting
npm install
npm run dev
```

Open **http://localhost:1420**

### Demo Accounts

| Username | Password | Role | Access |
|----------|----------|------|--------|
| `admin` | `admin` | Administrator | Full access — all modules + Settings + Logs |
| `ksiegowa` | `pass` | Księgowość | Receipts, Bills, Invoicing, Payroll, Reports |
| `dyrektor` | `pass` | Zarząd | Reports only |
| `wolontariusz` | `pass` | Użytkownik | Submit receipts only |

Click any demo account row on the login page to auto-fill credentials.

---

## Running as a Desktop App

Requires Rust and Tauri CLI. Use the bundled install script:

```bash
./install.sh
```

This checks for and installs:
- Node.js ≥ 18
- Rust (via rustup)
- Tauri CLI (`cargo install tauri-cli`)
- npm dependencies
- Runs a build verification

Then:

```bash
npm run tauri dev     # development (hot reload)
npm run tauri build   # production .app / .exe / .deb
```

First `cargo` compile takes 5–15 minutes while it builds all Rust dependencies. Subsequent builds are fast.

On first login with `admin`/`admin` in desktop mode, a prompt will require changing the default password before proceeding.

---

## Troubleshooting

### `Error: Port 1420 is already in use`

**This is a development-only issue. It does not exist in production builds.**
In a production `.dmg`/`.deb`/`.msi`, Vite is compiled into the binary — no ports, no Node, nothing external.

**Root cause**: A launchd agent (`~/Library/LaunchAgents/com.chad.krakow-ngo-accounting.plist`) with `KeepAlive: true` was running `npm run dev` as a background service and restarting it within 10 seconds whenever it was killed. Killing the Vite process by PID was ineffective because launchd kept respawning it.

**Permanent fix** (done — plist removed):
```bash
launchctl unload ~/Library/LaunchAgents/com.chad.krakow-ngo-accounting.plist
rm ~/Library/LaunchAgents/com.chad.krakow-ngo-accounting.plist
```

`tauri dev` manages Vite itself — no background agent is needed or appropriate.

**If the error recurs** (orphan from a crashed `tauri dev` run):
```bash
lsof -iTCP:1420 -sTCP:LISTEN -nP   # find what's holding it
lsof -ti :1420 | xargs kill -9      # clear it
npm run tauri dev                    # retry
```

**Production note**: `npm run tauri build` compiles React into the Rust binary. The installed app has no dev server, no Vite, no Node process, and listens on no ports.

---

### Ollama not connecting (`test_ollama_connection` returns false)

**Check if Ollama is running:**
```bash
curl http://127.0.0.1:11434/api/tags
```
If you get `Connection refused`, start it:
```bash
ollama serve &
```

**Check available models:**
```bash
ollama list
```
If `llama3` isn't listed, pull it:
```bash
ollama pull llama3
```

**Low RAM fallback** — if your machine struggles with llama3 (~8GB RAM required):
```bash
ollama pull llama3.2:3b   # smaller, runs on 4GB, less accurate
```
Then update Settings → AI → Model to `llama3.2:3b`.

---

### Receipt processing hangs (spinner never resolves)

The Ollama request has a 120-second timeout. If it hits that:
- Check if Ollama is actually processing: `ollama ps`
- If nothing shows in `ollama ps`, the request never reached Ollama — check the Ollama URL in Settings → AI
- If a model shows in `ollama ps` but never finishes, your hardware is too slow for the selected model — switch to a smaller one (see above)

---

### Rust compile errors on first build

First build compiles all dependencies — if it fails:

```bash
# See just the errors, stripped of noise
cargo build --manifest-path src-tauri/Cargo.toml 2>&1 | grep -A3 "^error"
```

Common issues:
- **Missing Xcode Command Line Tools** (macOS): `xcode-select --install`
- **Rust toolchain too old**: `rustup update stable`
- **`tauri-cli` version mismatch**: `cargo install tauri-cli --version "^1.6" --force`

---

## Polish Legal Compliance

The app is built around the specific compliance requirements for Polish non-profits: 
I am not an accountant and this is based on the data available from the date of this posting, though there is an in app updater. it is up to you to verify this is the data you need.

Zmiana podstawy wymiaru składek ZUS od 1 stycznia 2027. Wymagana aktualizacja stawek.
Effective Date: 2027-01-01296 days until effective


| Requirement | Coverage |
|-------------|----------|
| Double-entry bookkeeping | Schema + reporting structure |
| VAT rates: 23%, 8%, 5%, ZW | Receipt + invoice classification |
| ZUS składki (2026 rates) | Live payroll calculation |
| PIT advance tax (2026) | Live payroll calculation, ulga podatkowa |
| JPK_V7M structure | Deklaracja VAT report preview |
| KSeF e-invoicing mandate | Invoicing module, KSeF export button (2026/2027 phases tracked) |
| Annual reporting (UoRach art. 45) | Sprawozdanie Roczne report |
| DPPioW art. 23 | Sprawozdanie Roczne report |

### Legal Change Warning System

A GitHub-hosted `legal-updates.json` feed is polled daily. Upcoming legal changes (ZUS rate changes, KSeF mandate phases, JPK schema updates) trigger:

- **> 90 days** — silent
- **30–90 days** — yellow badge in header + yellow card in Settings
- **< 30 days** — red persistent badge + red card
- **Past effective date, unapplied** — hard modal warning on next login

---

## Backend Architecture

### SQLite Schema (15 tables)

```
users, organization, receipts, bills, invoices, invoice_items,
employees, payslips, app_settings, legal_updates_dismissed,
service_providers, email_settings, admin_logs, backup_configs, monthly_ledger
```

WAL mode enabled. Foreign keys enforced. Schema migration runs on first launch, seeding default org and admin user.

### Tauri Commands (49 registered)

| Module | Commands |
|--------|----------|
| Auth | `login`, `get_users`, `create_user`, `update_user`, `reset_password` |
| Receipts | `get_receipts`, `upsert_receipt`, `update_receipt_status`, `delete_receipt` |
| Bills | `get_bills`, `upsert_bill`, `mark_bill_paid`, `delete_bill` |
| Invoices | `get_invoices`, `save_invoice`, `mark_invoice_paid`, `delete_invoice` |
| Employees | `get_employees`, `upsert_employee`, `delete_employee` |
| Payroll | `get_payslips`, `generate_payslip`, `calc_payslip` |
| Settings | `get_organization`, `save_organization`, `get_setting`, `set_setting` |
| Legal | `get_legal_updates`, `dismiss_legal_update`, `apply_legal_update` |
| Dashboard | `get_dashboard_data` |
| Ollama | `process_receipt_with_ollama`, `test_ollama_connection` |
| Service Providers | `get_service_providers`, `search_service_provider`, `upsert_service_provider`, `delete_service_provider` |
| Admin Logs | `get_admin_logs`, `add_admin_log`, `cleanup_old_logs` |
| Backup | `get_backup_configs`, `upsert_backup_config`, `delete_backup_config`, `run_backup`, `list_backups`, `restore_backup` |
| Email | `get_email_settings`, `save_email_settings` |
| Ledger | `generate_monthly_ledger`, `get_monthly_ledgers`, `check_monthly_rollover` |

### invoke() Bridge

`src/lib/invoke.ts` detects `window.__TAURI__` at runtime:
- **Desktop**: routes to real Tauri `invoke()` → Rust backend → SQLite
- **Browser**: routes to `mockInvoke()` → in-memory state (resets on refresh)

`npm run dev` always works. No Rust required for UI development.

---

## Project Structure

```
krakow-ngo-accounting/
├── src/
│   ├── App.tsx                        — Root with providers
│   ├── lib/invoke.ts                  — Tauri/mock bridge
│   ├── contexts/
│   │   ├── AuthContext.tsx            — Auth state, session management
│   │   ├── ThemeContext.tsx           — Dark/light + system detection
│   │   └── LegalUpdatesContext.tsx    — Legal feed polling, urgentCount
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginPage.tsx          — Login + demo quick-fill
│   │   │   └── ChangePasswordModal.tsx — First-run admin password prompt
│   │   └── Layout/
│   │       ├── AppShell.tsx           — Layout shell + module routing
│   │       ├── Sidebar.tsx            — Collapsible, role-filtered nav
│   │       └── Header.tsx             — Legal bell badge, theme, lang, user menu
│   ├── modules/
│   │   ├── Dashboard/DashboardModule.tsx
│   │   ├── Receipts/ReceiptsModule.tsx
│   │   ├── Bills/BillsModule.tsx
│   │   ├── Invoicing/InvoicingModule.tsx
│   │   ├── Payroll/PayrollModule.tsx
│   │   ├── Reports/ReportsModule.tsx
│   │   └── Settings/SettingsModule.tsx
│   ├── types/index.ts                 — All TypeScript interfaces
│   ├── data/mockData.ts               — Realistic Polish mock data
│   └── i18n/locales/{pl,en}.json     — ~200 translation keys each
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                    — Tauri builder + 28 command handlers
│   │   ├── db.rs                      — SQLite init, migrations, seed
│   │   ├── models.rs                  — Rust structs for all domain types
│   │   └── commands/
│   │       ├── auth.rs, receipts.rs, bills.rs, invoices.rs
│   │       ├── employees.rs, payroll.rs, settings.rs
│   │       ├── legal.rs, dashboard.rs
│   │       └── mod.rs
│   ├── Cargo.toml                     — Full dependency set
│   ├── build.rs                       — tauri_build::build()
│   └── tauri.conf.json                — Window config, allowlist
├── public/legal-updates.json          — Bundled legal change feed
└── install.sh                         — Prereq checker + installer
```

---

## Mock Organization

```
Fundacja Pomocna Dłoń
NIP:    676-123-45-67
KRS:    0000123456
REGON:  123456789
ul. Floriańska 15/3, 31-019 Kraków
```

Mock data includes 6 employees, receipts from Polish vendors (Empik, PKP, Biedronka, OVH), bills from Tauron/ZUS/MPK/US, and invoices from Gmina Kraków/MOPS.

---

## Roadmap

### Recently Completed
- ✅ Ollama receipt processing (llama3 / llama3.2-vision, local API, 120s timeout)
- ✅ Service Providers address book (CRUD, auto-match on receipt import, new vendor detection modal)
- ✅ Admin Logs tab in Settings (30-day rotation, level filter, auto-refresh)
- ✅ Multi-target Backups (USB, SMB/NAS, Google Drive Desktop, local path — run/list/restore)
- ✅ Email config (SMTP settings stored; send functionality intentionally hidden pending full implementation)
- ✅ Monthly ledger CSV export with auto-rollover detection on 1st of month
- ✅ Cross-platform Ollama bootstrap scripts (`scripts/install_ollama.sh` / `.ps1`)

### Next (v0.5.x)
- Legal compliance alert card on Dashboard
- Employee management dedicated entry point (currently inside Payroll)
- Category management UI — custom receipt/payment categories (currently hardcoded)
- Expenses by employee report
- Enable email send functionality (SMTP framework in place, send buttons hidden)
- Monthly ledger: `.xlsx` template mapping (currently outputs CSV)

### Medium term
- KSeF XML export with UPO token flow
- ZUS e-Deklaracje XML export
- JPK_V7M monthly VAT export
- llama3.2-vision path fully tested for image receipt processing (JPG/PNG)
- SMB sync for multi-machine SQLite access

---

*Built for Fundacja Pomocna Dłoń, Kraków. Not for production use in current state.*
