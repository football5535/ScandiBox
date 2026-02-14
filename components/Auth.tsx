import React, { useState } from 'react';
import { supabase } from '../services/supabaseService';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';

interface AuthProps {
    onSuccess: () => void;
    onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!supabase) {
        setError("System configuration error.");
        setLoading(false);
        return;
    }

    try {
        if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });
            if (error) throw error;
            onSuccess(); // Triggers "Check Mail" view
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 font-sans text-[#003385]">
        
        {/* LOGO SECTION */}
        <div className="mb-12 text-center animate-fade-in">
            <div className="w-32 h-32 mx-auto mb-6 relative">
                 <img src={APP_LOGO_URL} alt="ScandiBox" className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
            <h1 className="text-4xl font-mono font-bold tracking-tight mb-2">ScandiBox</h1>
            <p className="text-gray-400">Intelligent Kitchen OS</p>
        </div>

        <div className="w-full max-w-md bg-white p-10 rounded-[2rem] shadow-2xl border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight mb-1">
                    {isLogin ? 'Welcome back' : 'Get started'}
                </h2>
                <p className="text-sm text-gray-400">
                    {isLogin ? 'Enter your credentials to access your box.' : 'Create a free account to organize your food.'}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center font-medium border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#003385] transition-colors" size={20} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#003385] rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all text-gray-900 font-medium"
                            placeholder="name@example.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#003385] transition-colors" size={20} />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[#003385] rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all text-gray-900 font-medium"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 mt-4 bg-[#003385] hover:bg-[#00255c] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                            {isLogin ? 'Sign In' : 'Create Account'}
                            <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
                <p className="text-gray-400 text-sm font-medium">
                    {isLogin ? "New to ScandiBox?" : "Already have a box?"}
                    <button 
                        onClick={() => setIsLogin(!isLogin)} 
                        className="ml-2 text-[#003385] font-bold hover:underline"
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};