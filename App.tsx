import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import MealPlanner from './components/MealPlanner';
import ShoppingList from './components/ShoppingList';
import Settings from './components/Settings';
import Family from './components/Family';
import CheckMail from './components/CheckMail';
import { Auth } from './components/Auth';
import { inventoryService, supabase } from './services/supabaseService';
import { InventoryItem } from './types';
import { Session } from '@supabase/supabase-js';

type AppView = 'auth' | 'check-mail' | 'app';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<AppView>('auth');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth & Router Logic
  useEffect(() => {
    if (!supabase) return;

    // Check current URL path
    const path = window.location.pathname;
    const isSubscriptionPage = path === '/subscriptions';

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setView('app');
        if (isSubscriptionPage) setActiveTab('settings');
      } else {
         setView('auth');
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setView('app');
      } else {
        setView('auth'); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadInventory = async () => {
    try {
      const items = await inventoryService.getItems();
      setInventoryItems(items);
    } catch (error) {
      console.error("Failed to load inventory", error);
    }
  };

  useEffect(() => {
    if (session) {
        loadInventory();
    }
  }, [session]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard items={inventoryItems} setActiveTab={setActiveTab} />;
      case 'inventory':
        return <Inventory items={inventoryItems} onUpdate={loadInventory} />;
      case 'mealplanner':
        return <MealPlanner inventory={inventoryItems} />;
      case 'shopping':
        return <ShoppingList inventory={inventoryItems} />;
      case 'family':
        return <Family />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard items={inventoryItems} setActiveTab={setActiveTab} />;
    }
  };

  if (isLoading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <div className="w-4 h-4 bg-brand-900 animate-spin"></div>
          </div>
      );
  }

  if (view === 'auth') {
      return (
          <Auth 
            onSuccess={() => setView('check-mail')} 
            onBack={() => {}} 
          />
      );
  }

  if (view === 'check-mail') {
      return <CheckMail onBackToLogin={() => setView('auth')} />;
  }

  // APP VIEW (Authenticated)
  return (
    <div className="flex min-h-screen font-sans text-brand-900">
      <Navigation 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      {/* Main Content Area */}
      {/* Adjusted spacing: Reduced md:mt-32 to md:mt-24 and md:pt-12 to md:pt-6 to remove approx 50-60px of vertical space */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto pt-4 pb-24 md:pt-6 md:mt-24 md:pb-8 px-4 md:px-6 relative z-0 safe-top safe-bottom">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;