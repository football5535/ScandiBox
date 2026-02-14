import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';

const CheckMail: React.FC<{ onBackToLogin: () => void }> = ({ onBackToLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-soft text-center">
        <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-900 mb-4">Check your mail</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
            We've sent a confirmation link to your email address. Please click the link to activate your account.
        </p>
        
        <button 
            onClick={onBackToLogin}
            className="w-full py-4 bg-gray-50 text-brand-900 font-bold rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
            Back to Login <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default CheckMail;