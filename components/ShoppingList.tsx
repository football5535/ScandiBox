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

  return (
    <div className="space-y-6 animate-fade-in pt-4">
        <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-3xl font-bold text-brand-900 tracking-tight font-mono">SUPPLY_LOG</h2>
            </div>
            
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
                {userTier === SubscriptionTier.Pro || userTier === SubscriptionTier.ProMax ? 'AUTO-REPLENISH' : 'AUTO (PRO ONLY)'}
            </button>
        </div>

        <div className="glass-panel p-2 rounded-xl border border-brand-200 flex gap-2">
            <input 
                type="text" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                placeholder="Entry name..."
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
                <p className="text-brand-500 font-bold font-mono">LOG EMPTY</p>
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
    </div>
  );
};

export default ShoppingList;