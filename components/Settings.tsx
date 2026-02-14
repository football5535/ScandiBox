import React from 'react';
import { SUBSCRIPTION_PLANS } from '../constants';
import { SubscriptionTier } from '../types';
import { stripeService } from '../services/stripeService';
import { Check, ShieldCheck, CreditCard, Star } from 'lucide-react';

const Settings: React.FC = () => {
  const currentPlan = SubscriptionTier.Free;

  const handleSubscribe = async (tier: string, priceId?: string) => {
      if (!priceId) {
          alert("This plan is free or not configured.");
          return;
      }
      await stripeService.checkout(priceId);
  };

  return (
    <div className="max-w-5xl mx-auto pt-2 pb-20">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-900 tracking-tight">Your Plan</h2>
        <p className="text-gray-500 mt-2 md:mt-3 text-base md:text-lg font-medium">Invest in your kitchen intelligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div 
            key={plan.tier} 
            className={`relative flex flex-col p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-300 ${
                plan.tier === SubscriptionTier.Pro 
                ? 'bg-brand-900 text-white shadow-2xl shadow-brand-900/20 z-10' 
                : 'bg-white text-brand-900 border border-brand-50'
            }`}
          >
            {plan.tier === SubscriptionTier.Pro && (
                <div className="absolute top-0 right-0 p-4">
                    <div className="bg-teal-400 text-brand-900 p-2 rounded-full shadow-lg">
                        <Star size={16} fill="currentColor" />
                    </div>
                </div>
            )}
            
            <div className="mb-6">
                <h3 className="text-lg md:text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline">
                    <span className="text-3xl md:text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className={`ml-1 text-sm font-bold opacity-60`}>kr/mo</span>
                </div>
                <p className="text-sm font-medium opacity-60 mt-4 leading-relaxed h-auto md:h-10">{plan.description}</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm font-semibold">
                        <div className={`mr-3 mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                             plan.tier === SubscriptionTier.Pro ? 'bg-teal-400 text-brand-900' : 'bg-brand-100 text-brand-600'
                        }`}>
                            <Check size={10} strokeWidth={4} />
                        </div>
                        <span className="opacity-90">{feature}</span>
                    </li>
                ))}
            </ul>

            <button 
                onClick={() => handleSubscribe(plan.name, plan.priceId)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    plan.tier === SubscriptionTier.Pro
                    ? 'bg-white text-brand-900'
                    : 'bg-brand-50 text-brand-900 hover:bg-brand-100'
                }`}
            >
                {currentPlan === plan.tier ? 'Current Plan' : `Select ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-8 md:mt-12 text-center text-gray-300 flex items-center justify-center gap-2 text-sm font-medium">
         <ShieldCheck size={16} />
         Secure payment by Stripe
      </div>
    </div>
  );
};

export default Settings;