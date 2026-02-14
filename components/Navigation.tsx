
import React from 'react';
import { LayoutDashboard, Refrigerator, UtensilsCrossed, Settings as SettingsIcon, ShoppingCart, LogOut, Users, Compass } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { APP_LOGO_URL } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();

  const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'dashboard', label: t('nav.home'), icon: LayoutDashboard },
    { id: 'inventory', label: t('nav.kitchen'), icon: Refrigerator },
    { id: 'explore', label: t('nav.explore'), icon: Compass },
    { id: 'shopping', label: t('nav.shop'), icon: ShoppingCart },
    { id: 'mealplanner', label: t('nav.cook'), icon: UtensilsCrossed },
    { id: 'family', label: t('nav.family'), icon: Users },
    { id: 'settings', label: t('nav.plan'), icon: SettingsIcon },
  ];

  return (
    <>
      {/* DESKTOP TOP NAVIGATION - Industrial/Dark */}
      <nav className="hidden md:flex fixed top-4 left-4 right-4 h-20 bg-[#0f172a]/95 backdrop-blur-xl z-50 px-8 items-center justify-between shadow-2xl rounded-2xl border border-white/10">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 relative bg-white rounded-lg p-1 shadow-sm overflow-hidden">
                 <img src={APP_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight font-mono">SCANDIBOX_OS</span>
         </div>

         <div className="flex items-center gap-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 border border-transparent ${
                            isActive 
                            ? 'bg-white text-black shadow-lg border-white' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Icon size={16} className="mr-2.5" strokeWidth={isActive ? 2.5 : 2} />
                        {item.label}
                    </button>
                )
            })}
         </div>

         <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm font-bold text-gray-400 hover:text-red-400 transition-colors px-4 py-2 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5"
         >
            <LogOut size={16} />
            <span className="hidden lg:inline">{t('nav.exit')}</span>
         </button>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION - Dark Glass */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 nav-glass z-50 pb-safe-bottom pt-2">
        <div className="flex justify-around items-center h-16 px-1">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 active:scale-95 group ${
                            isActive ? 'text-white' : 'text-gray-500'
                        }`}
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        <div className={`mb-1 p-2 rounded-lg transition-all ${isActive ? 'bg-white/10' : 'group-hover:bg-white/5'}`}>
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className={`text-[9px] uppercase font-bold tracking-widest ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
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
