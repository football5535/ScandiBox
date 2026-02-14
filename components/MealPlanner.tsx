
import React, { useState, useEffect } from 'react';
import { InventoryItem, Recipe, SubscriptionTier, UserProfile } from '../types';
import { geminiService } from '../services/geminiService';
import { userService, recipeService, inventoryService, shoppingService } from '../services/supabaseService';
import { ChefHat, Clock, Sparkles, ChevronDown, ChevronUp, Zap, Lock, Printer, Bookmark, Play, CheckCircle, ArrowRight, ArrowLeft, RefreshCw, BoxSelect, ShoppingCart, Check } from 'lucide-react';
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
  const [addedToShopIds, setAddedToShopIds] = useState<Set<string>>(new Set());
  
  // Cooking Mode State
  const [activeCookingRecipe, setActiveCookingRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isInventoryCheckOpen, setIsInventoryCheckOpen] = useState(false);
  const [potentialDeductions, setPotentialDeductions] = useState<InventoryItem[]>([]);
  const [selectedForDeduction, setSelectedForDeduction] = useState<Set<string>>(new Set());

  useEffect(() => {
    userService.getProfile().then(p => { if(p) setUserProfile(p); });
    loadSavedRecipes();
    // Load local weekly plan if exists
    const localPlan = localStorage.getItem('scandibox_weekly_plan');
    if (localPlan) {
        setRecipes(JSON.parse(localPlan));
    }
  }, []);

  const loadSavedRecipes = async () => {
      const saved = await recipeService.getSavedRecipes();
      setSavedRecipes(saved);
  };

  const generateWeeklyPlan = async () => {
    const tier = userProfile?.subscriptionTier || SubscriptionTier.Free;
    if (tier === SubscriptionTier.Free) {
        alert("Upgrade to Pro to generate full weekly meal plans.");
        return;
    }
    
    setIsLoading(true);
    try {
      const suggestions = await geminiService.generateWeeklyPlan(
          inventory, 
          userProfile?.preferences.householdSize || 1,
          userProfile?.preferences.dietaryRestrictions || []
      );
      setRecipes(suggestions);
      localStorage.setItem('scandibox_weekly_plan', JSON.stringify(suggestions));
    } catch (e) {
      alert("AI Processing Error.");
    } finally {
      setIsLoading(false);
    }
  };

  const addMissingIngredients = async (recipe: Recipe) => {
      // Logic to find missing ingredients (Simple fuzzy matching against inventory)
      const inventoryNames = inventory.map(i => i.name.toLowerCase());
      
      const missingIngredients = recipe.ingredients.filter(ing => {
          // Keep ingredient if NOT found in inventory
          return !inventoryNames.some(invName => ing.toLowerCase().includes(invName));
      });

      // Provide Smart Feedback
      const foundCount = recipe.ingredients.length - missingIngredients.length;
      
      if (missingIngredients.length === 0) {
          alert(t('explore.smartAddResult').replace('{found}', recipe.ingredients.length.toString()).replace('{added}', '0'));
          setAddedToShopIds(prev => new Set(prev).add(recipe.id));
          return;
      }

      for (const ing of missingIngredients) {
          await shoppingService.addItem(ing);
      }
      
      alert(t('explore.smartAddResult').replace('{found}', foundCount.toString()).replace('{added}', missingIngredients.length.toString()));
      setAddedToShopIds(prev => new Set(prev).add(recipe.id));
  };

  const startCooking = (recipe: Recipe) => {
      setActiveCookingRecipe(recipe);
      setCurrentStep(0);
      setIsInventoryCheckOpen(false);
  };

  const handleFinishCooking = () => {
      // Find matches
      if (!activeCookingRecipe) return;
      
      const ingredients = activeCookingRecipe.ingredients.join(' ').toLowerCase();
      const matches = inventory.filter(item => ingredients.includes(item.name.toLowerCase()) || ingredients.includes(item.category.toLowerCase()));
      
      if (matches.length > 0) {
          setPotentialDeductions(matches);
          setSelectedForDeduction(new Set(matches.map(i => i.id))); // Select all by default
          setIsInventoryCheckOpen(true);
      } else {
          closeCookingMode();
      }
  };

  const confirmDeductions = async () => {
      await inventoryService.batchDeleteItems(Array.from(selectedForDeduction));
      // Optimization: we could call a refresh callback here if passed from parent, but Inventory updates on its own mount/tab switch usually. 
      // Ideally App.tsx should pass a refreshTrigger, but for now user will see updates next time they visit Inventory.
      closeCookingMode();
  };

  const closeCookingMode = () => {
      setActiveCookingRecipe(null);
      setIsInventoryCheckOpen(false);
  };

  const toggleDeduction = (id: string) => {
      const newSet = new Set(selectedForDeduction);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedForDeduction(newSet);
  };

  const toggleExpand = (id: string) => setExpandedRecipe(expandedRecipe === id ? null : id);
  const isPro = userProfile?.subscriptionTier === SubscriptionTier.Pro || userProfile?.subscriptionTier === SubscriptionTier.ProMax;

  // Determine which list to show
  const displayRecipes = activeTab === 'generate' ? recipes : savedRecipes;

  // --- COOK MODE RENDER ---
  if (activeCookingRecipe) {
      if (isInventoryCheckOpen) {
          return (
              <div className="fixed inset-0 z-50 bg-brand-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in">
                  <div className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl">
                      <div className="flex items-center gap-3 mb-6 text-brand-900">
                          <BoxSelect size={32} />
                          <h2 className="text-2xl font-bold font-mono tracking-tight">{t('mealPlanner.inventoryCheck')}</h2>
                      </div>
                      <p className="text-brand-500 mb-6">{t('mealPlanner.inventoryCheckDesc')}</p>
                      
                      <div className="space-y-3 mb-8 max-h-[50vh] overflow-y-auto">
                          {potentialDeductions.map(item => (
                              <div 
                                key={item.id} 
                                onClick={() => toggleDeduction(item.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer flex justify-between items-center transition-all ${
                                    selectedForDeduction.has(item.id) 
                                    ? 'border-brand-900 bg-brand-50' 
                                    : 'border-gray-200 hover:border-brand-300'
                                }`}
                              >
                                  <div>
                                      <p className="font-bold text-brand-900">{item.name}</p>
                                      <p className="text-xs text-brand-500 uppercase">{item.quantity} • {item.category}</p>
                                  </div>
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                                      selectedForDeduction.has(item.id) ? 'bg-brand-900 border-brand-900' : 'border-gray-300'
                                  }`}>
                                      {selectedForDeduction.has(item.id) && <CheckCircle size={16} className="text-white" />}
                                  </div>
                              </div>
                          ))}
                      </div>

                      <button 
                        onClick={confirmDeductions}
                        className="w-full py-4 bg-brand-900 text-white font-bold rounded-xl hover:bg-black transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                          <CheckCircle size={20} /> {t('mealPlanner.confirmDeduction')}
                      </button>
                      <button 
                        onClick={closeCookingMode}
                        className="w-full mt-3 py-3 text-brand-500 font-bold hover:text-brand-900 uppercase tracking-widest text-xs"
                      >
                          Skip
                      </button>
                  </div>
              </div>
          )
      }

      return (
          <div className="fixed inset-0 z-50 bg-[#0f172a] text-white flex flex-col animate-fade-in">
              {/* Header */}
              <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
                  <h3 className="font-bold font-mono uppercase tracking-widest text-lg truncate max-w-[70%]">
                      {activeCookingRecipe.title}
                  </h3>
                  <button onClick={closeCookingMode} className="text-gray-400 hover:text-white font-bold text-sm uppercase">Exit</button>
              </div>

              {/* Step Content */}
              <div className="flex-1 flex flex-col justify-center items-center p-8 max-w-4xl mx-auto text-center">
                  <div className="mb-6 text-brand-400 font-bold font-mono text-sm tracking-[0.2em]">
                      {t('mealPlanner.step')} {currentStep + 1} {t('mealPlanner.of')} {activeCookingRecipe.instructions.length}
                  </div>
                  <h2 className="text-2xl md:text-4xl font-bold leading-relaxed">
                      {activeCookingRecipe.instructions[currentStep]}
                  </h2>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-white/10 w-full">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300" 
                    style={{ width: `${((currentStep + 1) / activeCookingRecipe.instructions.length) * 100}%` }}
                  ></div>
              </div>

              {/* Controls */}
              <div className="h-24 border-t border-white/10 flex items-center justify-between px-8 bg-[#0f172a]">
                  <button 
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className={`p-4 rounded-full border border-white/20 transition-all ${currentStep === 0 ? 'opacity-30' : 'hover:bg-white/10'}`}
                  >
                      <ArrowLeft size={24} />
                  </button>

                  {currentStep === activeCookingRecipe.instructions.length - 1 ? (
                      <button 
                        onClick={handleFinishCooking}
                        className="px-8 py-4 bg-green-500 hover:bg-green-600 text-black font-bold rounded-full uppercase tracking-widest transition-all flex items-center gap-2"
                      >
                          <CheckCircle size={20} /> {t('mealPlanner.finish')}
                      </button>
                  ) : (
                      <button 
                        onClick={() => setCurrentStep(Math.min(activeCookingRecipe.instructions.length - 1, currentStep + 1))}
                        className="w-16 h-16 bg-white text-brand-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                      >
                          <ArrowRight size={24} />
                      </button>
                  )}
              </div>
          </div>
      );
  }

  // --- MAIN RENDER ---
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
                onClick={generateWeeklyPlan}
                disabled={isLoading}
                className={`flex items-center px-6 py-3 font-bold rounded-lg transition-all border ${
                    isPro 
                    ? 'bg-brand-900 text-white border-brand-900 hover:bg-black'
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
                >
                {isLoading ? <Zap className="animate-spin mr-2" size={16} /> : isPro ? <RefreshCw className="mr-2" size={16} /> : <Lock className="mr-2" size={16} />}
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

      {activeTab === 'generate' && recipes.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
              {recipes.map((recipe, index) => (
                   <div key={recipe.id} className="glass-card rounded-xl overflow-hidden flex flex-col md:flex-row relative">
                       {/* Day Indicator */}
                       <div className="bg-brand-900 text-white p-4 md:w-24 flex md:flex-col items-center justify-center gap-2 font-mono font-bold tracking-widest text-xs md:text-sm">
                           <span>{recipe.day?.substring(0, 3).toUpperCase() || `DAY ${index + 1}`}</span>
                       </div>

                       <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-brand-900 font-mono uppercase leading-tight">{recipe.title}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center text-brand-400 text-[10px] font-bold uppercase tracking-widest">
                                        <Clock size={12} className="mr-1" /> {recipe.timeEstimate}
                                    </span>
                                </div>
                            </div>
                            <p className="text-brand-600 text-xs leading-relaxed mb-4">{recipe.description}</p>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => startCooking(recipe)}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg text-xs uppercase tracking-widest flex items-center gap-2 transition-colors"
                                >
                                    <Play size={14} /> {t('mealPlanner.startCooking')}
                                </button>
                                <button 
                                    onClick={() => toggleExpand(recipe.id)}
                                    className="px-4 py-2 bg-brand-100 hover:bg-brand-200 text-brand-900 font-bold rounded-lg text-xs uppercase tracking-widest transition-colors"
                                >
                                    {expandedRecipe === recipe.id ? t('explore.closeDetails') : t('explore.viewRecipe')}
                                </button>
                            </div>

                            {expandedRecipe === recipe.id && (
                                <div className="mt-6 pt-6 border-t border-brand-100 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-brand-400 uppercase tracking-widest text-[10px] mb-3">Ingredients</h4>
                                            <ul className="space-y-2">
                                                {recipe.ingredients.map((ing, i) => (
                                                    <li key={i} className="text-xs font-bold text-brand-800 bg-brand-50 px-3 py-2 rounded">{ing}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-brand-400 uppercase tracking-widest text-[10px] mb-3">{t('mealPlanner.sequence')}</h4>
                                            <ol className="list-decimal list-outside ml-4 space-y-2 text-xs text-brand-800 font-mono">
                                                {recipe.instructions.map((step, idx) => (
                                                    <li key={idx} className="leading-relaxed pl-1">{step}</li>
                                                ))}
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            )}
                       </div>
                   </div>
              ))}
          </div>
      )}

      {activeTab === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedRecipes.map(recipe => (
            <div key={recipe.id} className="glass-card rounded-xl overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <span className="flex items-center text-brand-400 text-[10px] font-bold uppercase tracking-widest">
                            <Clock size={12} className="mr-1" /> {recipe.timeEstimate}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-brand-900 mb-2 font-mono leading-tight uppercase">{recipe.title}</h3>
                    <p className="text-brand-600 text-xs mb-4 leading-relaxed border-b border-brand-100 pb-4">{recipe.description}</p>
                    
                    <div className="space-y-2">
                        <button 
                            onClick={() => startCooking(recipe)}
                            className="w-full py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                        >
                            <Play size={14} /> {t('mealPlanner.startCooking')}
                        </button>
                        <button 
                            onClick={() => addMissingIngredients(recipe)}
                            disabled={addedToShopIds.has(recipe.id)}
                            className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${
                                addedToShopIds.has(recipe.id) 
                                ? 'bg-brand-100 text-brand-400 cursor-default'
                                : 'bg-white border border-brand-200 text-brand-700 hover:bg-brand-50'
                            }`}
                        >
                             {addedToShopIds.has(recipe.id) ? <Check size={14} /> : <ShoppingCart size={14} />}
                             {addedToShopIds.has(recipe.id) ? t('explore.added') : t('mealPlanner.addToShop')}
                        </button>
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
      )}
    </div>
  );
};

export default MealPlanner;
