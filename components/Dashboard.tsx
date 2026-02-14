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

  return (
    <div className="relative space-y-8 md:space-y-12 animate-fade-in pt-2">
      
      {/* ENHANCED BACKGROUND BLOBS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[800px] overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] md:w-[700px] h-[500px] md:h-[700px] bg-blue-400/20 rounded-full blur-[100px] md:blur-[130px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-[10%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-indigo-300/20 rounded-full blur-[100px] md:blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
          <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-teal-200/20 rounded-full blur-[80px] mix-blend-multiply" />
      </div>

      <header className="mb-4 md:mb-8 px-2 relative z-10">
        <h1 className="text-3xl md:text-6xl font-bold text-brand-900 tracking-tighter leading-tight drop-shadow-sm">
          {getGreeting()}.<br />
          <span className="text-[#4275ff] opacity-90">Your kitchen {expiringSoon.length > 0 ? 'needs attention.' : 'is in balance.'}</span>
        </h1>
      </header>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        
        {/* Inventory Status - GLASS STYLE */}
        <div 
            onClick={() => setActiveTab('inventory')}
            className="group cursor-pointer relative overflow-hidden bg-white/40 backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-glow hover:-translate-y-2 transition-all duration-300"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6 md:mb-10">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50/80 backdrop-blur-sm rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center text-[#003385] shadow-inner border border-white/50">
                        <Leaf size={24} className="md:w-7 md:h-7" />
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/60 flex items-center justify-center bg-white/40 group-hover:bg-[#003385] group-hover:text-white transition-colors duration-300 backdrop-blur-sm">
                        <ArrowRight size={18} className="md:w-5 md:h-5" />
                    </div>
                </div>
                <div>
                    <p className="text-5xl md:text-6xl font-bold text-brand-900 mb-2 drop-shadow-sm">{totalItems}</p>
                    <p className="text-brand-800/60 font-bold uppercase tracking-wider text-xs md:text-sm">Ingredients tracked</p>
                </div>
            </div>
        </div>

        {/* Expiration Alert - GLASS STYLE */}
        <div 
            onClick={() => setActiveTab('inventory')}
            className={`group cursor-pointer relative overflow-hidden backdrop-blur-xl p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] hover:shadow-glow hover:-translate-y-2 transition-all duration-300 ${
                expiringSoon.length > 0 
                ? 'bg-orange-50/40 border-orange-100/60' 
                : 'bg-white/40 border-white/60'
            }`}
        >
             <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/10 to-transparent pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6 md:mb-10">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center shadow-inner border border-white/50 backdrop-blur-sm ${
                        expiringSoon.length > 0 ? 'bg-orange-100/80 text-orange-600' : 'bg-green-50/80 text-green-600'
                    }`}>
                        <AlertCircle size={24} className="md:w-7 md:h-7" />
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/60 flex items-center justify-center bg-white/40 group-hover:bg-[#003385] group-hover:text-white transition-colors duration-300 backdrop-blur-sm">
                        <ArrowRight size={18} className="md:w-5 md:h-5" />
                    </div>
                </div>
                <div>
                    <p className={`text-5xl md:text-6xl font-bold mb-2 drop-shadow-sm ${
                        expiringSoon.length > 0 ? 'text-orange-900' : 'text-brand-900'
                    }`}>
                        {expiringSoon.length}
                    </p>
                    <p className={`${
                        expiringSoon.length > 0 ? 'text-orange-800/70' : 'text-brand-800/60'
                    } font-bold uppercase tracking-wider text-xs md:text-sm`}>
                        Items expiring soon
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
         <button 
            onClick={() => setActiveTab('shopping')}
            className="flex flex-row items-center justify-between p-6 md:p-10 bg-[#003385]/90 backdrop-blur-md text-white rounded-[2.5rem] md:rounded-[3rem] shadow-xl shadow-blue-900/20 hover:bg-[#00255c] transition-all group hover:scale-[1.01] border border-blue-400/20"
         >
            <div className="flex flex-col items-start">
                <ShoppingBag size={28} className="mb-4 md:mb-6 text-blue-300" />
                <span className="font-bold text-xl md:text-2xl">Shopping List</span>
                <span className="text-blue-200/80 text-xs md:text-sm mt-1">Smart replenish active</span>
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors border border-white/10">
                 <ArrowRight />
            </div>
         </button>

         <button 
            onClick={() => setActiveTab('mealplanner')}
            className="flex flex-row items-center justify-between p-6 md:p-10 bg-white/40 backdrop-blur-xl text-brand-900 border border-white/60 rounded-[2.5rem] md:rounded-[3rem] shadow-lg hover:bg-white/50 transition-all group hover:scale-[1.01] relative overflow-hidden"
         >
             <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent pointer-events-none" />
             <div className="relative z-10 flex flex-row items-center justify-between w-full">
                 <div className="flex flex-col items-start">
                    <Utensils size={28} className="mb-4 md:mb-6 text-[#4275ff]" />
                    <span className="font-bold text-xl md:text-2xl">Meal Plan</span>
                    <span className="text-brand-800/60 text-xs md:text-sm mt-1">AI suggestions ready</span>
                </div>
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white/50 rounded-full flex items-center justify-center group-hover:bg-[#003385] group-hover:text-white transition-colors border border-white/40">
                    <ArrowRight />
                </div>
            </div>
         </button>
      </div>

      {/* Daily Insight - GLASS STYLE */}
      <div className="relative overflow-hidden bg-white/30 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] text-center border border-white/60 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent pointer-events-none" />
        <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 bg-blue-50/50 backdrop-blur-sm rounded-full text-[#003385] text-xs font-bold uppercase tracking-widest border border-blue-100/50">
                <TrendingUp size={14} /> Kitchen Wisdom
            </div>
            <p className="text-lg md:text-3xl font-bold text-brand-900 leading-relaxed max-w-3xl mx-auto drop-shadow-sm">
                "A clean fridge is the canvas for a delicious meal. Organise by category to reduce waste."
            </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;