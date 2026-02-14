
import React, { useState, useEffect } from 'react';
import { InventoryItem, Recipe, SubscriptionTier, UserProfile } from '../types';
import { geminiService } from '../services/geminiService';
import { userService, recipeService } from '../services/supabaseService';
import { ChefHat, Clock, Sparkles, ChevronDown, ChevronUp, Zap, Lock, Printer, Bookmark } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MealPlannerProps {
  inventory: InventoryItem[];
}

const MealPlanner: React.FC<MealPlannerProps> = ({ inventory }) => {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');

  useEffect(() => {
    userService.getProfile().then(p => { if(p) setUserProfile(p); });
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
      const saved = await recipeService.getSavedRecipes();
      setSavedRecipes(saved);
  };

  const generateSuggestions = async () => {
    const tier = userProfile?.subscriptionTier || SubscriptionTier.Free;
    if (tier === SubscriptionTier.Free || tier === SubscriptionTier.Standard) {
        alert("Upgrade to Pro to generate meal plans.");
        return;
    }
    if (inventory.length === 0) {
        alert("Inventory Empty.");
        return;
    }
    setIsLoading(true);
    try {
      const suggestions = await geminiService.suggestRecipes(
          inventory, 
          userProfile?.preferences.householdSize || 1,
          userProfile?.preferences.dietaryRestrictions || []
      );
      setRecipes(suggestions);
    } catch (e) {
      alert("AI Processing Error.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => setExpandedRecipe(expandedRecipe === id ? null : id);
  const isPro = userProfile?.subscriptionTier === SubscriptionTier.Pro || userProfile?.subscriptionTier === SubscriptionTier.ProMax;

  // Determine which list to show
  const displayRecipes = activeTab === 'generate' ? recipes : savedRecipes;

  return (
    <div className="space-y-6 animate-fade-in pt-4">
       <div className="glass-panel p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
            <div>
                <h2 className="text-3xl font-bold text-brand-900 tracking-tight font-mono">{t('mealPlanner.title')}</h2>
                {isPro && userProfile && (
                    <p className="text-xs text-brand-500 mt-1 font-bold font-mono uppercase">
                        {t('mealPlanner.config')}: {userProfile.preferences.householdSize} PAX | {userProfile.familyName || 'HOUSEHOLD'}
                    </p>
                )}
            </div>
            {activeTab === 'generate' && (
                <button
                onClick={generateSuggestions}
                disabled={isLoading}
                className={`flex items-center px-6 py-3 font-bold rounded-lg transition-all border ${
                    isPro 
                    ? 'bg-brand-900 text-white border-brand-900 hover:bg-black'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
                >
                {isLoading ? <Zap className="animate-spin mr-2" size={16} /> : isPro ? <Sparkles className="mr-2" size={16} /> : <Lock className="mr-2" size={16} />}
                {isLoading ? t('mealPlanner.generating') : isPro ? t('mealPlanner.generate') : t('mealPlanner.locked')}
                </button>
            )}
          </div>
          
          <div className="flex p-1 bg-white/50 rounded-xl border border-white/40">
              <button 
                onClick={() => setActiveTab('generate')}
                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    activeTab === 'generate' 
                    ? 'bg-brand-900 text-white shadow-lg' 
                    : 'text-brand-500 hover:bg-white/50'
                }`}
              >
                  {t('mealPlanner.tabs.generate')}
              </button>
              <button 
                onClick={() => { setActiveTab('saved'); loadSavedRecipes(); }}
                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    activeTab === 'saved' 
                    ? 'bg-brand-900 text-white shadow-lg' 
                    : 'text-brand-500 hover:bg-white/50'
                }`}
              >
                  {t('mealPlanner.tabs.saved')}
              </button>
          </div>
       </div>


      {displayRecipes.length === 0 && !isLoading && (
        <div className="glass-panel rounded-2xl border-dashed border-2 border-brand-300 p-20 text-center">
            {activeTab === 'generate' ? (
                <>
                    <ChefHat className="text-brand-300 mx-auto mb-4" size={48} />
                    <h3 className="text-xl font-bold text-brand-900 font-mono">{t('mealPlanner.systemReady')}</h3>
                    <p className="text-brand-500 mt-2 text-sm">{t('mealPlanner.awaitingCommand')}</p>
                </>
            ) : (
                <>
                    <Bookmark className="text-brand-300 mx-auto mb-4" size={48} />
                    <h3 className="text-xl font-bold text-brand-900 font-mono">COOKBOOK EMPTY</h3>
                    <p className="text-brand-500 mt-2 text-sm">{t('mealPlanner.noSaved')}</p>
                </>
            )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayRecipes.map(recipe => (
          <div key={recipe.id} className="glass-card rounded-xl overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                    {recipe.matchScore !== undefined && (
                        <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded border border-green-200 uppercase tracking-widest">
                            {recipe.matchScore}% Match
                        </span>
                    )}
                    <span className="flex items-center text-brand-400 text-[10px] font-bold uppercase tracking-widest">
                        <Clock size={12} className="mr-1" /> {recipe.timeEstimate}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-brand-900 mb-2 font-mono leading-tight uppercase">{recipe.title}</h3>
                <p className="text-brand-600 text-xs mb-4 leading-relaxed border-b border-brand-100 pb-4">{recipe.description}</p>
                
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Components</p>
                    <div className="flex flex-wrap gap-1">
                        {recipe.ingredients && recipe.ingredients.slice(0, 3).map((ing, i) => (
                            <span key={i} className="text-[10px] bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded">{ing}</span>
                        ))}
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => toggleExpand(recipe.id)}
                className="w-full py-3 bg-brand-50 hover:bg-brand-100 transition-colors flex items-center justify-center text-xs font-bold text-brand-900 uppercase tracking-widest border-t border-brand-200"
            >
                {expandedRecipe === recipe.id ? t('explore.closeDetails') : t('explore.viewRecipe')}
                {expandedRecipe === recipe.id ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
            </button>
            
            {expandedRecipe === recipe.id && (
                <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-brand-200 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                         <h4 className="font-bold text-brand-900 uppercase tracking-widest text-xs">{t('mealPlanner.sequence')}</h4>
                         <Printer size={14} className="text-brand-400 cursor-pointer hover:text-brand-900" />
                    </div>
                    <ol className="list-decimal list-outside ml-4 space-y-2 text-xs text-brand-800 font-mono">
                        {recipe.instructions && recipe.instructions.map((step, idx) => (
                            <li key={idx} className="leading-relaxed pl-1">{step}</li>
                        ))}
                    </ol>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealPlanner;
