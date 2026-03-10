import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3, FileText, Download, Scale, TrendingUp, Activity, Receipt, ScrollText, ListCollapse,
  ChevronRight, Info, Loader2
} from 'lucide-react';
import type { ReportType } from '../../../types';
import clsx from 'clsx';

interface ReportDef {
  id: ReportType;
  nameKey: string;
  descKey: string;
  legalKey: string;
  icon: React.ElementType;
}

const REPORTS: ReportDef[] = [
  { id: 'bilans', nameKey: 'reports.bilans', descKey: 'reports.bilans_desc', legalKey: 'reports.bilans_legal', icon: Scale },
  { id: 'rachunek_wynikow', nameKey: 'reports.rachunek_wynikow', descKey: 'reports.rachunek_wynikow_desc', legalKey: 'reports.rachunek_wynikow_legal', icon: TrendingUp },
  { id: 'przeplywy_pieniezne', nameKey: 'reports.przeplywy_pieniezne', descKey: 'reports.przeplywy_pieniezne_desc', legalKey: 'reports.przeplywy_pieniezne_legal', icon: Activity },
  { id: 'deklaracja_vat', nameKey: 'reports.deklaracja_vat', descKey: 'reports.deklaracja_vat_desc', legalKey: 'reports.deklaracja_vat_legal', icon: Receipt },
  { id: 'sprawozdanie_roczne', nameKey: 'reports.sprawozdanie_roczne', descKey: 'reports.sprawozdanie_roczne_desc', legalKey: 'reports.sprawozdanie_roczne_legal', icon: ScrollText },
  { id: 'zestawienie_kosztow', nameKey: 'reports.zestawienie_kosztow', descKey: 'reports.zestawienie_kosztow_desc', legalKey: 'reports.zestawienie_kosztow_legal', icon: ListCollapse },
];

