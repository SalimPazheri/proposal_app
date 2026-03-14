import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Building2, MapPin, Phone, Mail, User } from 'lucide-react';
import CityAutocomplete from './CityAutocomplete';

interface CustomerFormProps {
  onSuccess: () => void;
}

export default function CustomerForm({ onSuccess }: CustomerFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_tel: '',
    company_email: '',
    city: '',
    country: '',
    contact_person: '',
    contact_email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCityChange = (city: string, country: string) => {
    setFormData({ ...formData, city, country });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error('You must be logged in to add customers');
      }

      const customerData = {
        company_name: formData.company_name,
        company_address: formData.company_address,
        company_tel: formData.company_tel,
        company_email: formData.company_email,
        city: formData.city,
        country: formData.country,
        contact_person: formData.contact_person,
        contact_email: formData.contact_email,
        user_id: user.id,
      };

      console.log('Attempting to insert customer:', customerData);

      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Customer saved successfully:', data);

      setFormData({
        company_name: '',
        company_address: '',
        company_tel: '',
        company_email: '',
        city: '',
        country: '',
        contact_person: '',
        contact_email: '',
      });

      onSuccess();
    } catch (err: any) {
      console.error('Error saving customer:', err);
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-3">
      <h2 className="text-lg font-bold text-slate-800 mb-3">Add New Customer</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-xs mb-3">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="border-l-2 border-teal-500 pl-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            Company Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="md:col-span-2">
              <label htmlFor="company_name" className="block text-xs font-medium text-slate-700 mb-1">
                Company Name *
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="Acme Corporation"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="company_address" className="block text-xs font-medium text-slate-700 mb-1">
                Company Address
              </label>
              <textarea
                id="company_address"
                name="company_address"
                value={formData.company_address}
                onChange={handleChange}
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="123 Business Street"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-xs font-medium text-slate-700 mb-1">
                City
              </label>
              <CityAutocomplete
                value={formData.city}
                country={formData.country}
                onChange={handleCityChange}
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-xs font-medium text-slate-700 mb-1">
                Country
                <span className="text-xs text-slate-500 ml-2">(auto-filled from city)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="country"
                  name="country"
                  type="text"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="United States"
                />
              </div>
            </div>

            <div>
              <label htmlFor="company_tel" className="block text-xs font-medium text-slate-700 mb-1">
                Telephone
              </label>
              <div className="relative">
                <Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="company_tel"
                  name="company_tel"
                  type="tel"
                  value={formData.company_tel}
                  onChange={handleChange}
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label htmlFor="company_email" className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="company_email"
                  name="company_email"
                  type="email"
                  value={formData.company_email}
                  onChange={handleChange}
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="info@company.com"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-l-2 border-emerald-500 pl-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-600" />
            Contact Person
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label htmlFor="contact_person" className="block text-xs font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                id="contact_person"
                name="contact_person"
                type="text"
                value={formData.contact_person}
                onChange={handleChange}
                className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="contact_email" className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  className="w-full pl-8 pr-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="john@company.com"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium rounded transition-all shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Customer'}
        </button>
      </div>
    </form>
  );
}
