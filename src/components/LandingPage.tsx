import { Truck, Globe, FileText, Shield, TrendingUp, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-600 to-emerald-600 rounded-full mb-6">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-slate-800 mb-4">
            Freight Management System
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Streamline your logistics operations with our comprehensive freight management platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Global Reach</h3>
            <p className="text-sm text-slate-600">
              Manage international shipments across multiple countries with ease and efficiency
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Smart Proposals</h3>
            <p className="text-sm text-slate-600">
              Create detailed freight proposals with automated calculations and professional formatting
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Customer Management</h3>
            <p className="text-sm text-slate-600">
              Keep track of all your customers and their shipping requirements in one place
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Secure & Reliable</h3>
            <p className="text-sm text-slate-600">
              Enterprise-grade security with role-based access control and data encryption
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Real-time Updates</h3>
            <p className="text-sm text-slate-600">
              Stay informed with live updates on shipments, proposals, and customer interactions
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
              <Truck className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Multiple Transport Modes</h3>
            <p className="text-sm text-slate-600">
              Support for air, sea, and land freight with specialized tools for each mode
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto border border-teal-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              Ready to transform your freight operations?
            </h2>
            <p className="text-slate-600 mb-6">
              Join hundreds of logistics companies managing their shipments efficiently
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600">500+</div>
                <div className="text-sm text-slate-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">10K+</div>
                <div className="text-sm text-slate-600">Proposals Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-600">50+</div>
                <div className="text-sm text-slate-600">Countries Served</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