// Mock report preview content
const MOCK_PREVIEWS: Record<ReportType, React.ReactNode> = {
  bilans: (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-700/50"><th className="text-left px-4 py-2 font-semibold text-gray-700 dark:text-gray-300" colSpan={2}>AKTYWA</th><th className="text-right px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">PLN</th></tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
        {[
          ['A', 'Aktywa trwałe', '18 450,00'],
          ['A.I', 'Wartości niematerialne i prawne', '2 100,00'],
          ['A.II', 'Rzeczowe aktywa trwałe', '14 850,00'],
          ['A.III', 'Długoterminowe rozliczenia', '1 500,00'],
          ['B', 'Aktywa obrotowe', '89 234,56'],
          ['B.I', 'Zapasy', '0,00'],
          ['B.II', 'Należności krótkoterminowe', '22 972,50'],
          ['B.III', 'Inwestycje krótkoterminowe', '0,00'],
          ['B.IV', 'Środki pieniężne', '66 262,06'],
          ['', 'SUMA AKTYWÓW', '107 684,56'],
        ].map(([code, name, val], i) => (
          <tr key={i} className={clsx(!code ? 'bg-blue-50 dark:bg-blue-900/20 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20')}>
            <td className="px-4 py-2 text-gray-500 dark:text-gray-400 w-12 font-mono text-xs">{code}</td>
            <td className="px-2 py-2 text-gray-900 dark:text-white">{name}</td>
            <td className="px-4 py-2 text-right text-gray-900 dark:text-white tabular-nums">{val}</td>
          </tr>
        ))}
      </tbody>
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-700/50"><th className="text-left px-4 py-2 font-semibold text-gray-700 dark:text-gray-300" colSpan={2}>PASYWA</th><th className="text-right px-4 py-2 font-semibold text-gray-700 dark:text-gray-300">PLN</th></tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
        {[
          ['A', 'Fundusz własny', '83 234,56'],
          ['A.I', 'Fundusz statutowy', '50 000,00'],
          ['A.II', 'Wynik finansowy', '33 234,56'],
          ['B', 'Zobowiązania i rezerwy', '24 450,00'],
          ['B.I', 'Rezerwy na zobowiązania', '0,00'],
          ['B.II', 'Zobowiązania długoterminowe', '0,00'],
          ['B.III', 'Zobowiązania krótkoterminowe', '24 450,00'],
          ['', 'SUMA PASYWÓW', '107 684,56'],
        ].map(([code, name, val], i) => (
          <tr key={i} className={clsx(!code ? 'bg-blue-50 dark:bg-blue-900/20 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20')}>
            <td className="px-4 py-2 text-gray-500 dark:text-gray-400 w-12 font-mono text-xs">{code}</td>
            <td className="px-2 py-2 text-gray-900 dark:text-white">{name}</td>
            <td className="px-4 py-2 text-right text-gray-900 dark:text-white tabular-nums">{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  rachunek_wynikow: (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
        {[
          { code: 'A', name: 'Przychody z działalności statutowej', val: '285 200,00', income: true },
          { code: 'A.1', name: 'Składki brutto', val: '12 400,00', income: true },
          { code: 'A.2', name: 'Inne przychody', val: '272 800,00', income: true },
          { code: 'B', name: 'Koszty realizacji zadań statutowych', val: '198 450,00', income: false },
          { code: 'C', name: 'Wynik działalności statutowej (A-B)', val: '86 750,00', bold: true },
          { code: 'D', name: 'Przychody finansowe', val: '1 234,56', income: true },
          { code: 'E', name: 'Koszty finansowe', val: '0,00', income: false },
          { code: 'F', name: 'Koszty administracyjne', val: '54 750,00', income: false },
          { code: 'G', name: 'Wynik finansowy netto', val: '33 234,56', bold: true, highlight: true },
        ].map((row, i) => (
          <tr key={i} className={clsx(row.highlight ? 'bg-emerald-50 dark:bg-emerald-900/20' : row.bold ? 'bg-gray-50 dark:bg-gray-700/50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20')}>
            <td className="px-4 py-2 text-gray-500 dark:text-gray-400 w-12 font-mono text-xs">{row.code}</td>
            <td className="px-2 py-2 text-gray-900 dark:text-white" style={{ fontWeight: row.bold ? 700 : 400 }}>{row.name}</td>
            <td className={clsx('px-4 py-2 text-right tabular-nums font-medium', row.highlight ? 'text-emerald-700 dark:text-emerald-400 font-bold' : row.income ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>{row.income !== undefined ? (row.income ? '+' : '-') : ''}{row.val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  przeplywy_pieniezne: (
    <div className="space-y-3 text-sm p-2">
      {[
        { section: 'A. Przepływy z działalności operacyjnej', rows: [
          ['Wynik finansowy netto', '33 234,56'],
          ['Amortyzacja', '3 200,00'],
          ['Zmiana stanu należności', '-8 500,00'],
          ['Zmiana stanu zobowiązań', '5 340,00'],
          ['Przepływy operacyjne netto', '33 274,56'],
        ]},
        { section: 'B. Przepływy z działalności inwestycyjnej', rows: [
          ['Zakup środków trwałych', '-3 699,00'],
          ['Przepływy inwestycyjne netto', '-3 699,00'],
        ]},
        { section: 'C. Przepływy z działalności finansowej', rows: [
          ['Otrzymane dotacje', '0,00'],
          ['Przepływy finansowe netto', '0,00'],
        ]},
      ].map((section, si) => (
        <div key={si}>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">{section.section}</div>
          {section.rows.map(([name, val], i) => {
            const isTotal = name.includes('netto');
            const isNeg = val.startsWith('-');
            return (
              <div key={i} className={clsx('flex justify-between px-4 py-2', isTotal ? 'font-bold bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20')}>
                <span className="text-gray-700 dark:text-gray-300">{name}</span>
                <span className={clsx('tabular-nums', isNeg ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>{val} PLN</span>
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex justify-between px-4 py-3 bg-blue-600 text-white font-bold rounded-lg">
        <span>Zmiana stanu środków pieniężnych</span>
        <span>29 575,56 PLN</span>
      </div>
    </div>
  ),
  deklaracja_vat: (
    <div className="p-4 space-y-3 text-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded">JPK_V7M</span>
        <span className="text-gray-500 dark:text-gray-400">Deklaracja za luty 2026</span>
      </div>
      {[
        { label: 'K_15 — Dostawa towarów i usług (0%)', val: '17 500,00', type: 'sprzedaz' },
        { label: 'K_17 — Podstawa opodatkowania (8%)', val: '288,89', type: 'sprzedaz' },
        { label: 'K_18 — Podatek należny (8%)', val: '23,11', type: 'podatek' },
        { label: 'K_19 — Podstawa opodatkowania (23%)', val: '302,22', type: 'sprzedaz' },
        { label: 'K_20 — Podatek należny (23%)', val: '69,51', type: 'podatek' },
        { label: 'K_39 — Nabycia (zakupy z VAT do odliczenia)', val: '4 315,54', type: 'zakup' },
        { label: 'K_40 — Podatek naliczony podlegający odliczeniu', val: '761,25', type: 'odlicz' },
        { label: 'P_53 — VAT do zapłaty', val: '0,00', type: 'wynik' },
        { label: 'P_54 — VAT do zwrotu', val: '668,63', type: 'zwrot' },
      ].map((row, i) => (
        <div key={i} className={clsx('flex justify-between items-center p-2.5 rounded-lg', {
          'bg-gray-50 dark:bg-gray-700/50': row.type === 'sprzedaz',
          'bg-red-50 dark:bg-red-900/10': row.type === 'podatek',
          'bg-blue-50 dark:bg-blue-900/10': row.type === 'zakup',
          'bg-emerald-50 dark:bg-emerald-900/10': row.type === 'odlicz' || row.type === 'zwrot',
          'bg-amber-50 dark:bg-amber-900/10 font-bold': row.type === 'wynik',
        })}>
          <span className="text-gray-700 dark:text-gray-300">{row.label}</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">{row.val} PLN</span>
        </div>
      ))}
    </div>
  ),
  sprawozdanie_roczne: (
    <div className="p-4 space-y-4 text-sm">
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase">Dane identyfikacyjne</div>
        {[
          ['Nazwa organizacji', 'Fundacja Pomocna Dłoń'],
          ['KRS', '0000123456'],
          ['NIP', '6761234567'],
          ['REGON', '120123456'],
          ['Siedziba', 'ul. Floriańska 15/3, 31-019 Kraków'],
          ['Rok obrotowy', '01.01.2025 — 31.12.2025'],
        ].map(([label, val], i) => (
          <div key={i} className="flex justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{val}</span>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Obowiązek sprawozdawczy</p>
        <p className="text-xs text-amber-700 dark:text-amber-400">Fundacja jest zobowiązana do sporządzenia i złożenia rocznego sprawozdania finansowego zgodnie z Ustawą o Rachunkowości (art. 45) oraz ustawy o DPPioW (art. 23). Termin: 15 marca roku następnego. Sprawozdanie należy opublikować w KRSF.</p>
      </div>
    </div>
  ),
  zestawienie_kosztow: (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-700/50">
          <th className="text-left px-4 py-2 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs">Kategoria</th>
          <th className="text-right px-3 py-2 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs">Sty</th>
          <th className="text-right px-3 py-2 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs">Lut</th>
          <th className="text-right px-4 py-2 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs">Mar</th>
          <th className="text-right px-4 py-2 font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs">Łącznie</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
        {[
          ['Wynagrodzenia', '41 234', '41 234', '41 234', '123 702'],
          ['ZUS pracodawca', '8 934', '8 934', '8 934', '26 802'],
          ['Biuro', '2 100', '1 890', '2 450', '6 440'],
          ['Podróże', '1 230', '980', '1 560', '3 770'],
          ['Catering', '890', '1 100', '780', '2 770'],
          ['Sprzęt', '0', '0', '3 699', '3 699'],
          ['Usługi', '3 450', '4 120', '3 890', '11 460'],
          ['Inne', '1 200', '800', '950', '2 950'],
        ].map(([cat, ...vals], i) => (
          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
            <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{cat}</td>
            {vals.slice(0, -1).map((v, j) => (
              <td key={j} className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 tabular-nums">{v}</td>
            ))}
            <td className="px-4 py-2 text-right font-bold text-gray-900 dark:text-white tabular-nums">{vals[vals.length - 1]}</td>
          </tr>
        ))}
        <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold border-t border-gray-200 dark:border-gray-700">
          <td className="px-4 py-2 text-gray-900 dark:text-white">RAZEM</td>
          <td className="px-3 py-2 text-right text-blue-700 dark:text-blue-400 tabular-nums">59 038</td>
          <td className="px-3 py-2 text-right text-blue-700 dark:text-blue-400 tabular-nums">59 058</td>
          <td className="px-4 py-2 text-right text-blue-700 dark:text-blue-400 tabular-nums">63 497</td>
          <td className="px-4 py-2 text-right text-blue-700 dark:text-blue-400 text-base tabular-nums">181 593</td>
        </tr>
      </tbody>
    </table>
  ),
};

export function ReportsModule() {
  const { t } = useTranslation();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo, setDateTo] = useState('2026-03-31');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [notice, setNotice] = useState('');

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setGenerating(true);
    setGenerated(false);
    await new Promise(r => setTimeout(r, 1200));
    setGenerating(false);
    setGenerated(true);
    setNotice(t('reports.reportGenerated'));
    setTimeout(() => setNotice(''), 3000);
  };

  const selectedDef = REPORTS.find(r => r.id === selectedReport);

  return (
    <div className="space-y-5">
      {/* Legal note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">{t('reports.ngoNote')}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: report selector + controls */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('reports.selectReport')}</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {REPORTS.map(report => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => { setSelectedReport(report.id); setGenerated(false); }}
                    className={clsx(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      selectedReport === report.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border-l-2 border-transparent'
                    )}
                  >
                    <Icon className={clsx('w-5 h-5 flex-shrink-0', selectedReport === report.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400')} />
                    <div className="min-w-0">
                      <p className={clsx('text-sm font-medium', selectedReport === report.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white')}>
                        {t(report.nameKey)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t(report.descKey)}</p>
                    </div>
                    <ChevronRight className={clsx('w-4 h-4 flex-shrink-0', selectedReport === report.id ? 'text-blue-600' : 'text-gray-300 dark:text-gray-600')} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date range */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('reports.dateRange')}</h3>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('reports.dateFrom')}</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('reports.dateTo')}</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button
              onClick={handleGenerate}
              disabled={!selectedReport || generating}
              className={clsx(
                'w-full py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2',
                selectedReport && !generating
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{t('reports.generatingReport')}</>
              ) : (
                <><BarChart3 className="w-4 h-4" />{t('reports.generate')}</>
              )}
            </button>

            {generated && (
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  Excel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: preview */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full min-h-[500px] flex flex-col overflow-hidden">
            {selectedReport && selectedDef ? (
              <>
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t(selectedDef.nameKey)}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t(selectedDef.descKey)}</p>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {t(selectedDef.legalKey)}
                  </div>
                </div>

                {notice && (
                  <div className="mx-5 mt-4 flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm">
                    ✓ {notice}
                  </div>
                )}

                {generated ? (
                  <div className="flex-1 overflow-auto">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                      Fundacja Pomocna Dłoń | NIP: 6761234567 | Okres: {dateFrom} — {dateTo} | Wygenerowano: {new Date().toLocaleString('pl-PL')}
                    </div>
                    {MOCK_PREVIEWS[selectedReport]}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <BarChart3 className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t(selectedDef.nameKey)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Wybierz zakres dat i kliknij "{t('reports.generate')}"</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <FileText className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('reports.selectReportFirst')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
