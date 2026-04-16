import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileSignature, Building2, Calendar, DollarSign, Pencil, Trash2, Plus, X, Copy, Printer } from 'lucide-react';

interface Customer { id: string; company_name: string; }

interface Agreement {
  id: string;
  agreement_no: string;
  customer_id: string;
  customer?: { company_name: string };
  agreement_type: string;
  commodity: string;
  storage_location: string;
  start_date: string;
  end_date: string;
  storage_rate: string;
  currency: string;
  handling_in_rate: string;
  handling_out_rate: string;
  payment_terms: string;
  billing_cycle: string;
  minimum_charge: string;
  notes: string;
  status: string;
  created_at: string;
}

const emptyForm = {
  customer_id: '',
  agreement_type: 'Warehouse Storage Agreement',
  commodity: '',
  storage_location: '',
  start_date: '',
  end_date: '',
  storage_rate: '',
  currency: 'AED',
  handling_in_rate: '',
  handling_out_rate: '',
  payment_terms: '30 days from invoice date',
  billing_cycle: 'Monthly',
  minimum_charge: '',
  notes: '',
  status: 'Active',
};

function formatDate(d: string): string {
  if (!d) return '________________';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildAgreementHTML(a: Agreement): string {
  const customer  = a.customer?.company_name || '________________________________';
  const location  = a.storage_location       || '________________________________';
  const commodity = a.commodity              || '________________________________';
  const startDate = formatDate(a.start_date);
  const endDate   = a.end_date ? formatDate(a.end_date) : '________________';
  const rate      = a.storage_rate      ? `${a.currency} ${a.storage_rate}` : '________________';
  const hIn       = a.handling_in_rate  ? `${a.currency} ${a.handling_in_rate}`  : '________________';
  const hOut      = a.handling_out_rate ? `${a.currency} ${a.handling_out_rate}` : '________________';
  const minCharge = a.minimum_charge    ? `${a.currency} ${a.minimum_charge}`    : '________________';
  const payTerms  = a.payment_terms     || '30 days from invoice date';
  const billing   = a.billing_cycle     || 'Monthly';
  const agreementNo = a.agreement_no    || '________________';
  const notes     = a.notes             || '';

  const s = 'font-family:Tahoma,sans-serif;font-size:11pt;color:#111;line-height:1.7;';
  const h1 = 'font-family:Tahoma,sans-serif;font-size:14pt;font-weight:bold;text-align:center;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0;';
  const h2 = 'font-family:Tahoma,sans-serif;font-size:11pt;font-weight:bold;text-transform:uppercase;margin:18px 0 6px 0;border-bottom:1px solid #333;padding-bottom:2px;';
  const p  = `font-family:Tahoma,sans-serif;font-size:11pt;color:#111;line-height:1.7;margin:6px 0;`;
  const ul = `font-family:Tahoma,sans-serif;font-size:11pt;color:#111;line-height:1.7;margin:4px 0 4px 20px;padding:0;`;

  return `
<div style="${s}padding-top:10mm;max-width:750px;margin:0 auto;">

  <p style="${h1}">${a.agreement_type.toUpperCase()}</p>
  <p style="font-family:Tahoma,sans-serif;font-size:10pt;text-align:center;color:#555;margin:0 0 4px 0;">Ref. No: ${agreementNo}</p>
  <p style="font-family:Tahoma,sans-serif;font-size:11pt;text-align:center;margin:0 0 18px 0;">
    This Agreement is made and entered into on <strong>${startDate}</strong> (the "Effective Date")
  </p>

  <p style="${h2}Parties</p>
  <p style="${p}"><strong>BETWEEN:</strong></p>
  <p style="${p}">
    <strong>1. The Warehouseman</strong><br>
    <strong>Alpha Line Cargo W.L.L</strong><br>
    ${location}<br>
    (hereinafter referred to as the <strong>"Warehouseman"</strong> or <strong>"Provider"</strong>)
  </p>
  <p style="${p}"><strong>AND</strong></p>
  <p style="${p}">
    <strong>2. The Depositor</strong><br>
    <strong>${customer}</strong><br>
    (hereinafter referred to as the <strong>"Depositor"</strong> or <strong>"Customer"</strong>)
  </p>
  <p style="${p}">The Warehouseman and the Depositor are hereinafter collectively referred to as the <strong>"Parties"</strong>.</p>

  <p style="${h2}Recitals</p>
  <p style="${p}">A. The Warehouseman operates a warehouse situated at <strong>${location}</strong>.</p>
  <p style="${p}">B. The Depositor desires to store certain goods in the Warehouse and the Warehouseman has agreed to provide storage services on the terms and conditions set out in this Agreement.</p>

  <p style="${h2}1. Definitions</p>
  <ul style="${ul}">
    <li><strong>"Goods"</strong> means: <strong>${commodity}</strong>, and any additional goods accepted by the Warehouseman from time to time.</li>
    <li><strong>"Storage Period"</strong> means the period commencing on <strong>${startDate}</strong> and ending on <strong>${endDate}</strong>.</li>
    <li><strong>"Storage Fees"</strong> means the charges specified in Annexure B.</li>
    <li><strong>"Force Majeure"</strong> means acts of God, war, riot, strike, flood, fire, epidemic, pandemic, government restrictions, or any other cause beyond the reasonable control of the Parties.</li>
  </ul>

  <p style="${h2}2. Storage Services</p>
  <p style="${p}">2.1 The Warehouseman agrees to provide secure, covered storage space at <strong>${location}</strong> for the Depositor's Goods.</p>
  <p style="${p}">2.2 The Depositor shall deliver the Goods in good condition and packed suitably for storage. The Warehouseman shall issue a Goods Receipt Note (GRN) acknowledging receipt of the Goods.</p>
  <p style="${p}">2.3 The Depositor shall have the right to inspect the Goods during normal business hours (Monday to Saturday, 9:00 AM – 6:00 PM) upon giving 48 hours' prior written notice.</p>

  <p style="${h2}3. Term and Termination</p>
  <p style="${p}">3.1 This Agreement shall commence on <strong>${startDate}</strong> and continue until <strong>${endDate}</strong>.</p>
  <p style="${p}">3.2 The Agreement shall automatically renew for successive periods unless either Party gives the other <strong>60 days'</strong> written notice of non-renewal prior to the expiry of the then-current term.</p>
  <p style="${p}">3.3 Either Party may terminate this Agreement by giving <strong>30 days'</strong> written notice if the other Party commits a material breach and fails to remedy the same within 15 days of receipt of notice.</p>
  <p style="${p}">3.4 Upon termination, the Depositor shall remove all Goods within <strong>15 days</strong>. Failing which, the Warehouseman may dispose of the Goods at the Depositor's cost and risk after giving 7 days' notice.</p>

  <p style="${h2}4. Fees and Payment</p>
  <p style="${p}">4.1 The Depositor shall pay Storage Fees as per Annexure B on a <strong>${billing}</strong> basis, in advance.</p>
  <p style="${p}">4.2 Payment terms: <strong>${payTerms}</strong>. All payments shall be made via bank transfer, UPI, or cheque.</p>
  <p style="${p}">4.3 Late payment shall attract interest at <strong>18% per annum</strong> from the due date until payment.</p>
  <p style="${p}">4.4 The Warehouseman reserves the right to revise Storage Fees once every 12 months by giving 30 days' written notice.</p>

  <p style="${h2}5. Risk, Liability and Insurance</p>
  <p style="${p}">5.1 The Goods shall remain at the <strong>sole risk</strong> of the Depositor at all times.</p>
  <p style="${p}">5.2 The Warehouseman shall not be liable for any loss or damage to the Goods except where caused by the gross negligence or wilful misconduct of the Warehouseman.</p>
  <p style="${p}">5.3 The Depositor shall, at its own cost, maintain adequate insurance covering the full value of the Goods against fire, theft, flood, and other perils.</p>

  <p style="${h2}6. Representations and Warranties</p>
  <p style="${p}">6.1 The Depositor warrants that:</p>
  <ul style="${ul}">
    <li>The Goods do not include hazardous, illegal, perishable, or prohibited items.</li>
    <li>The Goods are not subject to any lien or third-party claim.</li>
  </ul>
  <p style="${p}">6.2 The Warehouseman warrants that the Warehouse is structurally sound and complies with applicable fire-safety laws.</p>

  <p style="${h2}7. Indemnity</p>
  <p style="${p}">Each Party shall indemnify, defend and hold harmless the other Party from and against any claims, losses, damages, liabilities, costs and expenses arising out of any breach of this Agreement or any negligent act or omission by the indemnifying Party.</p>

  <p style="${h2}8. Force Majeure</p>
  <p style="${p}">Neither Party shall be liable for any delay or failure to perform its obligations (except payment obligations) due to a Force Majeure event.</p>

  <p style="${h2}9. Governing Law and Dispute Resolution</p>
  <p style="${p}">9.1 This Agreement shall be governed by and construed in accordance with the laws applicable to the jurisdiction of the Warehouse location.</p>
  <p style="${p}">9.2 Any dispute shall first be attempted to be resolved amicably. Failing which, the dispute shall be referred to arbitration by a sole arbitrator appointed mutually by the Parties.</p>

  <p style="${h2}10. Miscellaneous</p>
  <p style="${p}">10.1 This Agreement constitutes the entire understanding between the Parties and supersedes all prior agreements.</p>
  <p style="${p}">10.2 Any amendment must be in writing and signed by both Parties.</p>
  <p style="${p}">10.3 Notices shall be sent by email (with read receipt) or registered post to the addresses mentioned above.</p>

  ${notes ? `<p style="${h2}Special Conditions / Notes</p><p style="${p}">${notes}</p>` : ''}

  <p style="${h2}Annexure B – Fee Schedule</p>
  <table style="border-collapse:collapse;width:100%;font-family:Tahoma,sans-serif;font-size:11pt;margin-bottom:12px;">
    <tr style="background:#f0f0f0;">
      <td style="border:1px solid #ccc;padding:6px 10px;font-weight:bold;">Description</td>
      <td style="border:1px solid #ccc;padding:6px 10px;font-weight:bold;">Rate (${a.currency})</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:6px 10px;">Storage Rate (per day / CBM)</td>
      <td style="border:1px solid #ccc;padding:6px 10px;">${rate}</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:6px 10px;">Handling In (per operation)</td>
      <td style="border:1px solid #ccc;padding:6px 10px;">${hIn}</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:6px 10px;">Handling Out (per operation)</td>
      <td style="border:1px solid #ccc;padding:6px 10px;">${hOut}</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:6px 10px;">Minimum Charge</td>
      <td style="border:1px solid #ccc;padding:6px 10px;">${minCharge}</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:6px 10px;">Billing Cycle</td>
      <td style="border:1px solid #ccc;padding:6px 10px;">${billing}</td>
    </tr>
    <tr>
      <td style="border:1px solid #ccc;padding:6px 10px;">Payment Terms</td>
      <td style="border:1px solid #ccc;padding:6px 10px;">${payTerms}</td>
    </tr>
  </table>

  <p style="font-family:Tahoma,sans-serif;font-size:11pt;font-weight:bold;margin:32px 0 6px 0;">IN WITNESS WHEREOF, the Parties have executed this Agreement on the date first above written.</p>

  <table style="border-collapse:collapse;width:100%;margin-top:32px;font-family:Tahoma,sans-serif;font-size:11pt;">
    <tr>
      <td style="width:50%;padding:40px 20px 8px 0;vertical-align:bottom;border-top:1px solid #444;">
        <strong>For and on behalf of the Warehouseman</strong><br>
        Alpha Line Cargo W.L.L<br><br>
        Name: ___________________________<br>
        Designation: _____________________<br>
        Date: ___________________________
      </td>
      <td style="width:50%;padding:40px 0 8px 20px;vertical-align:bottom;border-top:1px solid #444;">
        <strong>For and on behalf of the Depositor</strong><br>
        ${customer}<br><br>
        Name: ___________________________<br>
        Designation: _____________________<br>
        Date: ___________________________
      </td>
    </tr>
  </table>

</div>`;
}

function buildAgreementText(a: Agreement): string {
  const customer  = a.customer?.company_name || '________________________________';
  const location  = a.storage_location       || '________________________________';
  const commodity = a.commodity              || '________________________________';
  const startDate = formatDate(a.start_date);
  const endDate   = a.end_date ? formatDate(a.end_date) : '________________';
  const rate      = a.storage_rate      ? `${a.currency} ${a.storage_rate}` : '________________';
  const hIn       = a.handling_in_rate  ? `${a.currency} ${a.handling_in_rate}`  : '________________';
  const hOut      = a.handling_out_rate ? `${a.currency} ${a.handling_out_rate}` : '________________';
  const minCharge = a.minimum_charge    ? `${a.currency} ${a.minimum_charge}`    : '________________';

  return `${a.agreement_type.toUpperCase()}
Ref. No: ${a.agreement_no || '________________'}

This Agreement is made and entered into on ${startDate} (the "Effective Date")

BETWEEN:

1. The Warehouseman
   Alpha Line Cargo W.L.L
   ${location}
   (hereinafter referred to as the "Warehouseman")

AND

2. The Depositor
   ${customer}
   (hereinafter referred to as the "Depositor")

RECITALS
A. The Warehouseman operates a warehouse situated at ${location}.
B. The Depositor desires to store certain goods and the Warehouseman has agreed to provide storage services on the terms set out herein.

1. DEFINITIONS
   "Goods"          : ${commodity}
   "Storage Period" : ${startDate} to ${endDate}
   "Storage Fees"   : As per Fee Schedule below

2. STORAGE SERVICES
   2.1 Storage space provided at ${location}.
   2.2 A GRN shall be issued upon delivery of Goods.
   2.3 Depositor may inspect Goods during business hours (Mon–Sat, 9AM–6PM) with 48 hrs notice.

3. TERM AND TERMINATION
   3.1 Term: ${startDate} to ${endDate}.
   3.2 Auto-renews unless 60 days' written notice of non-renewal is given.
   3.3 Either Party may terminate with 30 days' notice on material breach.
   3.4 Depositor must remove Goods within 15 days of termination.

4. FEES AND PAYMENT
   4.1 Billing Cycle  : ${a.billing_cycle}
   4.2 Payment Terms  : ${a.payment_terms}
   4.3 Late payments attract 18% per annum interest.
   4.4 Fees may be revised once every 12 months with 30 days' notice.

5. RISK, LIABILITY AND INSURANCE
   5.1 Goods remain at the sole risk of the Depositor.
   5.2 Warehouseman liability limited to gross negligence / wilful misconduct.
   5.3 Depositor to maintain insurance covering full value of Goods.

6. REPRESENTATIONS AND WARRANTIES
   6.1 Depositor warrants Goods are not hazardous, illegal, or subject to third-party claims.
   6.2 Warehouseman warrants the Warehouse is structurally sound and fire-safety compliant.

7. INDEMNITY
   Each Party shall indemnify the other against claims arising from breach or negligence.

8. FORCE MAJEURE
   Neither Party liable for failure due to Force Majeure (except payment obligations).

9. GOVERNING LAW
   Governed by applicable laws. Disputes by mutual arbitration.

10. MISCELLANEOUS
    This is the entire agreement. Amendments must be in writing and signed by both Parties.
${a.notes ? `\nSPECIAL CONDITIONS / NOTES\n${a.notes}\n` : ''}
────────────────────────────────────────────────────
ANNEXURE B – FEE SCHEDULE
────────────────────────────────────────────────────
Storage Rate (per day/CBM)   : ${rate}
Handling In (per operation)  : ${hIn}
Handling Out (per operation) : ${hOut}
Minimum Charge               : ${minCharge}
Billing Cycle                : ${a.billing_cycle}
Payment Terms                : ${a.payment_terms}
────────────────────────────────────────────────────

IN WITNESS WHEREOF the Parties have executed this Agreement on ${startDate}.

For and on behalf of the Warehouseman       For and on behalf of the Depositor
Alpha Line Cargo W.L.L                      ${customer}

Name: _______________________               Name: _______________________
Designation: ________________               Designation: ________________
Date: _______________________               Date: _______________________
`;
}

async function copyAgreement(a: Agreement) {
  const html = buildAgreementHTML(a);
  const text = buildAgreementText(a);
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html':  new Blob([html],  { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ]);
    alert('Agreement copied to clipboard. Paste into Word.');
  } catch {
    // fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    alert('Copied as plain text (fallback).');
  }
}

function printAgreement(a: Agreement) {
  const html = buildAgreementHTML(a);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Agreement – ${a.agreement_no || a.id}</title>
      <style>
        @page { margin: 10mm 15mm 10px 15mm; }
        body { font-family: Tahoma, sans-serif; font-size: 9pt; padding-top: 10mm; margin-bottom: 10px;}
      </style>
    </head>
    <body>${html}<script>window.onload=()=>window.print();<\/script></body>
    </html>`);
  win.document.close();
}

