import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Building2, Calendar, Plus, X, Copy, Printer, Pencil, Trash2 } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer { id: string; company_name: string; company_address?: string; }
interface Agreement { id: string; agreement_no: string; customer_id: string; }
interface InvoiceItem {
  description: string; unit: string; qty: number;
  rate: number; vat_pct: number; vat_amt: number; total: number;
}
interface Invoice {
  id: string; user_id: string; customer_id: string;
  customer?: { company_name: string; company_address?: string };
  agreement_id: string | null; invoice_no: string;
  invoice_date: string; due_date: string; notes: string;
  subtotal: number; total_vat: number; grand_total: number;
  items: InvoiceItem[]; created_at: string;
}
interface RowDraft {
  id: string; description: string; unit: string;
  qty: string; rate: string; vat_pct: string;
}
interface CompanySettings {
  company_name: string;
  address: string;
  phone: string;
  email: string;
  bank_name: string;
  bank_address: string;
  account_name: string;
  account_no: string;
  iban: string;
  swift: string;
  footer_image_url: string;
  invoice_notes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOGO_URL    = 'https://aeqrkeoxeluiypodczmv.supabase.co/storage/v1/object/public/company-assets/Alpha_Arrow_Logo.png';
const DEFAULT_VAT = '10';

const DEFAULT_SETTINGS: CompanySettings = {
  company_name:     'Alpha Line Cargo W.L.L',
  address:          'Block No.115, Hidd, Kingdom of Bahrain',
  phone:            '+973 3689 9594',
  email:            'info@alphalinecargo.com',
  bank_name:        'Ahli United Bank',
  bank_address:     'Manama, Kingdom of Bahrain',
  account_name:     'Alpha Line Cargo W.L.L',
  account_no:       '0016-495039-001',
  iban:             'BH42AUBB00016495039001',
  swift:            'AUBBBHBM',
  footer_image_url: '',
  invoice_notes:    'Payment due within 30 days of invoice date.',
};

const emptyForm = {
  customer_id: '', agreement_id: '',
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: '', notes: '',
};

const newDraftRow = (): RowDraft => ({
  id: crypto.randomUUID(), description: '', unit: '',
  qty: '1', rate: '', vat_pct: DEFAULT_VAT,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => Number(n).toFixed(3);

function calcItem(r: RowDraft): InvoiceItem {
  const qty    = parseFloat(r.qty)     || 0;
  const rate   = parseFloat(r.rate)    || 0;
  const vatPct = parseFloat(r.vat_pct) || 0;
  const base   = rate * qty;
  const vatAmt = base * (vatPct / 100);
  return { description: r.description, unit: r.unit, qty, rate, vat_pct: vatPct, vat_amt: vatAmt, total: base + vatAmt };
}

function formatDate(d: string): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Amount in Words ──────────────────────────────────────────────────────────

const ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
  'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function three(n: number): string {
  if (n === 0) return '';
  if (n < 20)  return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + three(n % 100) : '');
}

function amountInWords(amount: number): string {
  if (!amount || amount <= 0) return '';
  const rounded = Math.round(amount * 1000) / 1000;
  const int     = Math.floor(rounded);
  const dec     = Math.round((rounded - int) * 1000);
  let words = int === 0 ? 'Zero'
    : int >= 1_000_000 ? three(Math.floor(int / 1_000_000)) + ' Million' + (int % 1_000_000 ? ' ' + three(int % 1_000_000) : '')
    : int >= 1000      ? three(Math.floor(int / 1000)) + ' Thousand' + (int % 1000 ? ' ' + three(int % 1000) : '')
    : three(int);
  words += ' Bahraini Dinar';
  if (dec > 0) words += ' and ' + three(dec) + ' Fils';
  return words + ' Only';
}

// ─── Print HTML ───────────────────────────────────────────────────────────────

function buildInvoiceHTML(p: {
  invoice_no: string; invoice_date: string; due_date: string;
  customerName: string; customerAddress: string; agreementNo: string;
  items: InvoiceItem[]; subtotal: number; total_vat: number;
  grand_total: number; notes: string;
}, s: CompanySettings): string {

  const itemRows = p.items.map((r) => {
    const qty      = parseFloat(String(r.qty))   || 0;
    const rate     = parseFloat(String(r.rate))  || 0;
    const total    = parseFloat(String(r.total)) || 0;
    const qtyDisp  = qty % 1 === 0 ? String(qty) : qty.toFixed(3);
    return [
      '<tr>',
      `  <td style="padding:9px 10px 9px 0;border-bottom:1px solid #ebebeb;font-size:9.5pt;color:#1a1a1a;vertical-align:top"><span style="font-weight:500">${r.description}</span><br/><span style="font-size:8pt;color:#bbb">+VAT ${r.vat_pct}%</span></td>`,
      `  <td style="padding:9px 8px;border-bottom:1px solid #ebebeb;font-size:9pt;text-align:center;color:#555;vertical-align:top">${r.unit || ''}</td>`,
      `  <td style="padding:9px 8px;border-bottom:1px solid #ebebeb;font-size:9pt;text-align:center;color:#555;vertical-align:top">${qtyDisp}</td>`,
      `  <td style="padding:9px 8px;border-bottom:1px solid #ebebeb;font-size:9pt;text-align:right;color:#555;vertical-align:top">BD ${fmt(rate)}</td>`,
      `  <td style="padding:9px 0 9px 8px;border-bottom:1px solid #ebebeb;font-size:9.5pt;text-align:right;color:#1a1a1a;font-weight:600;vertical-align:top">BD ${fmt(total)}</td>`,
      '</tr>',
    ].join('');
  }).join('\n');

  const dueDateRow   = p.due_date   ? `<tr><td class="ml">Due Date</td><td class="mv">${formatDate(p.due_date)}</td></tr>` : '';
  const agreementRow = p.agreementNo ? `<tr><td class="ml">Reference</td><td class="mv">${p.agreementNo}</td></tr>` : '';
  const addrHTML     = p.customerAddress ? p.customerAddress.replace(/\n/g, '<br/>') : '';

  const notesHTML = p.notes ? `
    <div style="margin-top:20px">
      <div style="font-size:8pt;font-weight:700;color:#1a1a1a;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.5px">Notes</div>
      <div style="font-size:9pt;color:#444;line-height:1.7;white-space:pre-line">${p.notes}</div>
    </div>` : '';

  const bankHTML = `
    <div style="margin-top:22px;padding:14px 16px;background:#f8f8f8;border-radius:6px;border:1px solid #e8e8e8">
      <div style="font-size:8pt;font-weight:700;color:#1a1a1a;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Bank Details</div>
      <table style="border-collapse:collapse;width:100%;font-size:8.5pt">
        <tr>
          <td style="padding:3px 20px 3px 0;color:#888;white-space:nowrap;vertical-align:top">Bank Name</td>
          <td style="padding:3px 0;color:#1a1a1a;font-weight:500">${s.bank_name}</td>
          <td style="padding:3px 20px 3px 40px;color:#888;white-space:nowrap;vertical-align:top">Account Name</td>
          <td style="padding:3px 0;color:#1a1a1a;font-weight:500">${s.account_name}</td>
        </tr>
        <tr>
          <td style="padding:3px 20px 3px 0;color:#888;white-space:nowrap;vertical-align:top">Bank Address</td>
          <td style="padding:3px 0;color:#1a1a1a;font-weight:500">${s.bank_address}</td>
          <td style="padding:3px 20px 3px 40px;color:#888;white-space:nowrap;vertical-align:top">Account No</td>
          <td style="padding:3px 0;color:#1a1a1a;font-weight:500">${s.account_no}</td>
        </tr>
        <tr>
          <td style="padding:3px 20px 3px 0;color:#888;white-space:nowrap;vertical-align:top">SWIFT / BIC</td>
          <td style="padding:3px 0;color:#1a1a1a;font-weight:500">${s.swift}</td>
          <td style="padding:3px 20px 3px 40px;color:#888;white-space:nowrap;vertical-align:top">IBAN</td>
          <td style="padding:3px 0;color:#1a1a1a;font-weight:500">${s.iban}</td>
        </tr>
      </table>
    </div>`;

  const footerImageHTML = s.footer_image_url
  ? `<div style="position:fixed;bottom:0;left:-22mm;right:-22mm;width:calc(100% + 44mm);margin:0;padding:0;line-height:0">
    <img src="${s.footer_image_url}" style="width:100%;height:auto;display:block;margin:0;padding:0" alt="Footer"/>
   </div>`
    : `<div style="margin-top:30px;padding-top:12px;border-top:1px solid #eee;display:flex;justify-content:space-between;font-size:7.5pt;color:#bbb">
        <span>${s.company_name} &nbsp;|&nbsp; ${s.address}</span>
        <span>${s.phone} &nbsp;|&nbsp; ${s.email}</span>
       </div>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Invoice ${p.invoice_no}</title>
<style>
  @page { size: A4; margin: 16mm 22mm 16mm 22mm; }
  html { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; color: #1a1a1a; background: #fff; padding-bottom: 97px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
  .header-left img { height:60px; width:60px; object-fit:contain; display:block; margin-bottom:10px; background:#f5f5f5; border-radius:6px; padding:4px; }
  .invoice-title { font-size:28pt; font-weight:800; letter-spacing:1px; color:#1a1a1a; line-height:1; }
  .header-right { text-align:right; }
  .header-right .co-name { font-size:11pt; font-weight:600; color:#1a1a1a; margin-bottom:5px; }
  .header-right .co-detail { font-size:8.5pt; color:#666; line-height:1.9; }
  .meta-section { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; gap:20px; }
  .billed-to { flex:1; }
  .meta-label { font-size:8pt; font-weight:700; color:#1a1a1a; margin-bottom:5px; }
  .billed-to .customer-name { font-size:10pt; color:#333; line-height:1.7; }
  .meta-center { flex:1; }
  .meta-center table { border-collapse:collapse; }
  .meta-center td { padding:3px 0; font-size:9pt; vertical-align:top; }
  .meta-center .ml { color:#1a1a1a; font-weight:700; padding-right:14px; white-space:nowrap; }
  .meta-center .mv { color:#444; }
  .meta-right { text-align:right; min-width:130px; }
  .meta-right .amount-label { font-size:8.5pt; font-weight:600; color:#555; margin-bottom:3px; }
  .meta-right .amount-value { font-size:14pt; font-weight:800; color:#1a1a1a; }
  .divider-thick { border:none; border-top:2px solid #1a1a1a; margin:14px 0 0; }
  table.grid { width:100%; border-collapse:collapse; }
  table.grid thead tr { border-bottom:1px solid #1a1a1a; }
  table.grid thead th { padding:8px 0; font-size:8.5pt; font-weight:600; color:#555; text-align:left; }
  table.grid thead th.r { text-align:right; }
  table.grid thead th.c { text-align:center; }
  table.grid tbody tr:nth-child(even) { background:#fafafa; }
  .totals-section { display:flex; justify-content:flex-end; margin-top:18px; }
  .totals-table { width:260px; border-collapse:collapse; }
  .totals-table td { padding:5px 0; font-size:9.5pt; color:#444; }
  .totals-table .tv { text-align:right; }
  .totals-table .divrow td { border-top:1px solid #ddd; padding-top:7px; }
  .totals-table .grandrow td { border-top:2px solid #1a1a1a; border-bottom:2px solid #1a1a1a; padding:6px 0; font-size:11pt; font-weight:700; color:#1a1a1a; }
  .words-row { margin-top:20px; }
  .words-row .wl { font-size:8pt; font-weight:700; color:#1a1a1a; margin-bottom:4px; }
  .words-row .wv { font-size:9pt; color:#555; font-style:italic; }
  .page-footer { margin-top:16px; text-align:center; font-size:8pt; color:#ccc; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <img src="${LOGO_URL}" alt="Logo" />
    <div class="invoice-title">INVOICE</div>
  </div>
  <div class="header-right">
    <div class="co-name">${s.company_name}</div>
    <div class="co-detail">${s.address}<br/>${s.phone}<br/>${s.email}</div>
  </div>
</div>

<div class="meta-section">
  <div class="billed-to">
    <div class="meta-label">Billed To</div>
    <div class="customer-name"><strong>${p.customerName}</strong><br/>${addrHTML}</div>
  </div>
  <div class="meta-center">
    <table>
      <tr><td class="ml">Date Issued</td><td class="mv">${formatDate(p.invoice_date)}</td></tr>
      <tr><td class="ml">Invoice Number</td><td class="mv">${p.invoice_no || 'Draft'}</td></tr>
      ${dueDateRow}
      ${agreementRow}
    </table>
  </div>
  <div class="meta-right">
    <div class="amount-label">Amount Due</div>
    <div class="amount-value">BD ${fmt(p.grand_total)}</div>
  </div>
</div>

<hr class="divider-thick"/>

<table class="grid">
  <thead>
    <tr>
      <th>Description</th>
      <th class="c" style="width:70px">Unit</th>
      <th class="c" style="width:55px">Qty</th>
      <th class="r" style="width:95px">Rate</th>
      <th class="r" style="width:105px">Amount</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
</table>

<div class="totals-section">
  <table class="totals-table">
    <tr><td>Subtotal</td><td class="tv">BD ${fmt(p.subtotal)}</td></tr>
    <tr class="divrow"><td>VAT ${DEFAULT_VAT}%</td><td class="tv">+BD ${fmt(p.total_vat)}</td></tr>
    <tr class="grandrow"><td>Total BD</td><td class="tv">BD ${fmt(p.grand_total)}</td></tr>
  </table>
</div>

<div class="words-row">
  <div class="wl">Amount in Words</div>
  <div class="wv">${amountInWords(p.grand_total)}</div>
</div>

${notesHTML}
${bankHTML}
${footerImageHTML}

<div class="page-footer">Page 1 of 1</div>

</body>
</html>`;
}

async function copyInvoice(inv: Invoice, customerName: string, customerAddress: string, agreementNo: string, settings: CompanySettings) {
  const html = buildInvoiceHTML({ ...inv, notes: inv.notes || '', customerName, customerAddress, agreementNo }, settings);
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html':  new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([`INVOICE ${inv.invoice_no}\n${settings.company_name}\nBilled To: ${customerName}\nTotal BD: ${fmt(inv.grand_total)}\n${amountInWords(inv.grand_total)}`], { type: 'text/plain' }),
      }),
    ]);
    alert('Invoice copied to clipboard.');
  } catch { alert('Copy failed — try Print instead.'); }
}

