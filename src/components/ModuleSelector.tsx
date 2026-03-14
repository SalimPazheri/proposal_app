import { Users, FileText, Truck, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ModuleSelectorProps {
  onSelectModule: (module: 'customers' | 'proposals') => void;
}

export default function ModuleSelector({ onSelectModule }: ModuleSelectorProps) {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      <nav className="bg-white shadow-sm border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Freight Management System</h1>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-teal-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">
            Welcome, User
          </h2>
          <p className="text-lg text-slate-600">
            Select a module to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <button
            onClick={() => onSelectModule('customers')}
            className="group bg-white rounded-xl shadow-lg p-8 border-2 border-teal-100 hover:border-teal-600 hover:shadow-xl transition-all text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-emerald-100 group-hover:from-teal-600 group-hover:to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all">
              <Users className="w-8 h-8 text-teal-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">
              Customers
            </h3>
            <p className="text-sm text-slate-600">
              Manage customer information and contacts
            </p>
          </button>

          <button
            onClick={() => onSelectModule('proposals')}
            className="group bg-white rounded-xl shadow-lg p-8 border-2 border-teal-100 hover:border-teal-600 hover:shadow-xl transition-all text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-cyan-100 group-hover:from-teal-600 group-hover:to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all">
              <FileText className="w-8 h-8 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">
              Proposals
            </h3>
            <p className="text-sm text-slate-600">
              Create and manage freight proposals
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
