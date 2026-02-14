import React from 'react';
import { InventoryItem } from '../types';
import { ArrowRight, Leaf, ShoppingBag, Utensils, AlertCircle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  items: InventoryItem[];
  setActiveTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, setActiveTab }) => {
  const expiringSoon = items.filter(i => (i.daysUntilExpiry || 0) <= 3);
  const totalItems = items.length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
  };

  return (
    <div className="relative space-y-8 md:space-y-12 animate-fade-in pt-4">
      
      {/* BACKGROUND BLOBS FOR GLASS EFFECT */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[1000px] overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
          <div className="absolute top-[40%] left-[20%] w-[400px] h-[400px] bg-teal-300/20 rounded-full blur-[100px] mix-blend-multiply" />
      </div>

      <header className="mb-6 md:mb-10 px-4 relative z-10">
        <h1 className="text-4xl md:text-7xl font-bold text-brand-900 tracking-tighter leading-[1.1] drop-shadow-sm">
          {getGreeting()}.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4275ff] to-brand-700 opacity-90">
            Your kitchen {expiringSoon.length > 0 ? 'needs attention.' : 'is in balance.'}
          </span>
        </h1>
      </header>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 px-2">
        
        {/* Inventory Status - GLASS */}
        <div 
            onClick={() => setActiveTab('inventory')}
            className="group cursor-pointer relative overflow-hidden p-8 md:p-10 rounded-[2.5rem] transition-all duration-300 hover:-translate-y-2 hover:shadow-glow"
            style={glassStyle}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8 md:mb-12">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center text-[#003385] shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] border border-white/40">
                        <Leaf size={28} className="md:w-8 md:h-8" strokeWidth={2} />
                    </div>
                    <div className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center bg-white/30 group-hover:bg-[#003385] group-hover:text-white transition-colors duration-300 backdrop-blur-sm shadow-sm">
                        <ArrowRight size={20} />
                    </div>
                </div>
                <div>
                    <p className="text-6xl md:text-7xl font-bold text-brand-900 mb-2 drop-shadow-sm tracking-tight">{totalItems}</p>
                    <p className="text-brand-900/60 font-bold uppercase tracking-widest text-xs md:text-sm">Ingredients tracked</p>
                </div>
            </div>
        </div>

        {/* Expiration Alert - GLASS */}
        <div 
            onClick={() => setActiveTab('inventory')}
            className="group cursor-pointer relative overflow-hidden p-8 md:p-10 rounded-[2.5rem] transition-all duration-300 hover:-translate-y-2 hover:shadow-glow"
            style={{
                ...glassStyle,
                background: expiringSoon.length > 0 ? 'rgba(255, 247, 237, 0.4)' : glassStyle.background,
                border: expiringSoon.length > 0 ? '1px solid rgba(255, 180, 180, 0.4)' : glassStyle.border,
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8 md:mb-12">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] border border-white/40 backdrop-blur-md ${
                        expiringSoon.length > 0 ? 'bg-orange-100/60 text-orange-600' : 'bg-green-100/60 text-green-600'
                    }`}>
                        <AlertCircle size={28} className="md:w-8 md:h-8" strokeWidth={2} />
                    </div>
                    <div className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center bg-white/30 group-hover:bg-[#003385] group-hover:text-white transition-colors duration-300 backdrop-blur-sm shadow-sm">
                        <ArrowRight size={20} />
                    </div>
                </div>
                <div>
                    <p className={`text-6xl md:text-7xl font-bold mb-2 drop-shadow-sm tracking-tight ${
                        expiringSoon.length > 0 ? 'text-orange-900' : 'text-brand-900'
                    }`}>
                        {expiringSoon.length}
                    </p>
                    <p className={`${
                        expiringSoon.length > 0 ? 'text-orange-900/60' : 'text-brand-900/60'
                    } font-bold uppercase tracking-widest text-xs md:text-sm`}>
                        Items expiring soon
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 px-2">
         {/* Shopping List - NOW GLASS STYLE (Blue Tinted) */}
         <button 
            onClick={() => setActiveTab('shopping')}
            className="flex flex-row items-center justify-between p-8 md:p-10 rounded-[2.5rem] transition-all group hover:scale-[1.01] relative overflow-hidden"
            style={{
                background: 'rgba(0, 51, 133, 0.85)', // Dark blue glass
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(0, 51, 133, 0.25)'
            }}
         >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col items-start text-white">
                <ShoppingBag size={32} className="mb-4 md:mb-6 text-blue-300" />
                <span className="font-bold text-2xl md:text-3xl">Shopping List</span>
                <span className="text-blue-200/80 text-sm mt-1 font-medium">Smart replenish active</span>
            </div>
            <div className="relative z-10 w-14 h-14 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors border border-white/10 text-white">
                 <ArrowRight />
            </div>
         </button>

         {/* Meal Plan - GLASS STYLE */}
         <button 
            onClick={() => setActiveTab('mealplanner')}
            className="flex flex-row items-center justify-between p-8 md:p-10 rounded-[2.5rem] transition-all group hover:scale-[1.01] relative overflow-hidden"
            style={glassStyle}
         >
             <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent pointer-events-none" />
             <div className="relative z-10 flex flex-row items-center justify-between w-full">
                 <div className="flex flex-col items-start">
                    <Utensils size={32} className="mb-4 md:mb-6 text-[#4275ff]" />
                    <span className="font-bold text-2xl md:text-3xl text-brand-900">Meal Plan</span>
                    <span className="text-brand-900/60 text-sm mt-1 font-medium">AI suggestions ready</span>
                </div>
                <div className="w-14 h-14 bg-white/40 rounded-full flex items-center justify-center group-hover:bg-[#003385] group-hover:text-white transition-colors border border-white/40 shadow-sm text-brand-900">
                    <ArrowRight />
                </div>
            </div>
         </button>
      </div>

      {/* Daily Insight - GLASS STYLE */}
      <div 
        className="relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] text-center mx-2"
        style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.4)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
        <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-50/40 backdrop-blur-md rounded-full text-[#003385] text-xs font-extrabold uppercase tracking-widest border border-blue-100/40 shadow-sm">
                <TrendingUp size={14} strokeWidth={3} /> Kitchen Wisdom
            </div>
            <p className="text-xl md:text-3xl font-bold text-brand-900 leading-relaxed max-w-3xl mx-auto drop-shadow-sm">
                "A clean fridge is the canvas for a delicious meal. Organise by category to reduce waste."
            </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;