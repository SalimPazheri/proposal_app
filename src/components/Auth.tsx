import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, UserPlus, X, User, Phone, Globe } from 'lucide-react';
import LandingPage from './LandingPage';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, {
          userName,
          mobileNo,
          country
        });

        if (error) {
          setError(error.message);
        } else {
          setError('Account created successfully! You can now sign in.');
          setIsSignUp(false);
          setEmail('');
          setPassword('');
          setUserName('');
          setMobileNo('');
          setCountry('');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <LandingPage />

      <div className="fixed top-6 right-6 z-10 flex gap-3">
        <button
          onClick={() => {
            setIsSignUp(false);
            setShowAuthModal(true);
            setError('');
            setEmail('');
            setPassword('');
            setUserName('');
            setMobileNo('');
            setCountry('');
          }}
          className="px-6 py-2.5 bg-white text-teal-600 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all border-2 border-teal-600 hover:bg-teal-50"
        >
          Login
        </button>
        <button
          onClick={() => {
            setIsSignUp(true);
            setShowAuthModal(true);
            setError('');
            setEmail('');
            setPassword('');
            setUserName('');
            setMobileNo('');
            setCountry('');
          }}
          className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          Get Started
        </button>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-2xl p-6 border border-teal-100 relative">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setError('');
                }}
                aria-label="Close"
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-full mb-3">
                  {isSignUp ? <UserPlus className="w-6 h-6 text-white" /> : <LogIn className="w-6 h-6 text-white" />}
                </div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h1>
                <p className="text-sm text-slate-600 mt-2">
                  {isSignUp ? 'Create an account to manage your freight business' : 'Sign in to manage your freight business'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label htmlFor="userName" className="block text-sm font-medium text-slate-700 mb-1.5">
                      User Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="userName"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label htmlFor="mobileNo" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Mobile No.
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="mobileNo"
                        type="tel"
                        value={mobileNo}
                        onChange={(e) => setMobileNo(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                )}

                {isSignUp && (
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Country
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="country"
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                        placeholder="United States"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className={`${error.includes('successfully') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg text-sm`}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-3 text-sm rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}