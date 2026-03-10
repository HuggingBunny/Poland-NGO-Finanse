// Detect if running inside Tauri
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Safe invoke wrapper — falls back to mock if not in Tauri
export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/tauri');
    return tauriInvoke<T>(command, args);
  }
  return mockInvoke<T>(command, args);
}

// ─── Mock fallback (browser dev mode) ────────────────────────────────────────
import {
  mockReceipts, mockBills, mockInvoices, mockEmployees,
  mockUsers, mockOrganization, calculatePayslip,
} from '../data/mockData';
import type { Receipt, Bill, Invoice, Employee, User, Organization, Payslip } from '../types';

// In-memory state for web mode (resets on page refresh — expected in dev)
let _receipts: Receipt[] = [...mockReceipts];
let _bills: Bill[] = [...mockBills];
let _invoices: Invoice[] = [...mockInvoices];
let _employees: Employee[] = [...mockEmployees];
let _users: User[] = [...mockUsers];

async function mockInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  // Simulate async
  await new Promise(r => setTimeout(r, 50));

  switch (command) {
    // Auth
    case 'login': {
      const { username, password } = args as { username: string; password: string };
      const passwords: Record<string, string> = { admin: 'admin', ksiegowa: 'pass', dyrektor: 'pass', wolontariusz: 'pass' };
      const user = _users.find(u => u.username === username && u.active);
      if (user && passwords[username] === password) {
        return { success: true, user, error: null } as T;
      }
      return { success: false, user: null, error: 'Nieprawidłowe dane logowania' } as T;
    }
    case 'get_users': return _users as T;
    case 'create_user': {
      const u = args as { username: string; display_name: string; email: string; role: string };
      const newUser: User = { id: `u${Date.now()}`, username: u.username, displayName: u.display_name, email: u.email, role: u.role as User['role'], active: true, createdAt: new Date().toISOString() };
      _users = [..._users, newUser];
      return newUser as T;
    }
    case 'update_user': {
      const p = args as { id: string; display_name: string; email: string; role: string; active: boolean };
      _users = _users.map(u => u.id === p.id ? { ...u, displayName: p.display_name, email: p.email, role: p.role as User['role'], active: p.active } : u);
      return null as T;
    }
    case 'reset_password': return null as T;

    // Receipts
    case 'get_receipts': return _receipts as T;
    case 'upsert_receipt': {
      const p = args as Partial<Receipt> & { id?: string };
      if (p.id && _receipts.find(r => r.id === p.id)) {
        _receipts = _receipts.map(r => r.id === p.id ? { ...r, ...p } : r);
      } else {
        const newR = { ...p, id: p.id || `r${Date.now()}` } as Receipt;
        _receipts = [newR, ..._receipts];
      }
      return (p.id || `r${Date.now()}`) as T;
    }
    case 'update_receipt_status': {
      const { id, status } = args as { id: string; status: string };
      _receipts = _receipts.map(r => r.id === id ? { ...r, status: status as Receipt['status'] } : r);
      return null as T;
    }
    case 'delete_receipt': {
      _receipts = _receipts.filter(r => r.id !== (args as { id: string }).id);
      return null as T;
    }

    // Bills
    case 'get_bills': return _bills as T;
    case 'upsert_bill': {
      const p = args as Partial<Bill> & { id?: string };
      if (p.id && _bills.find(b => b.id === p.id)) {
        _bills = _bills.map(b => b.id === p.id ? { ...b, ...p } : b);
      } else {
        const newB = { ...p, id: `b${Date.now()}`, status: 'nieoplacona' } as Bill;
        _bills = [..._bills, newB];
      }
      return (p.id || `b${Date.now()}`) as T;
    }
    case 'mark_bill_paid': {
      const { id, paid_date } = args as { id: string; paid_date: string };
      _bills = _bills.map(b => b.id === id ? { ...b, status: 'oplacona' as Bill['status'], paidDate: paid_date } : b);
      return null as T;
    }
    case 'delete_bill': {
      _bills = _bills.filter(b => b.id !== (args as { id: string }).id);
      return null as T;
    }

    // Invoices
    case 'get_invoices': return _invoices as T;
    case 'save_invoice': {
      const p = args as Partial<Invoice> & { id?: string };
      const id = p.id || `i${Date.now()}`;
      if (_invoices.find(i => i.id === id)) {
        _invoices = _invoices.map(i => i.id === id ? { ...i, ...p } : i);
      } else {
        _invoices = [{ ...p, id } as Invoice, ..._invoices];
      }
      return id as T;
    }
    case 'mark_invoice_paid': {
      const { id, paid_date } = args as { id: string; paid_date: string };
      _invoices = _invoices.map(i => i.id === id ? { ...i, status: 'oplacona' as Invoice['status'], paidDate: paid_date } : i);
      return null as T;
    }
    case 'delete_invoice': {
      _invoices = _invoices.filter(i => i.id !== (args as { id: string }).id);
      return null as T;
    }

    // Employees
    case 'get_employees': return _employees as T;
    case 'upsert_employee': {
      const p = args as Partial<Employee> & { id?: string };
      const id = p.id || `e${Date.now()}`;
      if (_employees.find(e => e.id === id)) {
        _employees = _employees.map(e => e.id === id ? { ...e, ...p } : e);
      } else {
        _employees = [..._employees, { ...p, id } as Employee];
      }
      return id as T;
    }
    case 'delete_employee': {
      _employees = _employees.map(e => e.id === (args as { id: string }).id ? { ...e, active: false } : e);
      return null as T;
    }

    // Payroll
    case 'get_payslips': {
      const { month } = args as { month: string };
      return _employees.filter(e => e.active).map(e => calculatePayslip(e, month)) as T;
    }
    case 'generate_payslip': {
      const { employee_id, month } = args as { employee_id: string; month: string };
      const emp = _employees.find(e => e.id === employee_id);
      if (!emp) throw new Error('Employee not found');
      return calculatePayslip(emp, month) as T;
    }

    // Settings
    case 'get_organization': return mockOrganization as unknown as T;
    case 'save_organization': return null as T;
    case 'get_setting': return null as T;
    case 'set_setting': return null as T;

    // Legal
    case 'get_legal_updates': {
      const today = new Date();
      return [
        {
          change: {
            id: 'ksef-mandatory-2026',
            title: 'KSeF — obowiązek dla dużych firm',
            description: 'KSeF staje się obowiązkowy dla podmiotów o przychodach powyżej 200 tys. PLN od 1 lipca 2026.',
            effective_date: '2026-07-01',
            severity: 'warning',
            affects: ['invoicing'],
            app_version_required: null,
            update_available: false,
          },
          days_until: Math.floor((new Date('2026-07-01').getTime() - today.getTime()) / 86400000),
          dismissed: false,
        },
        {
          change: {
            id: 'zus-2027-rates',
            title: 'Nowe stawki ZUS 2027',
            description: 'Zmiana podstawy wymiaru składek ZUS od 1 stycznia 2027. Wymagana aktualizacja stawek.',
            effective_date: '2027-01-01',
            severity: 'critical',
            affects: ['payroll'],
            app_version_required: '1.1.0',
            update_available: true,
          },
          days_until: Math.floor((new Date('2027-01-01').getTime() - today.getTime()) / 86400000),
          dismissed: false,
        },
      ] as T;
    }
    case 'dismiss_legal_update': return null as T;
    case 'apply_legal_update': return null as T;

    default:
      console.warn(`[invoke] Unknown command in web mode: ${command}`);
      return null as T;
  }
}
