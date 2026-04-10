import { useState } from 'react';
import { Warehouse, FileSignature, PackageCheck, PackageMinus } from 'lucide-react';
import StorageAgreementTab from './StorageAgreementTab';
import GRNTab from './GRNTab';
import GDNTab from './GDNTab';

type StorageTab = 'agreement' | 'grn' | 'gdn';

const TABS = [
  { key: 'agreement' as StorageTab, label: 'Storage Agreement', shortLabel: 'Agreement', icon: FileSignature, color: 'text-purple-600' },
  { key: 'grn' as StorageTab,       label: 'GRN – Goods Receipt', shortLabel: 'GRN', icon: PackageCheck, color: 'text-emerald-600' },
  { key: 'gdn' as StorageTab,       label: 'GDN – Goods Delivery', shortLabel: 'GDN', icon: PackageMinus, color: 'text-orange-600' },
];

export default function StorageModule() {
  const [activeTab, setActiveTab] = useState<StorageTab>('agreement');

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded shadow-sm border border-teal-100 p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded flex items-center justify-center">
            <Warehouse className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Warehouse Storage</h2>
            <p className="text-xs text-slate-500">Agreements, receipts and deliveries</p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                    : 'text-slate-600 hover:bg-purple-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'agreement' && <StorageAgreementTab />}
      {activeTab === 'grn'       && <GRNTab />}
      {activeTab === 'gdn'       && <GDNTab />}
    </div>
  );
}