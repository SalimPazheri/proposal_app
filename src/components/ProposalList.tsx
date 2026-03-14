import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Trash2, Copy, FileDown, CreditCard as Edit } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Proposal {
  id: string;
  customer_id: string | null;
  land_freight: string;
  currency: string;
  equipment_type: string;
  pol: string;
  pod: string;
  scope_of_service: string;
  commodity: string;
  packing: string;
  weight: string;
  volume: string;
  export_documentation: string;
  origin_border_clearance_fee: string;
  transit_border_clearance_fee: string;
  permission_naquel_toll_charges: string;
  required_documents: string;
  other_documents: string;
  return_freight: string;
  free_time_loading: string;
  free_time_origin_border: string;
  free_time_destination_border: string;
  detention_charges: string;
  payment_terms: string;
  validity: string;
  notes: string;
  quote_number: number;
  created_at: string;
  updated_at: string;
  customers: {
    company_name: string;
  } | null;
}

interface ProposalListProps {
  refresh: number;
  onEdit: (proposal: Proposal) => void;
}

export default function ProposalList({ refresh, onEdit }: ProposalListProps) {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposals();
  }, [refresh, user]);

  const loadProposals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('proposals')
      .select('*, customers(company_name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProposals(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this proposal?')) {
      const { error } = await supabase.from('proposals').delete().eq('id', id);
      if (!error) {
        loadProposals();
      }
    }
  };

  const handleCopyProposal = async (proposal: Proposal) => {
    const quoteYear = new Date(proposal.created_at).getFullYear();
    const quoteRef = `${String(proposal.quote_number).padStart(5, '0')}/${quoteYear}`;
    const quoteDate = new Date(proposal.created_at).toLocaleDateString();

    const tableData = [
      ['', `Quote Ref: ${quoteRef}`, `Date: ${quoteDate}`],
      ['1.', 'Road Freight', proposal.land_freight ? `${proposal.currency}:${proposal.land_freight}/-` : '100'],
      ['2.', 'Type of Equipment', proposal.equipment_type ? `${proposal.equipment_type}, Subject to availability` : 'N/A'],
      ['3.', 'POL ~ POD, Scope of Service', `${proposal.pol} to ${proposal.pod} ${proposal.scope_of_service || 'Land Transport'}`],
      ['4.', 'Commodity, Packing, Volume, Weight', `${proposal.commodity || ''}, ${proposal.packing || ''}, ${proposal.volume || ''}, ${proposal.weight || ''}`],
      ['5.', 'Export documentation', proposal.export_documentation || 'Shipper Scope'],
      ['6.', 'Origin Border Clearance & Fee', proposal.origin_border_clearance_fee || 'Against actual payment Receipts'],
      ['7.', 'Destination Border Clearance & Fee', proposal.transit_border_clearance_fee || 'On cinsignee Scope'],
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

    const headerText = 'Thank you for your inquiry and for considering us for this opportunity.\nPlease find attached / below our detailed proposal / quotation tailored to your requirements.\n\n';
    const footerText = '\n\nWe hope the above proposal meets your needs and budget considerations.';

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
</p>
    `.trim();

    const plainText = headerText + tableData.map(row => row.join('\t')).join('\n') + footerText;

    // Try modern clipboard API first (works on desktop)
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
      } catch {
        return false;
      }
    };

    // Fallback: render HTML into a hidden element and use execCommand (works on mobile)
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
      } catch {
        return false;
      }
    };

    try {
      const success = await modernCopy() || execCommandCopy();
      if (success) {
        alert('Proposal copied to clipboard! You can paste it in your email.');
      } else {
        alert('Failed to copy proposal. Please try again.');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy proposal. Please try again.');
    }
  };

  const handleSavePDF = (proposal: Proposal) => {
    const doc = new jsPDF();

    doc.setFontSize(10);
    doc.text('PROPOSAL', 105, 10, { align: 'center' });

    doc.setFontSize(7);
    doc.text(`Customer: ${proposal.customers?.company_name || 'N/A'}`, 8, 16);
    doc.text(`Date: ${new Date(proposal.created_at).toLocaleDateString()}`, 8, 20);

    const quoteYear = new Date(proposal.created_at).getFullYear();
    const quoteRef = `${String(proposal.quote_number).padStart(5, '0')}/${quoteYear}`;
    const quoteDate = new Date(proposal.created_at).toLocaleDateString();

    const tableData = [
      ['', `Quote Ref: ${quoteRef}`, `Date: ${quoteDate}`],
      ['1.', 'Road Freight', proposal.land_freight ? `${proposal.currency}:${proposal.land_freight}/-` : 'N/A'],
      ['2.', 'Type of Equipment', proposal.equipment_type ? `${proposal.equipment_type}, Subject to availability` : 'N/A'],
      ['3.', 'POL ~ POD, Scope of Service', `${proposal.pol} to ${proposal.pod} ${proposal.scope_of_service || ''}`],
      ['4.', 'Commodity, Packing, Volume, Weight', `${proposal.commodity || ''}, ${proposal.packing || ''}, ${proposal.volume || ''}, ${proposal.weight || ''}`],
      ['5.', 'Export documentation', proposal.export_documentation || 'N/A'],
      ['6.', 'Origin Border Clearance & Fee', proposal.origin_border_clearance_fee || 'N/A'],
      ['7.', 'Destination Border Clearance & Fee', proposal.transit_border_clearance_fee || 'N/A'],
      ['8.', 'Permission Charges & Toll Charges\nNaqel charges', proposal.permission_naquel_toll_charges || 'N/A'],
      ['9.', 'Destination Customs Duty & Govt: Fee', 'On Consignee or their clearing agent scope.'],
      ['10.', 'Transit Time', 'Days under usual conditions'],
      ['11.', 'Required Documents', proposal.required_documents || 'N/A'],
      ['12.', 'Other Requirements', proposal.other_documents || 'N/A'],
      ['13.', 'Return Freight (if cargo returns from the border)', proposal.return_freight || 'N/A'],
      ['14.', 'Free Time', ''],
      ['', 'For Loading & offloading', proposal.free_time_loading || 'N/A'],
      ['', 'For Exit Border', proposal.free_time_origin_border || 'N/A'],
      ['', 'For destination Border & Fasah', proposal.free_time_destination_border || 'N/A'],
      ['15', 'Detention & Delay Charges', proposal.detention_charges || 'N/A'],
      ['16.', 'Payment Terms', proposal.payment_terms || 'N/A'],
      ['17.', 'Quote Validity', proposal.validity || 'N/A'],
      ['18.', 'Other Documents required', proposal.notes || 'N/A'],
    ];

    autoTable(doc, {
      startY: 24,
      head: [],
      body: tableData,
      theme: 'grid',
      tableWidth: 'wrap',
      styles: {
        fontSize: 6,
        cellPadding: 1,
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 4, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 31, fontSize: 6 },
        2: { cellWidth: 31, fontSize: 6 },
      },
      didParseCell: (data: any) => {
        if (data.row.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [242, 245, 39];
        }
      },
      margin: { left: 8, right: 8 },
    });

    const fileName = `Proposal_${proposal.customers?.company_name || 'Unknown'}_${new Date(proposal.created_at).toLocaleDateString().replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-3 border border-teal-100">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center border border-teal-100">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700 mb-1">No proposals yet</h3>
        <p className="text-xs text-slate-500">Create your first proposal using the form above</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-3 border border-teal-100">
      <h2 className="text-lg font-bold text-slate-800 mb-3">Proposal List</h2>
      <div className="grid grid-cols-1 gap-2">
        {proposals.map((proposal) => (
          <div
            key={proposal.id}
            className="border border-slate-200 rounded p-2 hover:shadow transition-shadow bg-gradient-to-r from-teal-50/30 to-emerald-50/30"
          >
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Customer</p>
                <p className="text-sm font-medium text-slate-800">
                  {proposal.customers?.company_name || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-0.5">Equipment</p>
                <p className="text-sm text-slate-700">{proposal.equipment_type || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-0.5">Date</p>
                <p className="text-sm text-slate-700">
                  {new Date(proposal.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-0.5">Commodity</p>
                <p className="text-sm text-slate-700">{proposal.commodity || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-0.5">Validity</p>
                <p className="text-sm text-slate-700">{proposal.validity || 'N/A'}</p>
              </div>

              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => onEdit(proposal)}
                  className="text-amber-600 hover:text-amber-700 p-1.5 hover:bg-amber-50 rounded transition-colors"
                  title="Edit proposal"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleCopyProposal(proposal)}
                  className="text-teal-600 hover:text-teal-700 p-1.5 hover:bg-teal-50 rounded transition-colors"
                  title="Copy proposal"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleSavePDF(proposal)}
                  className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded transition-colors"
                  title="Save as PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(proposal.id)}
                  className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                  title="Delete proposal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}