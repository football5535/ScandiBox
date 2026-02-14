import React, { useState, useEffect } from 'react';
import { SUBSCRIPTION_PLANS } from '../constants';
import { SubscriptionTier } from '../types';
import { stripeService } from '../services/stripeService';
import { userService } from '../services/supabaseService';
import { Check, ShieldCheck, Star, Loader2, AlertTriangle } from 'lucide-react';

const Settings: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>(SubscriptionTier.Free);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profile = await userService.getProfile();
    if (profile) {
        setCurrentPlan(profile.subscriptionTier);
    }
  };

  const handleSubscribe = async (plan: typeof SUBSCRIPTION_PLANS[0]) => {
      if (plan.tier === currentPlan) return;
      
      // 1. Validate Price ID Configuration
      if (!plan.priceId) {
          alert(`Configuration Missing: The ${plan.name} plan is currently unavailable (Missing Price ID).`);
          return;
      }

      setLoadingPriceId(plan.priceId);

      try {
          await stripeService.checkout(plan.priceId);
      } catch (error: any) {
          console.error("Subscription Error:", error);
          
          let userMessage = error.message;
          
          // Provide more helpful context for known configuration errors
          if (error.message.includes("No such price")) {
              userMessage = `Stripe Configuration Error: The Price ID '${plan.priceId}' does not exist in your Stripe account.`;
              if (plan.priceId.startsWith('prod_')) {
                  userMessage += "\n\nTip: You are using a Product ID (prod_...). You must use a Price ID (starts with price_...)";
              }
          } else if (error.message.includes("Invalid API Key")) {
              userMessage = "Payment System Configuration Error (Invalid API Key). Please check the Secret Key in the backend function.";
          }

          alert(`Payment Failed: ${userMessage}`);
      } finally {
          setLoadingPriceId(null);
      }
  };

  return (
    <div className="max-w-5xl mx-auto pt-2 pb-20 animate-fade-in">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-brand-900 tracking-tight">Your Plan</h2>
        <p className="text-gray-500 mt-2 md:mt-3 text-base md:text-lg font-medium">Invest in your kitchen intelligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.tier;
          const isPro = plan.tier === SubscriptionTier.Pro;
          const isLoading = loadingPriceId === plan.priceId;

          return (
            <div 
                key={plan.tier} 
                className={`relative flex flex-col p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] transition-all duration-300 ${
                    isPro 
                    ? 'bg-brand-900 text-white shadow-2xl shadow-brand-900/20 z-10 scale-105 md:scale-110 border-4 border-white ring-4 ring-brand-100' 
                    : 'bg-white text-brand-900 border border-brand-50'
                }`}
            >
                {isPro && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                        <div className="bg-teal-400 text-brand-900 px-4 py-1.5 rounded-full shadow-lg font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                            <Star size={12} fill="currentColor" /> Recommended
                        </div>
                    </div>
                )}
                
                <div className="mb-6">
                    <h3 className="text-lg md:text-xl font-bold mb-2 opacity-90">{plan.name}</h3>
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
                                isPro ? 'bg-teal-400 text-brand-900' : 'bg-brand-100 text-brand-600'
                            }`}>
                                <Check size={10} strokeWidth={4} />
                            </div>
                            <span className="opacity-90">{feature}</span>
                        </li>
                    ))}
                </ul>

                <button 
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrent || isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        isCurrent
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : isPro
                            ? 'bg-white text-brand-900 hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-brand-50 text-brand-900 hover:bg-brand-100 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : isCurrent ? (
                        <>
                            <Check size={18} /> Current Plan
                        </>
                    ) : (
                        `Select ${plan.name}`
                    )}
                </button>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 md:mt-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2 text-sm font-medium">
         <div className="flex items-center gap-2">
             <ShieldCheck size={16} />
             Secure payment by Stripe
         </div>
      </div>
    </div>
  );
};

export default Settings;