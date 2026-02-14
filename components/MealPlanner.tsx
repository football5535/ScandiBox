import React, { useState, useEffect } from 'react';
import { InventoryItem, Recipe, SubscriptionTier } from '../types';
import { geminiService } from '../services/geminiService';
import { ChefHat, Clock, Sparkles, ChevronDown, ChevronUp, Zap, Lock } from 'lucide-react';
import { userService } from '../services/supabaseService';

interface MealPlannerProps {
  inventory: InventoryItem[];
}

const MealPlanner: React.FC<MealPlannerProps> = ({ inventory }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<SubscriptionTier>(SubscriptionTier.Free);

  useEffect(() => {
    userService.getProfile().then(p => {
        if(p) setUserTier(p.subscriptionTier);
    });
  }, []);

  const generateSuggestions = async () => {
    if (userTier === SubscriptionTier.Free || userTier === SubscriptionTier.Standard) {
        alert("AI Meal Planning is a Pro feature. Please upgrade to unlock personalized recipes.");
        return;
    }

    if (inventory.length === 0) {
        alert("Inventory Empty. Please add items first.");
        return;
    }
    setIsLoading(true);
    try {
      const suggestions = await geminiService.suggestRecipes(inventory);
      setRecipes(suggestions);
    } catch (e) {
      alert("AI Processing Error.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
      setExpandedRecipe(expandedRecipe === id ? null : id);
  }

  const isPro = userTier === SubscriptionTier.Pro || userTier === SubscriptionTier.ProMax;

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in pt-2">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
        <div>
            <h2 className="text-4xl md:text-5xl font-bold text-brand-900 tracking-tight">Meal OS</h2>
            <p className="text-brand-500 mt-2 md:mt-3 font-bold text-base md:text-lg">AI-powered culinary suggestions.</p>
        </div>
        <button
          onClick={generateSuggestions}
          disabled={isLoading}
          className={`w-full md:w-auto flex items-center justify-center px-6 md:px-8 py-4 md:py-5 font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] ${
             isPro 
             ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-brand-600/30 hover:shadow-xl hover:scale-[1.02]'
             : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? <Zap className="animate-spin mr-3 fill-current" size={20} /> : isPro ? <Sparkles className="mr-3 fill-current" size={20} /> : <Lock className="mr-3" size={18} />}
          {isLoading ? 'Cheffing...' : isPro ? 'Generate Meal Plan' : 'Unlock Meal Plans'}
        </button>
      </div>

      {recipes.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-24 md:py-40 bg-white rounded-[2.5rem] md:rounded-[3rem] border border-brand-50 shadow-sm text-center px-6">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-brand-50 rounded-full flex items-center justify-center mb-6 md:mb-8">
                <ChefHat className="text-brand-300" size={40} />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-brand-900 mb-3">Ready to Cook?</h3>
            <p className="text-gray-400 max-w-md font-medium text-base md:text-lg">Our AI chef is ready to analyze your inventory and create the perfect menu for you.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        {recipes.map(recipe => (
          <div key={recipe.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-soft border border-brand-50 overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-6 md:p-10 flex-1">
                <div className="flex justify-between items-start mb-6 md:mb-8">
                    <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-green-100 uppercase tracking-wider">
                        {recipe.matchScore}% Match
                    </span>
                    <span className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <Clock size={14} className="mr-1.5" /> {recipe.timeEstimate}
                    </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-brand-900 mb-3 md:mb-4 leading-tight">{recipe.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-3 mb-6 md:mb-8 font-medium leading-relaxed">{recipe.description}</p>
                
                <div className="space-y-3 md:space-y-4">
                    <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Key Ingredients</p>
                    <div className="flex flex-wrap gap-2">
                        {recipe.ingredients.slice(0, 3).map((ing, i) => (
                            <span key={i} className="text-xs bg-brand-50 text-brand-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold">{ing}</span>
                        ))}
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => toggleExpand(recipe.id)}
                className="w-full py-4 md:py-5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center text-sm font-bold text-brand-900 border-t border-gray-100 uppercase tracking-widest"
            >
                {expandedRecipe === recipe.id ? 'Hide Recipe' : 'View Full Recipe'}
                {expandedRecipe === recipe.id ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
            </button>
            
            {expandedRecipe === recipe.id && (
                <div className="p-6 md:p-10 bg-brand-50/30 border-t border-brand-100 animate-fade-in">
                    <h4 className="font-bold text-brand-900 mb-4 md:mb-6 uppercase tracking-widest text-sm">Instructions</h4>
                    <ol className="list-decimal list-outside ml-5 space-y-3 md:space-y-4 text-sm text-brand-800 font-medium">
                        {recipe.instructions.map((step, idx) => (
                            <li key={idx} className="leading-loose pl-2 marker:text-brand-400 marker:font-bold">{step}</li>
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