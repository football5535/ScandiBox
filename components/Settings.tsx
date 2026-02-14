import React, { useState, useEffect } from 'react';
import { SUBSCRIPTION_PLANS } from '../constants';
import { SubscriptionTier } from '../types';
import { stripeService } from '../services/stripeService';
import { userService } from '../services/supabaseService';
import { Check, ShieldCheck, Loader2 } from 'lucide-react';

const Settings: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>(SubscriptionTier.Free);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profile = await userService.getProfile();
    if (profile) setCurrentPlan(profile.subscriptionTier);
  };

  const handleSubscribe = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
      if (plan.tier === currentPlan) return;
      if (!plan.priceId) {
          alert(`Configuration Error: Missing Price ID for ${plan.name}.`);
          return;
      }
      setLoadingPriceId(plan.priceId);
      try {
          await stripeService.checkout(plan.priceId);
      } catch (error: any) {
          alert(`Payment Failed: ${error.message}`);
      } finally {
          setLoadingPriceId(null);
      }
  };

  return (
    <div className="max-w-5xl mx-auto pt-4 pb-20 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-brand-900 font-mono tracking-tight uppercase">
            PLAN STATUS: <span className="bg-brand-900 text-white px-2 py-1">{currentPlan}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.tier;
          const isPro = plan.tier === SubscriptionTier.Pro;
          const isLoading = loadingPriceId === plan.priceId;

          return (
            <div 
                key={plan.tier} 
                className={`glass-panel p-8 rounded-xl flex flex-col transition-all duration-300 relative ${
                    isPro ? 'border-brand-900 shadow-xl transform md:-translate-y-4' : 'border-white/40'
                }`}
            >
                {isPro && (
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded">
                       Most Popular
                   </div>
                )}

                <div className="mb-6">
                    <h3 className="text-lg font-bold text-brand-900 uppercase tracking-widest mb-2">{plan.name}</h3>
                    <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-brand-900 font-mono">{plan.price}</span>
                        <span className="text-xs font-bold text-brand-500 ml-1">kr/mo</span>
                    </div>
                    <p className="text-xs text-brand-500 mt-4 leading-relaxed h-8">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-xs font-bold text-brand-800">
                            <Check size={14} className="mr-2 text-brand-900 flex-shrink-0" strokeWidth={3} />
                            {feature}
                        </li>
                    ))}
                </ul>

                <button 
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrent || isLoading}
                    className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all border ${
                        isCurrent
                        ? 'bg-green-100 text-green-800 border-green-200 cursor-default'
                        : isPro
                            ? 'bg-brand-900 text-white border-brand-900 hover:bg-black'
                            : 'bg-transparent text-brand-900 border-brand-300 hover:bg-white'
                    }`}
                >
                    {isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : isCurrent ? 'Active Plan' : `Select ${plan.name}`}
                </button>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 text-center text-brand-400 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2">
         <ShieldCheck size={14} /> Encrypted Transaction via Stripe
      </div>
    </div>
  );
};

export default Settings;