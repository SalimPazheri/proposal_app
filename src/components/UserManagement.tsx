import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Trash2, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  country: string | null;
  is_admin: boolean;
  created_at: string;
}

interface Country {
  id: string;
  name: string;
  code: string;
  currency_code: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    country: '',
    is_admin: false,
  });

  useEffect(() => {
    fetchUsers();
    fetchCountries();

    const subscription = supabase
      .channel('user_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id, name, code, currency_code')
        .order('name');

      if (error) throw error;
      setCountries(data || []);
    } catch (err: any) {
      console.error('Error fetching countries:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.is_admin && !formData.country) {
      setError('Country is required for regular users');
      return;
    }

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            country: formData.is_admin ? null : formData.country,
            is_admin: formData.is_admin,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            country: formData.is_admin ? null : formData.country,
            is_admin: formData.is_admin,
          });

        if (profileError) throw profileError;

        setSuccess(`User ${formData.email} created successfully!`);
        setFormData({ email: '', password: '', country: '', is_admin: false });
        setShowForm(false);
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      setSuccess(`User ${email} deleted successfully!`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg"
        >
          <UserPlus size={20} />
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Create New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_admin"
                checked={formData.is_admin}
                onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <label htmlFor="is_admin" className="text-sm font-medium text-gray-700">
                Admin User (can see all data and manage users)
              </label>
            </div>

            {!formData.is_admin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required={!formData.is_admin}
                >
                  <option value="">Select a country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">User's assigned country for data access</p>
              </div>
            )}

            {formData.is_admin && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <p className="text-sm text-teal-800">Admin users can access data from all countries and manage users.</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg font-medium"
            >
              Create User
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No users found. Create your first user to get started.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.country ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        {user.country}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        All Countries
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.is_admin ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
