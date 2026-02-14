
import React, { useState, useEffect } from 'react';
import { InventoryItem, Recipe, SubscriptionTier } from '../types';
import { geminiService } from '../services/geminiService';
import { userService, recipeService, shoppingService, plannerService } from '../services/supabaseService';
import { Compass, Flame, ChefHat, Clock, Sparkles, ChevronDown, ChevronUp, Lock, RefreshCw, AlertTriangle, BookmarkPlus, ShoppingCart, Check, CalendarPlus, X, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface RecipeExploreProps {
  inventory: InventoryItem[];
}

const RecipeExplore: React.FC<RecipeExploreProps> = ({ inventory }) => {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'inventory' | 'random'>('inventory');
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<SubscriptionTier>(SubscriptionTier.Free);
  const [dailyGenerations, setDailyGenerations] = useState(0);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  const [addedIngredientsIds, setAddedIngredientsIds] = useState<Set<string>>(new Set());

  // Plan Addition State
  const [isDaySelectorOpen, setIsDaySelectorOpen] = useState(false);
  const [recipeToAddToPlan, setRecipeToAddToPlan] = useState<Recipe | null>(null);

  const DAILY_FREE_LIMIT = 3;

  useEffect(() => {
    checkUserAndLimit();
  }, []);

  const checkUserAndLimit = async () => {
      const profile = await userService.getProfile();
      if (profile) setUserTier(profile.subscriptionTier);

      // Check local daily limit
      const today = new Date().toDateString();
      const usage = JSON.parse(localStorage.getItem('scandibox_explore_usage') || '{}');
      if (usage.date === today) {
          setDailyGenerations(usage.count || 0);
      } else {
          setDailyGenerations(0);
      }
  };

  const incrementLimit = () => {
      const today = new Date().toDateString();
      const newCount = dailyGenerations + 1;
      setDailyGenerations(newCount);
      localStorage.setItem('scandibox_explore_usage', JSON.stringify({ date: today, count: newCount }));
  };

  const generateBatch = async () => {
      if (userTier === SubscriptionTier.Free && dailyGenerations >= DAILY_FREE_LIMIT) {
          alert("You have reached your daily limit for Free creations. Upgrade to Pro for unlimited exploration.");
          return;
      }

      setIsLoading(true);
      try {
          const newRecipes = await geminiService.generateDiscoverRecipes(activeMode, inventory);
          setRecipes(prev => [...newRecipes, ...prev]); // Prepend new ones
          incrementLimit();
      } catch (e) {
          alert("Failed to generate recipes.");
      } finally {
          setIsLoading(false);
      }
  };

  const saveRecipe = async (recipe: Recipe) => {
      try {
          await recipeService.saveRecipe(recipe);
          setSavedRecipeIds(prev => new Set(prev).add(recipe.id));
      } catch (e) {
          alert("Failed to save recipe.");
      }
  };

  // Helper to extract number from string
  const parseQuantity = (str: string): number => {
    const match = str.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 1;
  };

  // Smart Check Logic (Consistent with MealPlanner)
  const checkIngredientAvailability = (recipeIngredient: string): boolean => {
      const recName = recipeIngredient.toLowerCase();
      const recQty = parseQuantity(recName);

      const matches = inventory.filter(item => {
          const invName = item.name.toLowerCase();
          return invName.includes(recName.replace(/[0-9]/g, '').trim()) || 
                 recName.includes(invName) ||
                 (invName.includes("oil") && recName.includes("oil")); 
      });

      if (matches.length === 0) return false;

      let totalInvQty = 0;
      matches.forEach(m => {
          totalInvQty += parseQuantity(m.quantity);
      });

      return totalInvQty >= recQty;
  };

  const addMissingIngredients = async (recipe: Recipe) => {
      const missingIngredients = recipe.ingredients.filter(ing => !checkIngredientAvailability(ing));

      const foundCount = recipe.ingredients.length - missingIngredients.length;
      
      if (missingIngredients.length === 0) {
          alert(t('explore.smartAddResult').replace('{found}', recipe.ingredients.length.toString()).replace('{added}', '0'));
          setAddedIngredientsIds(prev => new Set(prev).add(recipe.id));
          return;
      }

      for (const ing of missingIngredients) {
          await shoppingService.addItem(ing);
      }
      
      alert(t('explore.smartAddResult').replace('{found}', foundCount.toString()).replace('{added}', missingIngredients.length.toString()));
      setAddedIngredientsIds(prev => new Set(prev).add(recipe.id));
  };

  const handleAddToPlan = (recipe: Recipe) => {
      setRecipeToAddToPlan(recipe);
      setIsDaySelectorOpen(true);
  };

  const confirmAddToPlan = (day: string) => {
      if (!recipeToAddToPlan) return;
      plannerService.addRecipeToPlan(recipeToAddToPlan, day);
      alert(t('mealPlanner.dayAdded').replace('{day}', t(`days.${day}`)));
      setIsDaySelectorOpen(false);
      setRecipeToAddToPlan(null);
  };

  const toggleExpand = (id: string) => setExpandedRecipe(expandedRecipe === id ? null : id);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6 animate-fade-in pt-4">
      {/* HEADER & CONTROLS */}
      <div className="glass-panel p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h2 className="text-3xl font-bold text-brand-900 font-mono tracking-tight flex items-center gap-2">
                    <Compass className="text-brand-600" /> {t('explore.title')}
                </h2>
                <p className="text-xs text-brand-500 mt-1 font-bold font-mono uppercase tracking-widest">
                    {t('explore.subtitle')}
                </p>
            </div>

            {userTier === SubscriptionTier.Free && (
                <div className="flex items-center gap-2 px-3 py-2 bg-brand-100 rounded-lg border border-brand-200">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-800">
                        {t('explore.dailyCredits')}: {dailyGenerations}/{DAILY_FREE_LIMIT}
                    </div>
                    {dailyGenerations >= DAILY_FREE_LIMIT && <Lock size={12} className="text-brand-500" />}
                </div>
            )}
          </div>

          <div className="flex p-1 bg-white/50 rounded-xl border border-white/40">
              <button 
                onClick={() => setActiveMode('inventory')}
                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    activeMode === 'inventory' 
                    ? 'bg-brand-900 text-white shadow-lg' 
                    : 'text-brand-500 hover:bg-white/50'
                }`}
              >
                  <div className="flex items-center justify-center gap-2">
                    <ChefHat size={16} /> {t('explore.fridgeMatch')}
                  </div>
              </button>
              <button 
                onClick={() => setActiveMode('random')}
                className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    activeMode === 'random' 
                    ? 'bg-brand-900 text-white shadow-lg' 
                    : 'text-brand-500 hover:bg-white/50'
                }`}
              >
                  <div className="flex items-center justify-center gap-2">
                    <Flame size={16} /> {t('explore.chefsSurprise')}
                  </div>
              </button>
          </div>
      </div>

      {/* GENERATE BUTTON */}
      <button
        onClick={generateBatch}
        disabled={isLoading || (userTier === SubscriptionTier.Free && dailyGenerations >= DAILY_FREE_LIMIT)}
        className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
            isLoading 
            ? 'bg-brand-200 text-brand-500 cursor-wait'
            : userTier === SubscriptionTier.Free && dailyGenerations >= DAILY_FREE_LIMIT
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                : 'bg-gradient-to-r from-brand-800 to-brand-900 text-white hover:scale-[1.01]'
        }`}
      >
        {isLoading ? (
            <RefreshCw className="animate-spin" size={20} />
        ) : userTier === SubscriptionTier.Free && dailyGenerations >= DAILY_FREE_LIMIT ? (
            <Lock size={20} />
        ) : (
            <Sparkles size={20} />
        )}
        
        {isLoading 
            ? t('explore.brewing')
            : userTier === SubscriptionTier.Free && dailyGenerations >= DAILY_FREE_LIMIT
                ? t('explore.limitReached')
                : t('explore.generate')}
      </button>

      {/* FEED */}
      <div className="space-y-6">
          {recipes.length === 0 && !isLoading && (
              <div className="text-center py-20 opacity-50">
                  <Compass size={48} className="mx-auto mb-4 text-brand-400" />
                  <p className="font-mono font-bold text-brand-900">{t('explore.offline')}</p>
                  <p className="text-xs text-brand-500 uppercase tracking-widest mt-2">Initialize generation sequence</p>
              </div>
          )}

          {recipes.map((recipe) => (
              <div key={recipe.id} className="glass-card rounded-2xl overflow-hidden group animate-fade-in border-l-4 border-l-brand-500">
                  <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-widest ${
                              recipe.matchScore > 80 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-brand-50 text-brand-500 border-brand-200'
                          }`}>
                              {activeMode === 'inventory' ? `${recipe.matchScore}% Match` : 'Trending'}
                          </span>
                          <span className="flex items-center text-brand-400 text-[10px] font-bold uppercase tracking-widest">
                              <Clock size={12} className="mr-1" /> {recipe.timeEstimate}
                          </span>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-brand-900 mb-2 font-mono uppercase">{recipe.title}</h3>
                      <p className="text-brand-600 text-sm leading-relaxed mb-4">{recipe.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {recipe.ingredients.slice(0, 4).map((ing, i) => (
                            <span key={i} className={`text-[10px] border px-2 py-1 rounded font-bold ${
                                checkIngredientAvailability(ing) 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-white text-brand-600 border-brand-200'
                            }`}>
                                {ing}
                            </span>
                        ))}
                        {recipe.ingredients.length > 4 && (
                            <span className="text-[10px] bg-brand-50 text-brand-400 px-2 py-1 rounded font-bold">+{recipe.ingredients.length - 4} more</span>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex gap-2 mb-2">
                           <button 
                                onClick={(e) => { e.stopPropagation(); saveRecipe(recipe); }}
                                disabled={savedRecipeIds.has(recipe.id)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                                    savedRecipeIds.has(recipe.id)
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                                }`}
                           >
                               {savedRecipeIds.has(recipe.id) ? <Check size={14} /> : <BookmarkPlus size={14} />}
                               {savedRecipeIds.has(recipe.id) ? t('explore.saved') : t('explore.save')}
                           </button>

                           <button 
                                onClick={(e) => { e.stopPropagation(); addMissingIngredients(recipe); }}
                                disabled={addedIngredientsIds.has(recipe.id)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                                    addedIngredientsIds.has(recipe.id)
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-white border border-brand-200 text-brand-700 hover:bg-gray-50'
                                }`}
                           >
                               {addedIngredientsIds.has(recipe.id) ? <Check size={14} /> : <ShoppingCart size={14} />}
                               {addedIngredientsIds.has(recipe.id) ? t('explore.added') : t('explore.addMissing')}
                           </button>
                      </div>

                      <button 
                         onClick={(e) => { e.stopPropagation(); handleAddToPlan(recipe); }}
                         className="w-full mt-2 py-3 bg-brand-900 text-white font-bold rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors"
                      >
                          <CalendarPlus size={14} /> {t('explore.addToPlan')}
                      </button>
                  </div>

                  <button 
                    onClick={() => toggleExpand(recipe.id)}
                    className="w-full py-3 bg-white/40 hover:bg-white/80 transition-colors flex items-center justify-center text-xs font-bold text-brand-900 uppercase tracking-widest border-t border-white/20"
                >
                    {expandedRecipe === recipe.id ? t('explore.closeDetails') : t('explore.viewRecipe')}
                    {expandedRecipe === recipe.id ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </button>
                
                {expandedRecipe === recipe.id && (
                    <div className="p-6 bg-white/60 backdrop-blur-md border-t border-brand-100">
                        <h4 className="font-bold text-brand-900 uppercase tracking-widest text-xs mb-3">{t('explore.prep')}</h4>
                        <ol className="list-decimal list-outside ml-4 space-y-3 text-sm text-brand-800 font-mono">
                            {recipe.instructions.map((step, idx) => (
                                <li key={idx} className="leading-relaxed pl-1">{step}</li>
                            ))}
                        </ol>
                    </div>
                )}
              </div>
          ))}
      </div>

      {/* DAY SELECTOR MODAL */}
      {isDaySelectorOpen && (
          <div className="fixed inset-0 z-50 bg-brand-900/90 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
              <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl relative">
                   <button onClick={() => setIsDaySelectorOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-brand-900"><X size={20} /></button>
                   <div className="flex items-center gap-2 mb-6 text-brand-900">
                        <CalendarPlus size={24} />
                        <h3 className="text-xl font-bold font-mono tracking-tight">{t('mealPlanner.selectDay')}</h3>
                   </div>
                   
                   <div className="space-y-2">
                       {days.map(day => (
                           <button 
                               key={day}
                               onClick={() => confirmAddToPlan(day)}
                               className="w-full py-3 px-4 bg-brand-50 hover:bg-brand-900 hover:text-white rounded-xl text-left font-bold transition-all flex justify-between items-center group"
                           >
                               <span className="font-mono text-sm uppercase tracking-wider">{t(`days.${day}`)}</span>
                               <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                           </button>
                       ))}
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RecipeExplore;
