import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Package, MapPin, DollarSign, Clock, AlertCircle, Building2 } from 'lucide-react';
import AutocompleteField from './AutocompleteField';

interface ProposalFormProps {
  onSuccess: () => void;
  editingProposal?: any;
}

interface Customer {
  id: string;
  company_name: string;
}

const getCurrencyByCountry = (country: string): string => {
  switch (country) {
    case 'UAE':
      return 'AED';
    case 'KSA':
      return 'SAR';
    case 'Bahrain':
      return 'BHD';
    default:
      return 'AED';
  }
};

export default function ProposalForm({ onSuccess, editingProposal }: ProposalFormProps) {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  const defaultCurrency = userProfile?.country ? getCurrencyByCountry(userProfile.country) : 'AED';

  const [formData, setFormData] = useState({
    customer_id: '',
    land_freight: '',
    currency: defaultCurrency,
    equipment_type: '',
    pol: '',
    pod: '',
    scope_of_service: '',
    commodity: '',
    packing: '',
    weight: '',
    volume: '',
    export_documentation: 'On Shippers scope',
    origin_border_clearance_fee: 'Against actual payment receipts',
    transit_border_clearance_fee: 'On Consignee Scope',
    permission_naquel_toll_charges: '',
    required_documents: 'Commercial Invoice, Packing List, Certificate of Origin, Export Certificates(if applicable)',
    other_documents: 'Subject to nature of Shipping Documents',
    return_freight: '80% of Land Freight',
    free_time_loading: '4 Days',
    free_time_origin_border: '4 Days',
    free_time_destination_border: '4 Days',
    detention_charges: '',
    payment_terms: '',
    validity: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (editingProposal) {
      setFormData({
        customer_id: editingProposal.customer_id || '',
        land_freight: editingProposal.land_freight || '',
        currency: editingProposal.currency || 'AED',
        equipment_type: editingProposal.equipment_type || '',
        pol: editingProposal.pol || '',
        pod: editingProposal.pod || '',
        scope_of_service: editingProposal.scope_of_service || '',
        commodity: editingProposal.commodity || '',
        packing: editingProposal.packing || '',
        weight: editingProposal.weight || '',
        volume: editingProposal.volume || '',
        export_documentation: editingProposal.export_documentation || 'On Shippers scope',
        origin_border_clearance_fee: editingProposal.origin_border_clearance_fee || 'Against actual payment receipts',
        transit_border_clearance_fee: editingProposal.transit_border_clearance_fee || 'On Consignee Scope',
        permission_naquel_toll_charges: editingProposal.permission_naquel_toll_charges || '',
        required_documents: editingProposal.required_documents || 'Commercial Invoice, Packing List, Certificate of Origin, Export Certificates(if applicable)',
        other_documents: editingProposal.other_documents || 'Subject to nature of Shipping Documents',
        return_freight: editingProposal.return_freight || '80% of Land Freight',
        free_time_loading: editingProposal.free_time_loading || '4 Days',
        free_time_origin_border: editingProposal.free_time_origin_border || '4 Days',
        free_time_destination_border: editingProposal.free_time_destination_border || '4 Days',
        detention_charges: editingProposal.detention_charges || '',
        payment_terms: editingProposal.payment_terms || '',
        validity: editingProposal.validity || '',
        notes: editingProposal.notes || '',
      });
    }
  }, [editingProposal]);

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, company_name')
      .order('company_name');

    if (!error && data) {
      setCustomers(data);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAutocompleteChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const copyProposalToClipboard = async (proposal: any) => {
    const quoteYear = new Date(proposal.created_at).getFullYear();
    const quoteRef = `${String(proposal.quote_number).padStart(5, '0')}/${quoteYear}`;
    const quoteDate = new Date(proposal.created_at).toLocaleDateString();

    const tableData = [
      ['', `Quote Ref: ${quoteRef}`, `Date: ${quoteDate}`],
      ['1.', 'Road Freight', proposal.land_freight ? `${proposal.currency}:${proposal.land_freight}/-` : 'N/A'],
      ['2.', 'Type of Equipment', proposal.equipment_type ? `${proposal.equipment_type}, Subject to availability` : 'N/A'],
      ['3.', 'POL ~ POD, Scope of Service', `${proposal.pol} to ${proposal.pod} ${proposal.scope_of_service || 'Land Transport'}`],
      ['4.', 'Commodity, Packing, Volume, Weight', `${proposal.commodity || ''}, ${proposal.packing || ''}, ${proposal.volume || ''}, ${proposal.weight || ''}`],
      ['5.', 'Export documentation', proposal.export_documentation || 'On Shippers scope'],
      ['6.', 'Origin Border Clearance & Fee', proposal.origin_border_clearance_fee || 'Against actual payment receipts'],
      ['7.', 'Destination Border Clearance & Fee', proposal.transit_border_clearance_fee || 'On Consignee Scope'],
      ['8.', 'Permission Charges & Toll Charges\nNaqel charges', proposal.permission_naquel_toll_charges || 'Client Scope (if applicable)'],
      ['9.', 'Destination Customs Duty & Govt: Fee', 'On Consignee or their clearing agent scope.'],
      ['10.', 'Transit Time', 'Days under usual conditions'],
      ['11.', 'Required Documents', proposal.required_documents || 'Commercial Invoice, Certificate of Origin, Packing List, Export Certificates - as per cargo spec.'],
      ['12.', 'Other Requirements', proposal.other_documents || 'Subject to nature of cargo'],
      ['13.', 'Return Freight (if cargo returns from the border)', proposal.return_freight || '80% of quoted freight + VAT (if applicable)'],
      ['14.', 'Free Time', ''],
      ['', 'For Loading & offloading', proposal.free_time_loading || '2 Hours'],
      ['', 'For Exit Border', proposal.free_time_origin_border || '12 Hours'],
      ['', 'For destination Border & Fasah', proposal.free_time_destination_border || '24 Hours'],
      ['15', 'Detention & Delay Charges', proposal.detention_charges || 'AED:500/Day for first 7 days'],
      ['16.', 'Payment Terms', proposal.payment_terms || 'Cash on Deliver (COD)'],
      ['17.', 'Quote Validity', proposal.validity || '7 days from the date of Quote'],
      ['18.', 'Other Documents required', proposal.notes || 'Subject to nature of Cargo'],
    ];

    const htmlTable = `
<p style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
Thank you for your inquiry and for considering us for this opportunity.<br>
Please find attached / below our detailed proposal / quotation tailored to your requirements.
</p>
<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-family: Arial, sans-serif; table-layout: fixed; border: 2px solid #000;">
  <tbody>
    ${tableData.map(([num, label, value], index) => `
    <tr style="border: 1px solid #000;">
      <td style="width: 30px; padding: 4px 8px; border: 1px solid #000 !important; background-color: ${index === 0 ? '#F2F527' : '#f0f4f8'}; font-weight: ${index === 0 ? 'bold' : 'normal'};">${num}</td>
      <td style="width: 200px; padding: 4px 8px; border: 1px solid #000 !important; background-color: ${index === 0 ? '#F2F527' : '#e3f2fd'}; font-weight: ${index === 0 ? 'bold' : 'normal'};">${label}</td>
      <td style="width: 350px; padding: 4px 8px; border: 1px solid #000 !important; background-color: ${index === 0 ? '#F2F527' : '#ffffff'}; font-weight: ${index === 0 ? 'bold' : 'normal'};">${value}</td>
    </tr>`).join('')}
  </tbody>
</table>
<p style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; margin-top: 16px;">
We hope the above proposal meets your needs and budget considerations.
</p>`.trim();

    const plainText = tableData.map(row => row.join('\t')).join('\n');

    const modernCopy = async (): Promise<boolean> => {
      if (!navigator.clipboard?.write) return false;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlTable], { type: 'text/html' }),
            'text/plain': new Blob([plainText], { type: 'text/plain' })
          })
        ]);
        return true;
      } catch { return false; }
    };

    const execCommandCopy = (): boolean => {
      try {
        const container = document.createElement('div');
        container.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;z-index:-1;';
        container.innerHTML = htmlTable;
        document.body.appendChild(container);
        const range = document.createRange();
        range.selectNode(container);
        const selection = window.getSelection();
        if (!selection) { document.body.removeChild(container); return false; }
        selection.removeAllRanges();
        selection.addRange(range);
        const success = document.execCommand('copy');
        selection.removeAllRanges();
        document.body.removeChild(container);
        return success;
      } catch { return false; }
    };

    await modernCopy() || execCommandCopy();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editingProposal) {
        const { error } = await supabase
          .from('proposals')
          .update({
            ...formData,
            customer_id: formData.customer_id || null,
            country: userProfile?.country,
          })
          .eq('id', editingProposal.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('proposals').insert([
          {
            ...formData,
            customer_id: formData.customer_id || null,
            country: userProfile?.country,
            user_id: user?.id,
          },
        ]);

        if (error) throw error;
      }

      setFormData({
        customer_id: '',
        land_freight: '',
        currency: defaultCurrency,
        equipment_type: '',
        pol: '',
        pod: '',
        scope_of_service: '',
        commodity: '',
        packing: '',
        weight: '',
        volume: '',
        export_documentation: 'On Shippers scope',
        origin_border_clearance_fee: 'Against actual payment receipts',
        transit_border_clearance_fee: 'On Consignee Scope',
        permission_naquel_toll_charges: '',
        required_documents: 'Commercial Invoice, Packing List, Certificate of Origin, Export Certificates(if applicable)',
        other_documents: 'Subject to nature of Shipping Documents',
        return_freight: '80% of Land Freight',
        free_time_loading: '4 Days',
        free_time_origin_border: '4 Days',
        free_time_destination_border: '4 Days',
        detention_charges: '',
        payment_terms: '',
        validity: '',
        notes: '',
      });

      // fetch the saved proposal to get quote_number and created_at
      let savedProposal = null;
      if (editingProposal) {
        const { data } = await supabase
          .from('proposals')
          .select('*')
          .eq('id', editingProposal.id)
          .single();
        savedProposal = data;
      } else {
        const { data } = await supabase
          .from('proposals')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        savedProposal = data;
      }

      if (savedProposal) {
        await copyProposalToClipboard(savedProposal);
        alert('Proposal saved & copied to clipboard! You can paste it in your email.');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-3 border border-teal-100">
      <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-1.5">
        <FileText className="w-4 h-4 text-teal-600" />
        {editingProposal ? 'Edit Proposal' : 'Create New Proposal'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-3">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Customer Selection */}
        <div className="border-l-2 border-blue-500 pl-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            Customer
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Customer (Optional)
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="">-- Select a customer --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="border-l-2 border-teal-500 pl-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-teal-600" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Land Freight <span className="text-red-500">*</span>
              </label>
              <input
                name="land_freight"
                type="number"
                min="0"
                step="0.01"
                value={formData.land_freight}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-right"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="AED">AED - UAE Dirhams</option>
                <option value="BHD">BHD - Bahrain Dinar</option>
                <option value="SAR">SAR - Saudi Arabian Riyal</option>
                <option value="KWD">KWD - Kuwaiti Dinar</option>
                <option value="OMR">OMR - Omani Rial</option>
                <option value="QAR">QAR - Qatari Riyal</option>
                <option value="EUR">EUR - Euro</option>
                <option value="USD">USD - US Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Type of Equipment <span className="text-red-500">*</span>
              </label>
              <AutocompleteField
                table="equipment_types"
                value={formData.equipment_type}
                onChange={(value) => handleAutocompleteChange('equipment_type', value)}
                placeholder="Select or type equipment type"
                required={true}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                POL (Place of Loading)
              </label>
              <AutocompleteField
                table="locations"
                value={formData.pol}
                onChange={(value) => handleAutocompleteChange('pol', value)}
                required={true}
                placeholder="Select or type loading location"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                POD (Place of Delivery)
              </label>
              <AutocompleteField
                table="locations"
                value={formData.pod}
                onChange={(value) => handleAutocompleteChange('pod', value)}
                required={true}
                placeholder="Select or type delivery location"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Scope of Service
              </label>
              <textarea
                name="scope_of_service"
                value={formData.scope_of_service}
                onChange={handleChange}
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Describe the scope of service"
              />
            </div>
          </div>
        </div>

        {/* Cargo Details */}
        <div className="border-l-2 border-emerald-500 pl-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            Cargo Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Commodity
              </label>
              <AutocompleteField
                table="commodities"
                value={formData.commodity}
                onChange={(value) => handleAutocompleteChange('commodity', value)}
                placeholder="Select or type commodity"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Packing
              </label>
              <AutocompleteField
                table="packing_types"
                value={formData.packing}
                onChange={(value) => handleAutocompleteChange('packing', value)}
                placeholder="Select or type packing type"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Weight
              </label>
              <input
                name="weight"
                type="text"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., 1000 kg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Volume
              </label>
              <input
                name="volume"
                type="text"
                value={formData.volume}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., 10 CBM"
              />
            </div>
          </div>
        </div>

        {/* Documentation & Clearance */}
        <div className="border-l-2 border-cyan-500 pl-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-600" />
            Documentation & Clearance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Export Documentation
              </label>
              <textarea
                name="export_documentation"
                value={formData.export_documentation}
                onChange={handleChange}
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="List export documentation"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Origin Border Clearance & Fee
              </label>
              <input
                name="origin_border_clearance_fee"
                type="text"
                value={formData.origin_border_clearance_fee}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., $500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Transit Border Clearance & Fee
              </label>
              <input
                name="transit_border_clearance_fee"
                type="text"
                value={formData.transit_border_clearance_fee}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., $300"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Permission, Naquel & Toll Charges
              </label>
              <input
                name="permission_naquel_toll_charges"
                type="text"
                value={formData.permission_naquel_toll_charges}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., $150"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Required Documents
              </label>
              <textarea
                name="required_documents"
                value={formData.required_documents}
                onChange={handleChange}
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="List required documents"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Other Documents
              </label>
              <textarea
                name="other_documents"
                value={formData.other_documents}
                onChange={handleChange}
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="List other documents"
              />
            </div>
          </div>
        </div>

        {/* Timing & Charges */}
        <div className="border-l-2 border-amber-500 pl-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Timing & Charges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Return Freight
              </label>
              <input
                name="return_freight"
                type="text"
                value={formData.return_freight}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., $1200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Free Time for Loading
              </label>
              <input
                name="free_time_loading"
                type="text"
                value={formData.free_time_loading}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., 2 hours"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Free Time for Origin Border
              </label>
              <input
                name="free_time_origin_border"
                type="text"
                value={formData.free_time_origin_border}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., 24 hours"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Free Time for Destination Border
              </label>
              <input
                name="free_time_destination_border"
                type="text"
                value={formData.free_time_destination_border}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., 24 hours"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Detention Charges
              </label>
              <input
                name="detention_charges"
                type="text"
                value={formData.detention_charges}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., $50 per day after free time"
              />
            </div>
          </div>
        </div>

        {/* Terms & Validity */}
        <div className="border-l-4 border-rose-500 pl-4">
          <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rose-600" />
            Terms & Validity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Terms
              </label>
              <input
                name="payment_terms"
                type="text"
                value={formData.payment_terms}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., 50% advance, 50% on delivery"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Validity
              </label>
              <input
                name="validity"
                type="text"
                value={formData.validity}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="e.g., 30 days from date"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Additional notes or special instructions"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        {editingProposal && (
          <button
            type="button"
            onClick={() => {
              setFormData({
                customer_id: '',
                land_freight: '',
                currency: 'AED',
                equipment_type: '',
                pol: '',
                pod: '',
                scope_of_service: '',
                commodity: '',
                packing: '',
                weight: '',
                volume: '',
                export_documentation: 'On Shippers scope',
                origin_border_clearance_fee: 'Against actual payment receipts',
                transit_border_clearance_fee: 'On Consignee Scope',
                permission_naquel_toll_charges: '',
                required_documents: 'Commercial Invoice, Packing List, Certificate of Origin, Export Certificates(if applicable)',
                other_documents: 'Subject to nature of Shipping Documents',
                return_freight: '80% of Land Freight',
                free_time_loading: '4 Days',
                free_time_origin_border: '4 Days',
                free_time_destination_border: '4 Days',
                detention_charges: '',
                payment_terms: '',
                validity: '',
                notes: '',
              });
              onSuccess();
            }}
            className="px-3 py-1.5 text-sm bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded transition-all"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium rounded transition-all shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : editingProposal ? 'Update & Copy' : 'Save & Copy'}
        </button>
      </div>
    </form>
  );
}