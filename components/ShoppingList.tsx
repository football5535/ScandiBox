
import React, { useState, useEffect } from 'react';
import { ShoppingItem, InventoryItem, SubscriptionTier, Category } from '../types';
import { shoppingService, userService, inventoryService } from '../services/supabaseService';
import { geminiService } from '../services/geminiService';
import { Plus, Trash2, Check, Sparkles, Loader2, ShoppingCart, ArrowRight, PackageCheck, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ShoppingListProps {
  inventory: InventoryItem[];
}

const ShoppingList: React.FC<ShoppingListProps> = ({ inventory }) => {
  const { t } = useLanguage();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [userTier, setUserTier] = useState<SubscriptionTier>(SubscriptionTier.Free);
  
  // Finish Trip State
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [tripExpiryDate, setTripExpiryDate] = useState('');

  useEffect(() => {
    loadItems();
    userService.getProfile().then(p => { if(p) setUserTier(p.subscriptionTier); });
  }, []);

  const loadItems = async () => {
    const data = await shoppingService.getItems();
    setItems(data);
    setLoading(false);
  };

  const addItem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;
    const item = await shoppingService.addItem(newItemName);
    setItems([item, ...items]);
    setNewItemName('');
  };

  const toggleItem = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setItems(items.map(i => i.id === id ? { ...i, isChecked: newStatus } : i));
    await shoppingService.toggleItem(id, newStatus);
  };

  const deleteItem = async (id: string) => {
    setItems(items.filter(i => i.id !== id));
    await shoppingService.deleteItem(id);
  };

  const generateSmartList = async () => {
    if (userTier === SubscriptionTier.Standard || userTier === SubscriptionTier.Free) {
        alert("Upgrade to Pro to use AI Smart Replenish.");
        return;
    }
    setAiLoading(true);
    try {
        const suggestions = await geminiService.generateShoppingList(inventory);
        for (const name of suggestions) {
            const item = await shoppingService.addItem(name);
            setItems(prev => [item, ...prev]);
        }
    } catch (e) {
        alert("List generation failed.");
    } finally {
        setAiLoading(false);
    }
  };

  const handleFinishTripClick = () => {
    const checkedCount = items.filter(i => i.isChecked).length;
    if (checkedCount === 0) return;

    if (userTier === SubscriptionTier.Free) {
        alert(t('shopping.upgradeToMove'));
        return;
    }

    // Set default date to 1 week from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setTripExpiryDate(nextWeek.toISOString().split('T')[0]);
    setIsFinishModalOpen(true);
  };

  const confirmFinishTrip = async () => {
     setIsFinishModalOpen(false);
     setLoading(true);

     const checkedItems = items.filter(i => i.isChecked);
     let count = 0;
     
     for (const item of checkedItems) {
         // Default logic since we don't know exact category without AI.
         // In a real app we might ask Gemini to classify these too, but for speed we use 'Other' or try to reuse logic.
         
         const diff = new Date(tripExpiryDate).getTime() - new Date().getTime();
         const days = Math.ceil(diff / (1000 * 3600 * 24));

         await inventoryService.addItem({
             name: item.name,
             category: Category.Other, 
             quantity: '1', 
             daysUntilExpiry: days,
             expiryDate: tripExpiryDate,
             status: 'active',
             addedDate: new Date().toISOString()
         });

         await shoppingService.deleteItem(item.id);
         count++;
     }

     await loadItems();
     alert(t('shopping.moveSuccess'));
  };

  const checkedItemsCount = items.filter(i => i.isChecked).length;

  return (
    <div className="space-y-6 animate-fade-in pt-4">
        <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-3xl font-bold text-brand-900 tracking-tight font-mono">{t('shopping.title')}</h2>
            </div>
            
            <div className="flex gap-2">
                {checkedItemsCount > 0 && (
                    <button
                        onClick={handleFinishTripClick}
                        className={`flex items-center px-6 py-3 rounded-lg font-bold transition-all border ${
                            userTier === SubscriptionTier.Free
                            ? 'bg-gray-100 text-gray-400 border-gray-200' 
                            : 'bg-brand-900 text-white border-brand-900 hover:bg-black'
                        }`}
                        title={userTier === SubscriptionTier.Free ? "Available on Standard Plan" : ""}
                    >
                        <PackageCheck className="mr-2" size={16} />
                        {t('shopping.finishTrip')}
                    </button>
                )}

                <button
                    onClick={generateSmartList}
                    disabled={aiLoading}
                    className={`flex items-center px-6 py-3 rounded-lg font-bold transition-all border ${
                        userTier === SubscriptionTier.Pro || userTier === SubscriptionTier.ProMax
                        ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    }`}
                >
                    {aiLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Sparkles className="mr-2" size={16} />}
                    {userTier === SubscriptionTier.Pro || userTier === SubscriptionTier.ProMax ? t('shopping.autoReplenish') : t('shopping.autoPro')}
                </button>
            </div>
        </div>

        <div className="glass-panel p-2 rounded-xl border border-brand-200 flex gap-2">
            <input 
                type="text" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder={t('shopping.entryName')}
                className="flex-1 pl-4 bg-transparent focus:outline-none text-brand-900 font-bold placeholder-gray-400 font-mono"
            />
            <button 
                onClick={() => addItem()}
                className="w-12 h-12 bg-brand-900 text-white rounded-lg flex items-center justify-center hover:bg-black transition-colors"
            >
                <Plus size={20} />
            </button>
        </div>

        {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-500" size={32} /></div>
        ) : items.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl border-dashed border-2 border-brand-300">
                <ShoppingCart size={32} className="mx-auto text-brand-300 mb-4" />
                <p className="text-brand-500 font-bold font-mono">{t('shopping.logEmpty')}</p>
            </div>
        ) : (
            <div className="space-y-2">
                {items.map(item => (
                    <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-4 glass-card rounded-lg border transition-all ${
                            item.isChecked 
                            ? 'opacity-50' 
                            : ''
                        }`}
                    >
                        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleItem(item.id, item.isChecked)}>
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                item.isChecked ? 'bg-brand-900 border-brand-900' : 'border-brand-300'
                            }`}>
                                {item.isChecked && <Check size={14} className="text-white" strokeWidth={4} />}
                            </div>
                            <span className={`font-bold font-mono text-lg ${item.isChecked ? 'line-through text-gray-500' : 'text-brand-900'}`}>
                                {item.name}
                            </span>
                        </div>
                        <button 
                            onClick={() => deleteItem(item.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* FINISH TRIP MODAL */}
        {isFinishModalOpen && (
            <div className="fixed inset-0 z-[60] bg-brand-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative">
                    <button onClick={() => setIsFinishModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-brand-900"><X size={20} /></button>
                    
                    <div className="flex items-center gap-3 mb-6 text-brand-900">
                        <PackageCheck size={28} />
                        <h3 className="text-2xl font-bold font-mono tracking-tight">{t('shopping.finishTrip')}</h3>
                    </div>

                    <p className="text-sm font-bold text-brand-500 mb-4 uppercase tracking-widest">{t('shopping.itemsToMove')}</p>
                    <div className="max-h-40 overflow-y-auto mb-6 space-y-2 pr-2">
                        {items.filter(i => i.isChecked).map(i => (
                            <div key={i.id} className="flex items-center gap-2 text-brand-800 font-bold text-sm bg-brand-50 p-2 rounded">
                                <Check size={14} className="text-green-500" /> {i.name}
                            </div>
                        ))}
                    </div>

                    <label className="text-xs font-bold text-brand-400 uppercase tracking-widest block mb-2">{t('shopping.confirmDates')}</label>
                    <input 
                        type="date" 
                        value={tripExpiryDate} 
                        onChange={e => setTripExpiryDate(e.target.value)} 
                        className="w-full p-3 bg-brand-50 border border-brand-200 rounded-lg focus:outline-none focus:border-brand-900 font-bold text-brand-900 mb-6" 
                    />

                    <button 
                        onClick={confirmFinishTrip} 
                        className="w-full py-4 bg-brand-900 text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        <ArrowRight size={18} /> {t('shopping.move')}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default ShoppingList;
