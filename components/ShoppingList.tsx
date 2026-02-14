import React, { useState, useEffect } from 'react';
import { ShoppingItem, InventoryItem, SubscriptionTier } from '../types';
import { shoppingService, userService } from '../services/supabaseService';
import { geminiService } from '../services/geminiService';
import { Plus, Trash2, Check, Sparkles, Loader2, ShoppingCart } from 'lucide-react';

interface ShoppingListProps {
  inventory: InventoryItem[];
}

const ShoppingList: React.FC<ShoppingListProps> = ({ inventory }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [userTier, setUserTier] = useState<SubscriptionTier>(SubscriptionTier.Free);

  useEffect(() => {
    loadItems();
    userService.getProfile().then(p => {
        if(p) setUserTier(p.subscriptionTier);
    });
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
    // Optimistic update
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
        alert("Upgrade to Pro or Pro Max to use AI Smart Replenish!");
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
        alert("Could not generate list.");
    } finally {
        setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 md:space-y-10 animate-fade-in pt-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
            <div>
                <h2 className="text-4xl md:text-5xl font-bold text-brand-900 tracking-tight">Shopping List</h2>
                <p className="text-brand-500 mt-2 md:mt-3 font-bold text-base md:text-lg">Never forget an ingredient again.</p>
            </div>
            
            <button
                onClick={generateSmartList}
                disabled={aiLoading}
                className={`w-full md:w-auto flex items-center justify-center px-6 md:px-8 py-4 rounded-2xl font-bold transition-all ${
                    userTier === SubscriptionTier.Pro || userTier === SubscriptionTier.ProMax
                    ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-white shadow-lg shadow-teal-500/30 hover:shadow-xl hover:scale-[1.02]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={userTier === SubscriptionTier.Free ? "Upgrade to Pro for AI" : ""}
            >
                {aiLoading ? <Loader2 className="animate-spin mr-3" size={20} /> : <Sparkles className="mr-3" size={20} />}
                {userTier === SubscriptionTier.Pro || userTier === SubscriptionTier.ProMax ? 'Smart Replenish (AI)' : 'Smart Replenish (Pro)'}
            </button>
        </div>

        <div className="bg-white p-2 md:p-3 rounded-[2rem] shadow-soft border border-brand-50 flex gap-2 md:gap-4">
            <input 
                type="text" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder="Add item..."
                className="flex-1 pl-6 md:pl-8 py-4 bg-transparent focus:outline-none text-brand-900 font-bold placeholder-gray-300 text-lg"
            />
            <button 
                onClick={() => addItem()}
                className="w-14 h-14 md:w-16 md:h-16 bg-[#003385] text-white rounded-2xl flex items-center justify-center hover:bg-[#00255c] transition-colors shadow-lg shadow-blue-900/20 flex-shrink-0"
            >
                <Plus size={24} className="md:w-7 md:h-7" />
            </button>
        </div>

        {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-300" size={32} /></div>
        ) : items.length === 0 ? (
            <div className="text-center py-24 md:py-32 bg-white rounded-[2.5rem] md:rounded-[3rem] border border-dashed border-gray-200">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-300">
                    <ShoppingCart size={32} className="md:w-10 md:h-10" />
                </div>
                <p className="text-gray-400 font-bold text-lg">Your list is empty.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-3 md:gap-4">
                {items.map(item => (
                    <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-4 md:p-6 bg-white rounded-[1.5rem] border transition-all duration-300 ${
                            item.isChecked 
                            ? 'border-transparent bg-gray-50 opacity-60' 
                            : 'border-brand-50 shadow-sm hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-center gap-4 md:gap-6 flex-1 cursor-pointer" onClick={() => toggleItem(item.id, item.isChecked)}>
                            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-xl border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                item.isChecked ? 'bg-green-500 border-green-500' : 'border-gray-200 bg-white'
                            }`}>
                                {item.isChecked && <Check size={14} className="text-white md:w-4 md:h-4" strokeWidth={3} />}
                            </div>
                            <span className={`font-bold text-lg md:text-xl tracking-tight break-all ${item.isChecked ? 'line-through text-gray-400' : 'text-brand-900'}`}>
                                {item.name}
                            </span>
                        </div>
                        <button 
                            onClick={() => deleteItem(item.id)}
                            className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={20} className="md:w-6 md:h-6" />
                        </button>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default ShoppingList;