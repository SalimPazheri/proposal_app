import { useEffect, useState } from 'react';
import { supabase, Customer } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Mail, Phone, MapPin, Trash2 } from 'lucide-react';

interface CustomerListProps {
  refresh: number;
}

export default function CustomerList({ refresh }: CustomerListProps) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, [refresh, user]);

  const loadCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCustomers(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (!error) {
        loadCustomers();
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-3">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
          <div className="h-20 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-700 mb-1">No customers yet</h3>
        <p className="text-xs text-slate-500">Add your first customer using the form above</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-3">
      <h2 className="text-lg font-bold text-slate-800 mb-3">Customer List</h2>
      <div className="space-y-2">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="border border-slate-200 rounded p-2.5 hover:shadow transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{customer.company_name}</h3>
                  <p className="text-xs text-slate-500">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(customer.id)}
                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                title="Delete customer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {customer.company_address && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-600">{customer.company_address}</p>
                    {(customer.city || customer.country) && (
                      <p className="text-slate-500">
                        {[customer.city, customer.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {customer.company_tel && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600">{customer.company_tel}</span>
                  </div>
                )}
                {customer.company_email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600">{customer.company_email}</span>
                  </div>
                )}
              </div>
            </div>

            {(customer.contact_person || customer.contact_email) && (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  Contact Person
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {customer.contact_person && (
                    <span className="text-slate-700 font-medium">{customer.contact_person}</span>
                  )}
                  {customer.contact_email && (
                    <span className="text-slate-600">{customer.contact_email}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
