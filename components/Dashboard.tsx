import React from 'react';
import { InventoryItem } from '../types';
import { ArrowRight, Leaf, ShoppingBag, Utensils, AlertCircle, Calendar } from 'lucide-react';

interface DashboardProps {
  items: InventoryItem[];
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, setActiveTab }) => {
  const expiringSoon = items.filter(i => (i.daysUntilExpiry || 0) <= 3);
  const totalItems = items.length;

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="relative space-y-6 md:space-y-8 animate-fade-in pt-6 md:pt-8">
      
      {/* Header Section */}
      <header className="mb-8 px-1">
        <div className="flex items-center gap-2 mb-2 text-brand-700 font-bold text-sm tracking-widest uppercase opacity-70">
            <Calendar size={14} /> {dateStr}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-brand-900 leading-tight">
          System Status: <br/>
          <span className={`border-b-4 ${expiringSoon.length > 0 ? 'border-orange-500 text-brand-900' : 'border-green-500 text-brand-900'}`}>
             {expiringSoon.length > 0 ? 'Action Required' : 'Optimal'}
          </span>
        </h1>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inventory Count */}
        <div 
            onClick={() => setActiveTab('inventory')}
            className="glass-panel p-8 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-brand-500/30 transition-colors"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="bg-brand-900 text-white p-3 rounded-lg shadow-lg">
                    <Leaf size={24} />
                </div>
                <ArrowRight className="text-brand-400 group-hover:text-brand-900 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold text-brand-900">{totalItems}</span>
                <span className="text-sm font-bold text-brand-500 uppercase tracking-widest">Items Stored</span>
            </div>
            <div className="absolute -bottom-6 -right-6 text-brand-900/5 rotate-[-15deg]">
                <Leaf size={180} />
            </div>
        </div>

        {/* Expiry Alert */}
        <div 
            onClick={() => setActiveTab('inventory')}
            className={`glass-panel p-8 rounded-2xl relative overflow-hidden group cursor-pointer transition-colors ${
                expiringSoon.length > 0 ? 'border-orange-200 bg-orange-50/50' : ''
            }`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`${expiringSoon.length > 0 ? 'bg-orange-500' : 'bg-green-600'} text-white p-3 rounded-lg shadow-lg`}>
                    <AlertCircle size={24} />
                </div>
                <ArrowRight className="text-brand-400 group-hover:text-brand-900 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex items-baseline gap-2">
                <span className={`text-6xl font-bold ${expiringSoon.length > 0 ? 'text-orange-900' : 'text-brand-900'}`}>
                    {expiringSoon.length}
                </span>
                <span className={`text-sm font-bold uppercase tracking-widest ${expiringSoon.length > 0 ? 'text-orange-700' : 'text-brand-500'}`}>
                    Expiring Soon
                </span>
            </div>
             <div className="absolute -bottom-6 -right-6 text-brand-900/5 rotate-[-15deg]">
                <AlertCircle size={180} />
            </div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* Shopping List */}
         <button 
            onClick={() => setActiveTab('shopping')}
            className="glass-card text-left p-8 rounded-2xl flex flex-col justify-between h-48 group relative overflow-hidden"
         >
            <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white/40 to-transparent transform skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <div className="flex justify-between w-full z-10">
                <ShoppingBag size={32} className="text-brand-700" />
                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="z-10">
                <h3 className="text-2xl font-bold text-brand-900">Shopping List</h3>
                <p className="text-brand-500 text-sm font-bold mt-1">Smart replenish active</p>
            </div>
         </button>

         {/* Meal Plan */}
         <button 
            onClick={() => setActiveTab('mealplanner')}
            className="glass-card text-left p-8 rounded-2xl flex flex-col justify-between h-48 group relative overflow-hidden"
         >
            <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white/40 to-transparent transform skew-x-12 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
            <div className="flex justify-between w-full z-10">
                <Utensils size={32} className="text-brand-700" />
                <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="z-10">
                <h3 className="text-2xl font-bold text-brand-900">Meal OS</h3>
                <p className="text-brand-500 text-sm font-bold mt-1">Generate Menu</p>
            </div>
         </button>
      </div>

      {/* Quote/Footer - Styled as a system log/message */}
      <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-brand-700">
        <p className="font-mono text-sm md:text-base text-brand-800 leading-relaxed">
            <span className="font-bold text-brand-500 uppercase text-xs tracking-wider block mb-1">System Message:</span>
            "Organization is the foundation of culinary creativity. Keep the inventory updated for optimal results."
        </p>
      </div>
    </div>
  );
};

export default Dashboard;