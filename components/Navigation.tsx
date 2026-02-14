import React from 'react';
import { LayoutDashboard, Refrigerator, UtensilsCrossed, Settings as SettingsIcon, ShoppingCart, LogOut } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { APP_LOGO_URL } from '../constants';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Kitchen', icon: Refrigerator },
    { id: 'shopping', label: 'Shop', icon: ShoppingCart },
    { id: 'mealplanner', label: 'Cook', icon: UtensilsCrossed },
    { id: 'settings', label: 'Plan', icon: SettingsIcon },
  ];

  return (
    <>
      {/* DESKTOP TOP NAVIGATION */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-28 bg-[#003385] z-50 px-12 items-center justify-between shadow-lg transition-all">
         <div className="flex items-center gap-5">
            <div className="w-12 h-12 relative bg-white rounded-xl p-1 shadow-md">
                 <img src={APP_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">ScandiBox</span>
         </div>

         <div className="flex items-center bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/10">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                            isActive 
                            ? 'bg-white text-[#003385] shadow-lg scale-105' 
                            : 'text-blue-100 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <Icon size={18} className={`mr-3 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                        {item.label}
                    </button>
                )
            })}
         </div>

         <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm font-bold text-blue-200 hover:text-white transition-colors bg-white/5 px-6 py-3 rounded-xl hover:bg-red-500/20 hover:border-red-400 border border-transparent"
         >
            <LogOut size={18} />
            <span className="hidden lg:inline">Sign Out</span>
         </button>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#003385] border-t border-blue-800 z-50 pb-safe-bottom pt-2 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.2)]">
        <div className="flex justify-around items-center h-20 px-2">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 active:scale-90 ${
                            isActive ? 'text-white' : 'text-blue-300/70'
                        }`}
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        <div className={`mb-1 p-1.5 rounded-xl transition-all ${isActive ? 'bg-white/10 translate-y-[-2px]' : ''}`}>
                            <Icon size={24} className={isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
                        </div>
                        <span className={`text-[9px] uppercase tracking-widest font-bold ${isActive ? 'opacity-100' : 'opacity-0 scale-0'} transition-all duration-200`}>
                            {item.label}
                        </span>
                    </button>
                )
            })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;