import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, ChevronDown, X, FileText, Printer } from 'lucide-react';
import { mockEmployees, calculatePayslip, ZUS_RATES, PIT_RATES } from '../../../data/mockData';
import type { Employee, Payslip } from '../../../types';
import clsx from 'clsx';

function formatPLN(amount: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
}

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

interface PayslipModalProps {
  payslip: Payslip;
  onClose: () => void;
}

function PayslipModal({ payslip, onClose }: PayslipModalProps) {
  const { t } = useTranslation();
  const emp = payslip.employee;
  const [month, year] = payslip.month.split('-');
  const monthName = MONTHS_PL[parseInt(month) - 1];

  const rows = [
    { label: 'Wynagrodzenie zasadnicze brutto', value: payslip.grossSalary, bold: true },
    { label: '', value: null, divider: true },
    { label: `Emerytalne pracownik (${(ZUS_RATES.emerytalne_pracownik * 100).toFixed(2)}%)`, value: -payslip.zus.emerytalne_pracownik },
    { label: `Rentowe pracownik (${(ZUS_RATES.rentowe_pracownik * 100).toFixed(2)}%)`, value: -payslip.zus.rentowe_pracownik },
    { label: `Chorobowe (${(ZUS_RATES.chorobowe * 100).toFixed(2)}%)`, value: -payslip.zus.chorobowe_pracownik },
    { label: `Ubezpieczenie zdrowotne (9%)`, value: -payslip.zus.zdrowotne },
    { label: '', value: null, divider: true },
    { label: 'Podstawa opodatkowania', value: payslip.taxBase },
    { label: 'Zaliczka PIT (12%)', value: -payslip.pitAdvance - payslip.taxRelief },
    { label: `Ulga podatkowa`, value: payslip.taxRelief },
    { label: 'Zaliczka PIT do przekazania do US', value: -payslip.pitAdvance },
    { label: '', value: null, divider: true },
    { label: 'Wynagrodzenie netto (do wypłaty)', value: payslip.netSalary, bold: true, highlight: true },
  ];

  const employerRows = [
    { label: `Emerytalne pracodawca (${(ZUS_RATES.emerytalne_pracodawca * 100).toFixed(2)}%)`, value: payslip.zus.emerytalne_pracodawca },
    { label: `Rentowe pracodawca (${(ZUS_RATES.rentowe_pracodawca * 100).toFixed(2)}%)`, value: payslip.zus.rentowe_pracodawca },
    { label: `Wypadkowe (${(ZUS_RATES.wypadkowe * 100).toFixed(2)}%)`, value: payslip.zus.wypadkowe },
    { label: `Fundusz Pracy (${(ZUS_RATES.fp * 100).toFixed(2)}%)`, value: payslip.zus.fp },
    { label: `FGŚP (${(ZUS_RATES.fgsp * 100).toFixed(2)}%)`, value: payslip.zus.fgsp },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('payroll.payslip')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{monthName} {year} — {emp.firstName} {emp.lastName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Printer className="w-4 h-4" />
              Drukuj
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Employee info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pracownik</p>
              <p className="font-semibold text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{emp.position}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{emp.department}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Szczegóły</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">PESEL: {emp.pesel}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">US: {emp.taxOffice}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Konto: {emp.bankAccount.slice(-8).padStart(26, '*')}</p>
            </div>
          </div>

          {/* Payslip rows */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Rozliczenie wynagrodzenia
            </div>
            {rows.map((row, i) => {
              if (row.divider) return <div key={i} className="h-px bg-gray-100 dark:bg-gray-700" />;
              if (!row.label) return null;
              return (
                <div
                  key={i}
                  className={clsx(
                    'flex items-center justify-between px-4 py-2 text-sm',
                    row.highlight ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'
                  )}
                >
                  <span className={clsx('text-gray-600 dark:text-gray-400', row.bold && 'font-semibold text-gray-900 dark:text-white')}>
                    {row.label}
                  </span>
                  <span className={clsx(
                    'font-medium tabular-nums',
                    row.highlight ? 'text-emerald-700 dark:text-emerald-400 font-bold text-base' :
                    row.value && row.value < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                  )}>
                    {row.value !== null ? formatPLN(row.value) : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Employer cost */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Koszty pracodawcy (dodatkowe)
            </div>
            {employerRows.map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/20">
                <span className="text-gray-600 dark:text-gray-400">{row.label}</span>
                <span className="font-medium text-gray-900 dark:text-white tabular-nums">{formatPLN(row.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5 text-sm bg-blue-50 dark:bg-blue-900/20 border-t border-gray-100 dark:border-gray-700">
              <span className="font-bold text-gray-900 dark:text-white">Łączny koszt pracodawcy</span>
              <span className="font-bold text-blue-700 dark:text-blue-400 text-base tabular-nums">{formatPLN(payslip.totalEmployerCost)}</span>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300">
            Stawki ZUS 2026. Podstawa wymiaru zasiłkowego nie uwzględnia ubezpieczenia wypadkowego. Zaliczka PIT obliczona wg stawki 12% (do 120 000 PLN rocznie) z ulgą podatkową 300 PLN/miesiąc.
          </div>
        </div>
      </div>
    </div>
  );
}

export function PayrollModule() {
  const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState('2026-03');
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const payslips = mockEmployees
    .filter(e => e.active)
    .map(e => calculatePayslip(e, selectedMonth));

  const totalGross = payslips.reduce((s, p) => s + p.grossSalary, 0);
  const totalNet = payslips.reduce((s, p) => s + p.netSalary, 0);
  const totalEmployerCost = payslips.reduce((s, p) => s + p.totalEmployerCost, 0);
  const totalZus = payslips.reduce((s, p) => s + p.zus.emerytalne_pracodawca + p.zus.rentowe_pracodawca + p.zus.wypadkowe + p.zus.fp + p.zus.fgsp, 0);

  const contractColors: Record<string, string> = {
    umowa_o_prace: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    umowa_zlecenie: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    umowa_o_dzielo: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    b2b: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <div className="space-y-5">
      {/* Month selector + summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('payroll.monthSelector')}:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <FileText className="w-4 h-4" />
          {t('payroll.generatePayslips')}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suma brutto</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatPLN(totalGross)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Suma netto (wypłaty)</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatPLN(totalNet)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ZUS pracodawca</p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{formatPLN(totalZus)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Koszt pracodawcy łącznie</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatPLN(totalEmployerCost)}</p>
        </div>
      </div>

      {/* ZUS rates info box */}
      <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('payroll.zusRates2026')}</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Pracownik:</p>
            <p className="text-gray-700 dark:text-gray-300">Emerytalne: 9,76%</p>
            <p className="text-gray-700 dark:text-gray-300">Rentowe: 1,50%</p>
            <p className="text-gray-700 dark:text-gray-300">Chorobowe: 2,45%</p>
            <p className="text-gray-700 dark:text-gray-300">Zdrowotne: 9,00%</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Pracodawca:</p>
            <p className="text-gray-700 dark:text-gray-300">Emerytalne: 9,76%</p>
            <p className="text-gray-700 dark:text-gray-300">Rentowe: 6,50%</p>
            <p className="text-gray-700 dark:text-gray-300">Wypadkowe: 1,67%</p>
            <p className="text-gray-700 dark:text-gray-300">FP: 2,45% | FGŚP: 0,10%</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">PIT 2026:</p>
            <p className="text-gray-700 dark:text-gray-300">12% do 120 000 PLN/rok</p>
            <p className="text-gray-700 dark:text-gray-300">32% powyżej 120 000 PLN</p>
            <p className="text-gray-700 dark:text-gray-300">Ulga: 300 PLN/mies.</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">Terminy:</p>
            <p className="text-gray-700 dark:text-gray-300">ZUS: do 17. dnia mies.</p>
            <p className="text-gray-700 dark:text-gray-300">PIT-4: do 20. dnia mies.</p>
          </div>
        </div>
      </div>

      {/* Employee table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {t('payroll.employees')} — {MONTHS_PL[parseInt(selectedMonth.split('-')[1]) - 1]} {selectedMonth.split('-')[0]}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">{t('payroll.employeeName')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('payroll.position')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('payroll.contractType')}</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('payroll.grossSalary')}</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('payroll.zusPracownik')}</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">ZUS+PIT</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('payroll.netSalary')}</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('payroll.totalCost')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {payslips.map(payslip => {
                const emp = payslip.employee;
                const zusPracownik = payslip.zus.emerytalne_pracownik + payslip.zus.rentowe_pracownik + payslip.zus.chorobowe_pracownik;
                const totalDeductions = zusPracownik + payslip.zus.zdrowotne + payslip.pitAdvance;
                return (
                  <tr key={payslip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-bold flex-shrink-0">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{emp.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-[150px]">
                      <span className="truncate block">{emp.position}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', contractColors[emp.contractType])}>
                        {t(`payroll.contract_${emp.contractType}`)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                      {formatPLN(payslip.grossSalary)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-red-600 dark:text-red-400 tabular-nums">
                      -{formatPLN(zusPracownik)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-red-600 dark:text-red-400 tabular-nums">
                      -{formatPLN(totalDeductions)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatPLN(payslip.netSalary)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatPLN(payslip.totalEmployerCost)}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setSelectedPayslip(payslip)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {t('payroll.viewPayslip')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                <td colSpan={3} className="px-5 py-3 text-sm font-bold text-gray-900 dark:text-white">Razem</td>
                <td className="px-3 py-3 text-right text-sm font-bold text-gray-900 dark:text-white tabular-nums">{formatPLN(totalGross)}</td>
                <td colSpan={2} className="px-3 py-3" />
                <td className="px-3 py-3 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatPLN(totalNet)}</td>
                <td className="px-3 py-3 text-right text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">{formatPLN(totalEmployerCost)}</td>
                <td className="px-5 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {selectedPayslip && (
        <PayslipModal payslip={selectedPayslip} onClose={() => setSelectedPayslip(null)} />
      )}
    </div>
  );
}
