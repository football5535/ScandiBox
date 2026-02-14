import React, { useState, useEffect } from 'react';
import { InventoryItem, Recipe, SubscriptionTier, UserProfile } from '../types';
import { geminiService } from '../services/geminiService';
import { ChefHat, Clock, Sparkles, ChevronDown, ChevronUp, Zap, Lock, Printer } from 'lucide-react';
import { userService } from '../services/supabaseService';

interface MealPlannerProps {
  inventory: InventoryItem[];
}

const MealPlanner: React.FC<MealPlannerProps> = ({ inventory }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    userService.getProfile().then(p => { if(p) setUserProfile(p); });
  }, []);

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

  return (
    <div className="space-y-8 animate-fade-in pt-4">
       <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-3xl font-bold text-brand-900 tracking-tight font-mono">MEAL_OS</h2>
            {isPro && userProfile && (
                <p className="text-xs text-brand-500 mt-1 font-bold font-mono uppercase">
                    Config: {userProfile.preferences.householdSize} PAX | {userProfile.familyName || 'HOUSEHOLD'}
                </p>
            )}
        </div>
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
          {isLoading ? 'GENERATING...' : isPro ? 'GENERATE PLAN' : 'LOCKED (PRO)'}
        </button>
      </div>

      {recipes.length === 0 && !isLoading && (
        <div className="glass-panel rounded-2xl border-dashed border-2 border-brand-300 p-20 text-center">
            <ChefHat className="text-brand-300 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-brand-900 font-mono">SYSTEM READY</h3>
            <p className="text-brand-500 mt-2 text-sm">Awaiting command to generate culinary manifest.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <div key={recipe.id} className="glass-card rounded-xl overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded border border-green-200 uppercase tracking-widest">
                        {recipe.matchScore}% Match
                    </span>
                    <span className="flex items-center text-brand-400 text-[10px] font-bold uppercase tracking-widest">
                        <Clock size={12} className="mr-1" /> {recipe.timeEstimate}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-brand-900 mb-2 font-mono leading-tight uppercase">{recipe.title}</h3>
                <p className="text-brand-600 text-xs mb-4 leading-relaxed border-b border-brand-100 pb-4">{recipe.description}</p>
                
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Components</p>
                    <div className="flex flex-wrap gap-1">
                        {recipe.ingredients.slice(0, 3).map((ing, i) => (
                            <span key={i} className="text-[10px] bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded">{ing}</span>
                        ))}
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => toggleExpand(recipe.id)}
                className="w-full py-3 bg-brand-50 hover:bg-brand-100 transition-colors flex items-center justify-center text-xs font-bold text-brand-900 uppercase tracking-widest border-t border-brand-200"
            >
                {expandedRecipe === recipe.id ? 'Close File' : 'View Instructions'}
                {expandedRecipe === recipe.id ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
            </button>
            
            {expandedRecipe === recipe.id && (
                <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-brand-200 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                         <h4 className="font-bold text-brand-900 uppercase tracking-widest text-xs">Sequence</h4>
                         <Printer size={14} className="text-brand-400 cursor-pointer hover:text-brand-900" />
                    </div>
                    <ol className="list-decimal list-outside ml-4 space-y-2 text-xs text-brand-800 font-mono">
                        {recipe.instructions.map((step, idx) => (
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