function printInvoice(inv: Invoice, customerName: string, customerAddress: string, agreementNo: string, settings: CompanySettings) {
  const html = buildInvoiceHTML({ ...inv, notes: inv.notes || '', customerName, customerAddress, agreementNo }, settings);
  const win = window.open('', '_blank', 'width=900,height=700,menubar=no,toolbar=no,location=no,status=no');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); win.onafterprint = () => win.close(); };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StorageInvoiceTab() {
  const { user } = useAuth();
  const [settings,   setSettings]   = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [customers,  setCustomers]  = useState<Customer[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [invoices,   setInvoices]   = useState<Invoice[]>([]);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<Invoice | null>(null);
  const [formData,   setFormData]   = useState(emptyForm);
  const [draftRows,  setDraftRows]  = useState<RowDraft[]>([newDraftRow()]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => { loadSettings(); loadCustomers(); loadInvoices(); }, []);

  useEffect(() => {
    if (formData.customer_id) {
      supabase.from('storage_agreements')
        .select('id, agreement_no, customer_id')
        .eq('customer_id', formData.customer_id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setAgreements(data || []));
    } else { setAgreements([]); }
  }, [formData.customer_id]);

  async function loadSettings() {
    const { data } = await supabase.from('company_settings').select('*').limit(1).single();
    if (data) setSettings(data as CompanySettings);
  }

  async function loadCustomers() {
    const { data } = await supabase.from('customers')
      .select('id, company_name, company_address').order('company_name');
    if (data) setCustomers(data);
  }

  async function loadInvoices() {
    const { data } = await supabase.from('storage_invoices')
      .select('*, customer:customers(company_name, company_address)')
      .order('created_at', { ascending: false });
    if (data) setInvoices(data as any);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function updateDraftRow(id: string, field: keyof RowDraft, value: string) {
    setDraftRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  function openNew() {
    setEditing(null);
    setFormData({ ...emptyForm, notes: settings.invoice_notes });
    setDraftRows([newDraftRow()]); setError(''); setShowForm(true);
  }

  function openEdit(inv: Invoice) {
    setEditing(inv);
    setFormData({
      customer_id: inv.customer_id, agreement_id: inv.agreement_id || '',
      invoice_date: inv.invoice_date || '', due_date: inv.due_date || '',
      notes: inv.notes || '',
    });
    setDraftRows((inv.items || []).map(item => ({
      id: crypto.randomUUID(), description: item.description, unit: item.unit,
      qty: String(item.qty), rate: String(item.rate), vat_pct: String(item.vat_pct),
    })));
    setError(''); setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.customer_id)  { setError('Please select a customer.'); return; }
    if (!formData.invoice_date) { setError('Invoice date is required.'); return; }
    setLoading(true); setError('');
    try {
      const items      = draftRows.map(calcItem);
      const subtotal   = items.reduce((s, r) => s + r.rate * r.qty, 0);
      const totalVat   = items.reduce((s, r) => s + r.vat_amt,      0);
      const grandTotal = items.reduce((s, r) => s + r.total,        0);
      const payload = {
        customer_id: formData.customer_id, agreement_id: formData.agreement_id || null,
        invoice_date: formData.invoice_date || null, due_date: formData.due_date || null,
        notes: formData.notes || null, subtotal, total_vat: totalVat, grand_total: grandTotal, items,
      };
      if (editing) {
        const { error: err } = await supabase.from('storage_invoices')
          .update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('storage_invoices')
          .insert({ ...payload, user_id: user?.id });
        if (err) throw err;
      }
      setShowForm(false); setEditing(null);
      setFormData(emptyForm); setDraftRows([newDraftRow()]);
      loadInvoices();
    } catch (err: any) { setError(err.message); }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this invoice?')) return;
    await supabase.from('storage_invoices').delete().eq('id', id);
    loadInvoices();
  }

  const liveItems    = draftRows.map(calcItem);
  const liveSubtotal = liveItems.reduce((s, r) => s + r.rate * r.qty, 0);
  const liveTotalVat = liveItems.reduce((s, r) => s + r.vat_amt,      0);
  const liveGrand    = liveItems.reduce((s, r) => s + r.total,        0);

  const inp  = 'w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all outline-none';
  const lbl  = 'block text-xs font-medium text-slate-700 mb-1';
  const cell = (extra = '') => `w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-300 ${extra}`;

  return (
    <div className="space-y-3">

      {/* ── Form ── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-3 border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              {editing ? 'Edit Invoice' : 'New Invoice'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-3">{error}</div>}

          <div className="space-y-3">

            {/* Customer & Dates */}
            <div className="border-l-2 border-blue-500 pl-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Customer & Invoice Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Customer <span className="text-red-500">*</span></label>
                  <select name="customer_id" value={formData.customer_id} onChange={handleChange} className={inp} required>
                    <option value="">-- Select customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Linked Agreement (optional)</label>
                  <select name="agreement_id" value={formData.agreement_id} onChange={handleChange} className={inp}>
                    <option value="">-- None --</option>
                    {agreements.map(a => <option key={a.id} value={a.id}>{a.agreement_no}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Invoice Date <span className="text-red-500">*</span></label>
                  <input type="date" name="invoice_date" value={formData.invoice_date} onChange={handleChange} className={inp} required />
                </div>
                <div>
                  <label className={lbl}>Due Date</label>
                  <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} className={inp} />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="border-l-2 border-emerald-500 pl-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Line Items
              </h3>
              <div className="overflow-x-auto rounded border border-slate-100">
                <table className="w-full border-collapse text-sm" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '32px' }} />
                    <col />
                    <col style={{ width: '70px' }} />
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '95px' }} />
                    <col style={{ width: '65px' }} />
                    <col style={{ width: '95px' }} />
                    <col style={{ width: '28px' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-2 px-1 text-center text-xs font-semibold text-slate-400">#</th>
                      <th className="py-2 px-2 text-left   text-xs font-semibold text-slate-400">Description</th>
                      <th className="py-2 px-1 text-center text-xs font-semibold text-slate-400">Unit</th>
                      <th className="py-2 px-1 text-center text-xs font-semibold text-slate-400">Qty</th>
                      <th className="py-2 px-1 text-right  text-xs font-semibold text-slate-400">Rate (BD)</th>
                      <th className="py-2 px-1 text-right  text-xs font-semibold text-slate-400">VAT %</th>
                      <th className="py-2 px-1 text-right  text-xs font-semibold text-slate-400">Total (BD)</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {draftRows.map((row, idx) => {
                      const computed = calcItem(row);
                      return (
                        <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                          <td className="py-2 px-1 text-center text-xs text-slate-300 select-none">{idx + 1}</td>
                          <td className="py-1.5 px-2">
                            <input className={cell()} placeholder="Description"
                              value={row.description} onChange={e => updateDraftRow(row.id, 'description', e.target.value)} />
                          </td>
                          <td className="py-1.5 px-1">
                            <input className={cell('text-center')} placeholder="CBM"
                              value={row.unit} onChange={e => updateDraftRow(row.id, 'unit', e.target.value)} />
                          </td>
                          <td className="py-1.5 px-1">
                            <input className={cell('text-center')} placeholder="1" inputMode="decimal"
                              value={row.qty} onChange={e => updateDraftRow(row.id, 'qty', e.target.value)} />
                          </td>
                          <td className="py-1.5 px-1">
                            <input className={cell('text-right')} placeholder="0.000" inputMode="decimal"
                              value={row.rate} onChange={e => updateDraftRow(row.id, 'rate', e.target.value)} />
                          </td>
                          <td className="py-1.5 px-1">
                            <input className={cell('text-right')} placeholder="10" inputMode="decimal"
                              value={row.vat_pct} onChange={e => updateDraftRow(row.id, 'vat_pct', e.target.value)} />
                          </td>
                          <td className="py-1.5 px-1 text-right tabular-nums text-slate-700 font-medium">
                            {fmt(computed.total)}
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            {draftRows.length > 1 && (
                              <button type="button"
                                onClick={() => setDraftRows(prev => prev.filter(r => r.id !== row.id))}
                                className="text-slate-200 hover:text-red-400 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => setDraftRows(prev => [...prev, newDraftRow()])}
                className="mt-2 flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 transition-colors">
                <Plus size={13} /> Add Line
              </button>
            </div>

            {/* Live Totals */}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-1">
              <div className="flex-1 bg-slate-50 rounded px-3 py-2 border border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Amount in Words</p>
                <p className="text-xs text-slate-600 italic">{liveGrand > 0 ? amountInWords(liveGrand) : '—'}</p>
              </div>
              <div className="min-w-[200px] text-sm">
                <div className="flex justify-between py-0.5 text-slate-500">
                  <span>Subtotal</span><span className="tabular-nums">{fmt(liveSubtotal)}</span>
                </div>
                <div className="flex justify-between py-0.5 text-slate-500">
                  <span>VAT ({DEFAULT_VAT}%)</span><span className="tabular-nums">{fmt(liveTotalVat)}</span>
                </div>
                <div className="flex justify-between py-1 border-t-2 border-slate-800 font-bold text-slate-800 text-base mt-1">
                  <span>Total BD</span><span className="tabular-nums">{fmt(liveGrand)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-l-2 border-amber-400 pl-2">
              <label className={lbl}>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={4}
                className={`${inp} resize-y`}
                placeholder="Payment terms, special instructions, remarks..." />
            </div>

            {/* Bank Details preview */}
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Bank Details (from Settings)</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                <div><span className="text-slate-400">Bank:</span> {settings.bank_name}</div>
                <div><span className="text-slate-400">Account Name:</span> {settings.account_name}</div>
                <div><span className="text-slate-400">SWIFT:</span> {settings.swift}</div>
                <div><span className="text-slate-400">Account No:</span> {settings.account_no}</div>
                <div className="col-span-2"><span className="text-slate-400">IBAN:</span> {settings.iban}</div>
              </div>
            </div>

          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded transition-all shadow disabled:opacity-50">
              {loading ? 'Saving...' : editing ? 'Update Invoice' : 'Save Invoice'}
            </button>
          </div>
        </form>
      )}

      {/* ── Invoice List ── */}
      <div className="bg-white rounded-lg shadow border border-teal-100">
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Storage Invoices</h3>
          {!showForm && (
            <button onClick={openNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded shadow hover:from-purple-700 hover:to-indigo-700 transition-all">
              <Plus className="w-3.5 h-3.5" /> New Invoice
            </button>
          )}
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No invoices yet. Create your first one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Invoice #','Customer','Date','Due Date','Total BD',''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map(inv => {
                  const cust = inv.customer as any;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-slate-600">{inv.invoice_no || '—'}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{cust?.company_name || '—'}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{inv.invoice_date || '—'}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{inv.due_date || '—'}</td>
                      <td className="px-3 py-2 text-slate-700 font-semibold tabular-nums text-xs">{fmt(inv.grand_total)}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => copyInvoice(inv, cust?.company_name || '', cust?.company_address || '', '', settings)}
                            title="Copy" className="p-1 hover:bg-indigo-50 rounded text-indigo-500 transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => printInvoice(inv, cust?.company_name || '', cust?.company_address || '', '', settings)}
                            title="Print" className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openEdit(inv)}
                            title="Edit" className="p-1 hover:bg-blue-50 rounded text-blue-500 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(inv.id)}
                            title="Delete" className="p-1 hover:bg-red-50 rounded text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}