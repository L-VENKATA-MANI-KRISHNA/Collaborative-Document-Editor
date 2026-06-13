// User authentication dialog.

import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { authApi } from '../api/auth';

// User sign-in modal dialog.
const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  /** Handles form submission for both login and registration REST API invocations */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        const data = await authApi.login({ email, password });
        onAuthSuccess(data.user);
        onClose();
      } else {
        await authApi.register({ name, email, password });
        setSuccessMsg('Account created successfully! Please sign in below.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in font-inter select-none">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-neutral-300">
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Header */}
        <div className="bg-neutral-900 p-8 text-white text-center">
          <div className="w-14 h-14 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock size={26} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Edit<span className="font-light text-neutral-400">Nest</span></h2>
          <p className="text-neutral-400 text-xs mt-1">Sign in to sync your edits and collaborate securely.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-neutral-200 bg-neutral-50">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${isLogin ? 'border-neutral-900 text-neutral-900 bg-white shadow-2xs font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${!isLogin ? 'border-neutral-900 text-neutral-900 bg-white shadow-2xs font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4 bg-white">
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-200 flex items-center space-x-2">
              <span>✅ {successMsg}</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200 flex items-center space-x-2">
              <span>⚠️ {error}</span>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">FULL NAME</label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-3 text-neutral-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">EMAIL ADDRESS</label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-3 text-neutral-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">PASSWORD</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3 text-neutral-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium text-sm transition-all shadow-md active:scale-98 flex items-center justify-center space-x-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Account' : 'Complete Registration'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="bg-neutral-100 p-4 text-center text-xs text-neutral-600 border-t border-neutral-200 flex items-center justify-center space-x-1 font-medium">
          <ShieldCheck size={14} className="text-neutral-800" />
          <span>Industry-standard JWT Secure Authentication</span>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;

