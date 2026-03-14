import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CustomerForm from './CustomerForm';
import CustomerList from './CustomerList';
import ProposalForm from './ProposalForm';
import ProposalList from './ProposalList';
import ModuleSelector from './ModuleSelector';
import { LogOut, Truck, Users, FileText, ArrowLeft } from 'lucide-react';

type TabType = 'customers' | 'proposals';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeModule, setActiveModule] = useState<TabType | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingProposal, setEditingProposal] = useState<any>(null);

  const handleSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setEditingProposal(null);
  };

  const handleEdit = (proposal: any) => {
    setEditingProposal(proposal);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectModule = (module: TabType) => {
    setActiveModule(module);
    setActiveTab(module);
  };

  if (!activeModule) {
    return <ModuleSelector onSelectModule={handleSelectModule} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      <nav className="bg-white shadow-sm border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModule(null)}
                className="p-1.5 hover:bg-teal-50 rounded transition-colors"
                title="Back to modules"
              >
                <ArrowLeft className="w-5 h-5 text-teal-600" />
              </button>
              <div className="w-7 h-7 bg-gradient-to-br from-teal-600 to-emerald-600 rounded flex items-center justify-center">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-800">Freight Management</h1>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-teal-50 rounded transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3">
        <div className="bg-white rounded shadow-sm border border-teal-100 p-1.5 mb-3">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded font-medium transition-all ${
                activeTab === 'customers'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow'
                  : 'text-slate-600 hover:bg-teal-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Customers
            </button>
            <button
              onClick={() => setActiveTab('proposals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded font-medium transition-all ${
                activeTab === 'proposals'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow'
                  : 'text-slate-600 hover:bg-teal-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Proposals
            </button>
          </div>
        </div>

        <main>
          {activeTab === 'customers' ? (
            <div className="space-y-3">
              <CustomerForm onSuccess={handleSuccess} />
              <CustomerList refresh={refreshKey} />
            </div>
          ) : activeTab === 'proposals' ? (
            <div className="space-y-3">
              <ProposalForm onSuccess={handleSuccess} editingProposal={editingProposal} />
              <ProposalList refresh={refreshKey} onEdit={handleEdit} />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
