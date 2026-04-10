import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileSignature, Building2, Calendar, DollarSign, Pencil, Trash2, Plus, X } from 'lucide-react';

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
      customer_id:      a.customer_id,
      agreement_type:   a.agreement_type,
      commodity:        a.commodity,
      storage_location: a.storage_location,
      start_date:       a.start_date,
      end_date:         a.end_date,
      storage_rate:     a.storage_rate,
      currency:         a.currency,
      handling_in_rate: a.handling_in_rate,
      handling_out_rate:a.handling_out_rate,
      payment_terms:    a.payment_terms,
      billing_cycle:    a.billing_cycle,
      minimum_charge:   a.minimum_charge,
      notes:            a.notes,
      status:           a.status,
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
                        <button onClick={() => openEdit(a)} className="p-1 hover:bg-blue-50 rounded text-blue-500 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(a.id)} className="p-1 hover:bg-red-50 rounded text-red-400 transition-colors">
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