
import React, { useState, useEffect } from 'react';
import { SUBSCRIPTION_PLANS } from '../constants';
import { SubscriptionTier } from '../types';
import { stripeService } from '../services/stripeService';
import { userService } from '../services/supabaseService';
import { Check, ShieldCheck, Loader2, AlertTriangle, XCircle, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [currentPlan, setCurrentPlan] = useState<SubscriptionTier>(SubscriptionTier.Free);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleCancel = async () => {
      if (!window.confirm("WARNING: Cancelling will immediately revert your account to the Free tier. You will lose access to Pro features. Are you sure?")) {
          return;
      }

      setIsCancelling(true);
      try {
          await stripeService.cancelSubscription();
          await userService.updateProfile({ });
          await userService.upgradeDemoTier(SubscriptionTier.Free);
          setCurrentPlan(SubscriptionTier.Free);
          alert("Subscription terminated. Account reverted to Free plan.");
      } catch (error: any) {
          alert(`Cancellation Failed: ${error.message}`);
      } finally {
          setIsCancelling(false);
      }
  };

  return (
    <div className="max-w-5xl mx-auto pt-4 pb-20 animate-fade-in">
      
      {/* LANGUAGE SELECTOR */}
      <div className="glass-panel p-6 rounded-2xl mb-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <Globe className="text-brand-900" />
             <h3 className="font-bold text-brand-900 font-mono uppercase tracking-widest">{t('settings.language')}</h3>
         </div>
         <div className="flex gap-2">
             <button 
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-widest transition-all ${language === 'en' ? 'bg-brand-900 text-white' : 'bg-white/50 text-brand-500'}`}
             >
                 English
             </button>
             <button 
                onClick={() => setLanguage('no')}
                className={`px-4 py-2 rounded font-bold text-xs uppercase tracking-widest transition-all ${language === 'no' ? 'bg-brand-900 text-white' : 'bg-white/50 text-brand-500'}`}
             >
                 Norsk
             </button>
         </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-3xl font-bold text-brand-900 font-mono tracking-tight uppercase">
                {t('settings.status')}: <span className="bg-brand-900 text-white px-2 py-1">{currentPlan}</span>
            </h2>
            <p className="text-xs text-brand-500 font-mono mt-2 uppercase tracking-widest">
                {currentPlan === SubscriptionTier.Free ? t('settings.basic') : t('settings.premium')}
            </p>
        </div>
        {currentPlan !== SubscriptionTier.Free && (
            <button 
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all font-bold uppercase text-xs tracking-widest"
            >
                {isCancelling ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                {isCancelling ? t('settings.terminating') : t('settings.cancel')}
            </button>
        )}
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
                } ${isCurrent ? 'ring-2 ring-brand-900 ring-offset-2 ring-offset-[#cbd5e1]' : ''}`}
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

                {isCurrent ? (
                    <div className="w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest text-center bg-green-100 text-green-800 border border-green-200 cursor-default flex items-center justify-center gap-2">
                        <Check size={14} /> {t('settings.active')}
                    </div>
                ) : (
                    <button 
                        onClick={() => handleSubscribe(plan)}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all border ${
                            isPro
                                ? 'bg-brand-900 text-white border-brand-900 hover:bg-black'
                                : 'bg-transparent text-brand-900 border-brand-300 hover:bg-white'
                        }`}
                    >
                        {isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : `${t('settings.select')} ${plan.name}`}
                    </button>
                )}
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
