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
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: window.location.origin }
            });
            if (error) throw error;
            onSuccess();
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
        
        <div className="mb-8 text-center animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-4 relative bg-white rounded-xl p-2 shadow-lg">
                 <img src={APP_LOGO_URL} alt="ScandiBox" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-mono font-bold tracking-tight text-brand-900 mb-1">SCANDIBOX_OS</h1>
        </div>

        <div className="w-full max-w-sm glass-panel p-8 rounded-2xl">
            <div className="text-center mb-6">
                <h2 className="text-lg font-bold uppercase tracking-widest text-brand-900">
                    {isLogin ? 'Authentication' : 'Registration'}
                </h2>
            </div>

            {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 rounded border border-red-200 text-xs font-mono">
                    ERROR: {error}
                </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Identity</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 bg-white/50 border border-white/60 focus:bg-white focus:border-brand-900 rounded-lg focus:outline-none transition-all text-brand-900 font-bold font-mono text-sm"
                            placeholder="user@domain.com"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Key</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 bg-white/50 border border-white/60 focus:bg-white focus:border-brand-900 rounded-lg focus:outline-none transition-all text-brand-900 font-bold font-mono text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3 mt-4 bg-brand-900 hover:bg-black text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : (
                        <>
                            {isLogin ? 'Access System' : 'Create Record'}
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center pt-4 border-t border-brand-200/50">
                <button 
                    onClick={() => setIsLogin(!isLogin)} 
                    className="text-brand-600 text-xs font-bold font-mono hover:text-brand-900 underline decoration-dotted"
                >
                    {isLogin ? 'Initialize New Account' : 'Return to Login'}
                </button>
            </div>
        </div>
    </div>
  );
};