import { Link } from "react-router-dom";
import { Shield, Users, TrendingUp, Eye, ArrowRight, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-indigo-100 dark:border-indigo-900">
              <Shield className="text-brand-primary" size={28} />
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                FUNDEX
              </h1>
            </div>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transparent Funding & Accountability System for NGOs
          </p>
          <p className="text-base text-gray-500 dark:text-gray-400 mt-3 max-w-xl mx-auto">
            Empowering social impact through blockchain-verified transparency and real-time fund tracking
          </p>
        </header>

        {/* Role Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Admin Card */}
          <div className="group relative animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="text-white" size={32} />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Admin Portal
              </h3>

              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Manage campaigns, approve funding requests, and review expenses with AI-powered fraud detection
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Campaign Management
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Fund Allocation
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Expense Verification
                </li>
              </ul>

              <Link
                to="/login?role=admin"
                className="group/btn flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-xl"
              >
                Admin Login
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Volunteer Card */}
          <div className="group relative animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:border-green-300 dark:hover:border-green-600 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="text-white" size={32} />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Volunteer Hub
              </h3>

              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Submit tasks, upload expense receipts, and track your approved funding in real-time
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Task Submission
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Receipt Upload
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Fund Tracking
                </li>
              </ul>

              <Link
                to="/login?role=volunteer"
                className="group/btn flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-xl"
              >
                Volunteer Login
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Donor Card */}
          <div className="group relative animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="text-white" size={32} />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Donor Portal
              </h3>

              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Discover campaigns, track donations, and view detailed impact reports with proof
              </p>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Campaign Discovery
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Donation Tracking
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Impact Reports
                </li>
              </ul>

              <Link
                to="/login?role=donor"
                className="group/btn flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-xl"
              >
                Donor Login
                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Transparency Section */}
        <div className="max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-10 shadow-xl border border-gray-100 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Eye className="text-white" size={40} />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    Complete Transparency
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    Track every rupee from donation to impact. View verified receipts, expense breakdowns, and real-time fund utilization.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <span className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-semibold">
                      AI Fraud Detection
                    </span>
                    <span className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-semibold">
                      Real-time Updates
                    </span>
                    <span className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-semibold">
                      Verified Receipts
                    </span>
                  </div>
                </div>

                <Link
                  to="/transparency"
                  className="group/btn flex items-center gap-2 py-3 px-8 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-xl whitespace-nowrap"
                >
                  View Transparency
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto mt-16 animate-fade-in" style={{ animationDelay: '500ms' }}>
          {[
            { icon: Shield, title: "Secure", desc: "Bank-grade security" },
            { icon: Eye, title: "Transparent", desc: "Full visibility" },
            { icon: TrendingUp, title: "Efficient", desc: "Real-time tracking" },
            { icon: CheckCircle, title: "Verified", desc: "AI-powered checks" }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700 hover:-translate-y-1">
              <feature.icon className="text-brand-primary mb-3" size={32} />
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">{feature.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