export default function StorageAgreementTab() {
  const { user } = useAuth();
  const [customers, setCustomers]     = useState<Customer[]>([]);
  const [agreements, setAgreements]   = useState<Agreement[]>([]);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<Agreement | null>(null);
  const [formData, setFormData]       = useState(emptyForm);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => { loadCustomers(); loadAgreements(); }, []);

  async function loadCustomers() {
    const { data } = await supabase.from('customers').select('id, company_name').order('company_name');
    if (data) setCustomers(data);
  }

  async function loadAgreements() {
    const { data } = await supabase
      .from('storage_agreements')
      .select('*, customer:customers(company_name)')
      .order('created_at', { ascending: false });
    if (data) setAgreements(data as any);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function openNew() {
    setEditing(null);
    setFormData(emptyForm);
    setError('');
    setShowForm(true);
  }

  function openEdit(a: Agreement) {
    setEditing(a);
    setFormData({
      customer_id:       a.customer_id,
      agreement_type:    a.agreement_type,
      commodity:         a.commodity,
      storage_location:  a.storage_location,
      start_date:        a.start_date,
      end_date:          a.end_date,
      storage_rate:      a.storage_rate,
      currency:          a.currency,
      handling_in_rate:  a.handling_in_rate,
      handling_out_rate: a.handling_out_rate,
      payment_terms:     a.payment_terms,
      billing_cycle:     a.billing_cycle,
      minimum_charge:    a.minimum_charge,
      notes:             a.notes,
      status:            a.status,
    });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.customer_id) { setError('Please select a customer.'); return; }
    if (!formData.start_date)  { setError('Start date is required.'); return; }
    setLoading(true);
    setError('');
    try {
      if (editing) {
        const { error: err } = await supabase
          .from('storage_agreements')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('storage_agreements')
          .insert({ ...formData, user_id: user?.id });
        if (err) throw err;
      }
      setShowForm(false);
      setEditing(null);
      setFormData(emptyForm);
      loadAgreements();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this agreement?')) return;
    await supabase.from('storage_agreements').delete().eq('id', id);
    loadAgreements();
  }

  const inp = 'w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all outline-none';
  const label = 'block text-xs font-medium text-slate-700 mb-1';

  return (
    <div className="space-y-3">
      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-3 border border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <FileSignature className="w-4 h-4 text-purple-600" />
              {editing ? 'Edit Agreement' : 'New Storage Agreement'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-3">{error}</div>
          )}

          <div className="space-y-3">
            {/* Customer & Type */}
            <div className="border-l-2 border-blue-500 pl-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" /> Customer & Agreement
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className={label}>Customer <span className="text-red-500">*</span></label>
                  <select name="customer_id" value={formData.customer_id} onChange={handleChange} className={inp} required>
                    <option value="">-- Select customer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Agreement Type</label>
                  <select name="agreement_type" value={formData.agreement_type} onChange={handleChange} className={inp}>
                    <option>Warehouse Storage Agreement</option>
                    <option>Service Agreement</option>
                    <option>Bonded Warehouse Agreement</option>
                    <option>Cold Storage Agreement</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className={inp}>
                    <option>Active</option>
                    <option>Expired</option>
                    <option>Pending</option>
                    <option>Terminated</option>
                  </select>
                </div>
                <div>
                  <label className={label}>Storage Location</label>
                  <input name="storage_location" value={formData.storage_location} onChange={handleChange} className={inp} placeholder="e.g. Warehouse Block A, Dubai" />
                </div>
                <div>
                  <label className={label}>Commodity / Cargo Description</label>
                  <input name="commodity" value={formData.commodity} onChange={handleChange} className={inp} placeholder="e.g. General Goods, Electronics" />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="border-l-2 border-teal-500 pl-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" /> Agreement Period
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className={label}>Start Date <span className="text-red-500">*</span></label>
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className={inp} required />
                </div>
                <div>
                  <label className={label}>End Date</label>
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className={inp} />
                </div>
              </div>
            </div>

            {/* Rates */}
            <div className="border-l-2 border-emerald-500 pl-2">
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Rates & Payment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className={label}>Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className={inp}>
                    {['AED','SAR','USD','EUR','GBP','BHD','KWD','OMR','QAR'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Storage Rate (per day/CBM)</label>
                  <input name="storage_rate" value={formData.storage_rate} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className={label}>Minimum Charge</label>
                  <input name="minimum_charge" value={formData.minimum_charge} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className={label}>Handling In Rate</label>
                  <input name="handling_in_rate" value={formData.handling_in_rate} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className={label}>Handling Out Rate</label>
                  <input name="handling_out_rate" value={formData.handling_out_rate} onChange={handleChange} className={inp} placeholder="0.00" />
                </div>
                <div>
                  <label className={label}>Billing Cycle</label>
                  <select name="billing_cycle" value={formData.billing_cycle} onChange={handleChange} className={inp}>
                    <option>Monthly</option>
                    <option>Weekly</option>
                    <option>Per Movement</option>
                    <option>On Delivery</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className={label}>Payment Terms</label>
                  <input name="payment_terms" value={formData.payment_terms} onChange={handleChange} className={inp} placeholder="e.g. 30 days from invoice date" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={label}>Notes / Special Conditions</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3}
                className={`${inp} resize-none`} placeholder="Any special conditions or notes..." />
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded transition-all shadow disabled:opacity-50">
              {loading ? 'Saving...' : editing ? 'Update Agreement' : 'Save Agreement'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white rounded-lg shadow border border-teal-100">
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Storage Agreements</h3>
          {!showForm && (
            <button onClick={openNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded shadow hover:from-purple-700 hover:to-indigo-700 transition-all">
              <Plus className="w-3.5 h-3.5" /> New Agreement
            </button>
          )}
        </div>

        {agreements.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No agreements yet. Create your first one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Ref #','Customer','Type','Location','Period','Rate','Status',''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {agreements.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2 font-mono text-xs text-slate-600">{a.agreement_no || '—'}</td>
                    <td className="px-3 py-2 font-medium text-slate-800">{a.customer?.company_name || '—'}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{a.agreement_type}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{a.storage_location || '—'}</td>
                    <td className="px-3 py-2 text-slate-600 text-xs whitespace-nowrap">
                      {a.start_date} {a.end_date ? `→ ${a.end_date}` : ''}
                    </td>
                    <td className="px-3 py-2 text-slate-600 text-xs">{a.storage_rate ? `${a.currency} ${a.storage_rate}` : '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        a.status === 'Active'      ? 'bg-emerald-100 text-emerald-700' :
                        a.status === 'Expired'     ? 'bg-red-100 text-red-700' :
                        a.status === 'Pending'     ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{a.status}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => copyAgreement(a)} title="Copy to clipboard"
                          className="p-1 hover:bg-indigo-50 rounded text-indigo-500 transition-colors">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => printAgreement(a)} title="Print"
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(a)} title="Edit"
                          className="p-1 hover:bg-blue-50 rounded text-blue-500 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(a.id)} title="Delete"
                          className="p-1 hover:bg-red-50 rounded text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}